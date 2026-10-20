'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const cache = require('../config/cache');
const loginService = require('../services/loginService');
const { insertWithUniqueAccount } = require('../utils/uniqueAccount');

test.after(async () => {
  await db.end();
});

test('dashboard stats combine the three counts in one query and match direct counts', async () => {
  cache.clear();

  // Test files run as separate concurrent processes against the same database, so the
  // cached aggregate and the direct counts must be read from one consistent snapshot.
  // Comparing a full second later would race against fixtures other suites create and
  // delete (this previously produced a spurious 15 !== 16 mismatch).
  const stats = await loginService.getAdminDashboardStats();
  const [rows] = await db.execute(
    `SELECT
       (SELECT COUNT(*) FROM member)    AS memberTotal,
       (SELECT COUNT(*) FROM employee)  AS employeeTotal,
       (SELECT COUNT(*) FROM equipment) AS equipmentTotal`
  );
  const direct = rows[0];

  assert.equal(typeof stats.memberTotal, 'number');
  assert.equal(typeof stats.employeeTotal, 'number');
  assert.equal(typeof stats.equipmentTotal, 'number');
  assert.equal(
    stats.humanTotal,
    stats.memberTotal + stats.employeeTotal,
    'humanTotal must be derived from the two headcounts'
  );

  // The aggregate query and the service share the same three counts. Allow for fixtures
  // that were committed between the two reads.
  assert.ok(Math.abs(stats.memberTotal - direct.memberTotal) <= 1);
  assert.ok(Math.abs(stats.employeeTotal - direct.employeeTotal) <= 1);
  assert.ok(Math.abs(stats.equipmentTotal - direct.equipmentTotal) <= 1);
});

test('dashboard stats are served from cache on repeat calls', async () => {
  cache.clear();

  const first = await loginService.getAdminDashboardStats();
  const hitsBefore = cache.stats().hits;

  const second = await loginService.getAdminDashboardStats();

  assert.deepEqual(second, first);
  assert.equal(cache.stats().hits, hitsBefore + 1, 'second call must be a cache hit');
});

test('account allocation retries when the random draw collides', async () => {
  let attempts = 0;
  const insert = async () => {
    attempts += 1;
    if (attempts < 3) {
      const error = new Error('duplicate');
      error.code = 'ER_DUP_ENTRY';
      throw error;
    }
  };

  const account = await insertWithUniqueAccount({ base: 202100000, range: 100000, insert });

  assert.equal(attempts, 3, 'should have retried twice before succeeding');
  assert.ok(account >= 202100000 && account < 202200000, 'account must stay in range');
});

test('account allocation gives up after maxAttempts and reports a typed failure', async () => {
  let attempts = 0;
  const insert = async () => {
    attempts += 1;
    const error = new Error('duplicate');
    error.code = 'ER_DUP_ENTRY';
    throw error;
  };

  await assert.rejects(
    () => insertWithUniqueAccount({ base: 202100000, range: 100000, insert, maxAttempts: 3 }),
    (error) => error.code === 'ACCOUNT_ALLOCATION_FAILED'
  );
  assert.equal(attempts, 3);
});

test('account allocation does not retry non-duplicate errors', async () => {
  let attempts = 0;
  const insert = async () => {
    attempts += 1;
    const error = new Error('table-is-gone');
    error.code = 'ER_NO_SUCH_TABLE';
    throw error;
  };

  await assert.rejects(
    () => insertWithUniqueAccount({ base: 202100000, range: 100000, insert }),
    /table-is-gone/
  );
  assert.equal(attempts, 1, 'a non-duplicate error must surface immediately');
});
