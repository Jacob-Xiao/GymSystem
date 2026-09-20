'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const cache = require('../config/cache');
const notificationService = require('../services/notificationService');

const TEST_ACCOUNT = 999900001;
const OTHER_ACCOUNT = 999900002;
const insertedIds = [];

async function insertRaw(title, targetType, targetAccountsJson) {
  const [result] = await db.execute(
    `INSERT INTO notification (title, content, target_type, target_accounts)
     VALUES (?, 'test-content', ?, ?)`,
    [title, targetType, targetAccountsJson]
  );
  insertedIds.push(result.insertId);
  return result.insertId;
}

test.before(async () => {
  cache.clear();
});

test.after(async () => {
  if (insertedIds.length > 0) {
    const placeholders = insertedIds.map(() => '?').join(',');
    await db.execute(`DELETE FROM notification WHERE notification_id IN (${placeholders})`, insertedIds);
  }
  await db.end();
});

test('member filter matches both numeric (legacy) and string target_accounts encodings', async () => {
  // Legacy rows written before normalization stored JSON numbers. The admin UI sends
  // member_account as a number, so this is the common case and must not be dropped.
  await insertRaw('t-numeric', 'specific', JSON.stringify([TEST_ACCOUNT]));
  // Normalized rows store JSON strings.
  await insertRaw('t-string', 'specific', JSON.stringify([String(TEST_ACCOUNT)]));
  // A broadcast everyone receives.
  await insertRaw('t-broadcast', 'all', null);
  // Addressed to somebody else.
  await insertRaw('t-other', 'specific', JSON.stringify([OTHER_ACCOUNT]));

  const notifications = await notificationService.findByMemberAccount(TEST_ACCOUNT);
  const titles = notifications.map((n) => n.title);

  assert.ok(titles.includes('t-numeric'), 'numeric target_accounts entry must match');
  assert.ok(titles.includes('t-string'), 'string target_accounts entry must match');
  assert.ok(titles.includes('t-broadcast'), 'broadcast notification must match');
  assert.equal(titles.includes('t-other'), false, 'notification for another member must not match');
});

test('member filter returns json-encoded rows parsed back into arrays', async () => {
  const notifications = await notificationService.findByMemberAccount(TEST_ACCOUNT);

  const numeric = notifications.find((n) => n.title === 't-numeric');
  assert.ok(numeric, 'expected the numeric-target row to be present');
  assert.ok(Array.isArray(numeric.target_accounts), 'target_accounts should be parsed to an array');
  assert.equal(Number(numeric.target_accounts[0]), TEST_ACCOUNT);

  const broadcast = notifications.find((n) => n.title === 't-broadcast');
  assert.equal(broadcast.target_accounts, null);
});

test('a different member does not receive another member targeted notification', async () => {
  const notifications = await notificationService.findByMemberAccount(OTHER_ACCOUNT);
  const titles = notifications.map((n) => n.title);

  assert.ok(titles.includes('t-other'), 'the addressed member should receive it');
  assert.equal(titles.includes('t-numeric'), false);
  assert.equal(titles.includes('t-string'), false);
  assert.ok(titles.includes('t-broadcast'), 'broadcast still reaches everyone');
});

test('create normalizes target accounts to strings and invalidates the cache', async () => {
  const notificationId = await notificationService.create({
    title: 't-created',
    content: 'test-content',
    targetType: 'specific',
    targetAccounts: [TEST_ACCOUNT]
  });
  insertedIds.push(notificationId);

  const [rows] = await db.execute(
    'SELECT target_accounts FROM notification WHERE notification_id = ?',
    [notificationId]
  );
  assert.equal(
    rows[0].target_accounts,
    JSON.stringify([String(TEST_ACCOUNT)]),
    'new rows should be stored with string-encoded accounts'
  );

  const notifications = await notificationService.findByMemberAccount(TEST_ACCOUNT);
  assert.ok(notifications.map((n) => n.title).includes('t-created'));
});
