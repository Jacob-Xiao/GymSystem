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

  const stats = await loginService.getAdminDashboardStats();

  assert.equal(typeof stats.memberTotal, 'number');
  assert.equal(typeof stats.employeeTotal, 'number');
  assert.equal(typeof stats.equipmentTotal, 'number');
  assert.equal(
    stats.humanTotal,
    stats.memberTotal + stats.employeeTotal,
    'humanTotal must be derived from the two headcounts'
  );

  const [memberRows] = await db.execute('SELECT COUNT(*) AS count FROM member');
  const [employeeRows] = await db.execute('SELECT COUNT(*) AS count FROM employee');
  const [equipmentRows] = await db.execute('SELECT COUNT(*) AS count FROM equipment');

  assert.equal(stats.memberTotal, memberRows[0].count);
  assert.equal(stats.employeeTotal, employeeRows[0].count);
  assert.equal(stats.equipmentTotal, equipmentRows[0].count);
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
