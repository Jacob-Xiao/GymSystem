'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const cache = require('../config/cache');
const equipmentBookingService = require('../services/equipmentBookingService');
const classOrderService = require('../services/classOrderService');

const TEST_EQUIPMENT_NAME = '__concurrency_test_equipment__';
const TEST_CLASS_ID = 999901;
const TEST_MEMBER_ACCOUNT = 999900001;
const TEST_ROLLBACK_MEMBER_ACCOUNT = 999900002;
const CONCURRENCY = 10;

async function cleanup() {
  await db.execute(
    `DELETE FROM equipment_booking
      WHERE equipment_id IN (SELECT equipment_id FROM (SELECT equipment_id FROM equipment WHERE equipment_name = ?) t)`,
    [TEST_EQUIPMENT_NAME]
  );
  await db.execute('DELETE FROM equipment WHERE equipment_name = ?', [TEST_EQUIPMENT_NAME]);
  await db.execute('DELETE FROM class_order WHERE class_id = ?', [TEST_CLASS_ID]);
  await db.execute('DELETE FROM class_table WHERE class_id = ?', [TEST_CLASS_ID]);
  await db.execute('DELETE FROM member WHERE member_account IN (?, ?)', [TEST_MEMBER_ACCOUNT, TEST_ROLLBACK_MEMBER_ACCOUNT]);
}

async function createTestEquipment() {
  const [result] = await db.execute(
    `INSERT INTO equipment (equipment_name, equipment_location, equipment_status, equipment_message)
     VALUES (?, 'test-room', '正常', '')`,
    [TEST_EQUIPMENT_NAME]
  );
  return result.insertId;
}

async function createTestClassAndMember() {
  await db.execute(
    `INSERT INTO class_table (class_id, class_name, class_begin, class_time, coach)
     VALUES (?, 'concurrency-test-class', '2030-01-01 10:00', '60', 'test')`,
    [TEST_CLASS_ID]
  );
  await db.execute(
    `INSERT INTO member (member_account, member_password, member_name, card_class, card_next_class)
     VALUES (?, '123456', 'concurrency-test-member', 10, 10)`,
    [TEST_MEMBER_ACCOUNT]
  );
  await db.execute(
    `INSERT INTO member (member_account, member_password, member_name, card_class, card_next_class)
     VALUES (?, '123456', 'rollback-test-member', 10, 10)`,
    [TEST_ROLLBACK_MEMBER_ACCOUNT]
  );
}

test.before(async () => {
  cache.clear();
  await cleanup();
});

test.after(async () => {
  await cleanup();
  await db.end();
});

test('concurrent bookings for the same slot produce exactly one active booking', async () => {
  const equipmentId = await createTestEquipment();
  const startTime = '2030-01-01 10:00:00';
  const endTime = '2030-01-01 11:00:00';

  const attempts = await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, () => equipmentBookingService.createBooking({
      equipmentId,
      memberAccount: TEST_MEMBER_ACCOUNT,
      memberName: 'concurrency-test-member',
      startTime,
      endTime,
      locationNote: ''
    }))
  );

  const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
  const rejected = attempts.filter((a) => a.status === 'rejected');

  assert.equal(fulfilled.length, 1, `expected exactly 1 booking to win, got ${fulfilled.length}`);
  assert.equal(rejected.length, CONCURRENCY - 1);
  assert.match(rejected[0].reason.message, /该时间段已被预约/);

  const [rows] = await db.execute(
    "SELECT COUNT(*) AS count FROM equipment_booking WHERE equipment_id = ? AND status = 'active'",
    [equipmentId]
  );
  assert.equal(rows[0].count, 1, 'database must hold exactly one active booking');
});

test('non-overlapping bookings for the same equipment both succeed', async () => {
  const equipmentId = await createTestEquipment();

  const first = await equipmentBookingService.createBooking({
    equipmentId,
    memberAccount: TEST_MEMBER_ACCOUNT,
    memberName: 'a',
    startTime: '2030-02-01 10:00:00',
    endTime: '2030-02-01 11:00:00',
    locationNote: ''
  });
  const second = await equipmentBookingService.createBooking({
    equipmentId,
    memberAccount: TEST_MEMBER_ACCOUNT,
    memberName: 'a',
    startTime: '2030-02-01 11:00:00',
    endTime: '2030-02-01 12:00:00',
    locationNote: ''
  });

  assert.ok(first > 0);
  assert.ok(second > 0);
  assert.notEqual(first, second);
});

test('concurrent class enrolment produces exactly one order', async () => {
  await createTestClassAndMember();

  const attempts = await Promise.allSettled(
    Array.from({ length: CONCURRENCY }, () => classOrderService.insert({
      classId: TEST_CLASS_ID,
      className: 'concurrency-test-class',
      coach: 'test',
      memberName: 'concurrency-test-member',
      memberAccount: TEST_MEMBER_ACCOUNT,
      classBegin: '2030-01-01 10:00'
    }))
  );

  const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
  const duplicates = attempts.filter(
    (a) => a.status === 'rejected' && a.reason.code === 'DUPLICATE_ENROLLMENT'
  );

  assert.equal(fulfilled.length, 1, `expected exactly 1 enrolment to win, got ${fulfilled.length}`);
  assert.equal(duplicates.length, CONCURRENCY - 1);

  const [rows] = await db.execute(
    'SELECT COUNT(*) AS count FROM class_order WHERE class_id = ? AND member_account = ?',
    [TEST_CLASS_ID, TEST_MEMBER_ACCOUNT]
  );
  assert.equal(rows[0].count, 1, 'database must hold exactly one enrolment');
});

test('withTransaction rolls back every statement when the callback throws', async () => {
  await assert.rejects(
    () => db.withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO class_order (class_id, class_name, coach, member_name, member_account, class_begin)
         VALUES (?, 'rollback-test', 'test', 'rollback-test-member', ?, '2030-01-01 10:00')`,
        [TEST_CLASS_ID, TEST_ROLLBACK_MEMBER_ACCOUNT]
      );
      throw new Error('forced-failure');
    }),
    /forced-failure/
  );

  const [rows] = await db.execute(
    'SELECT COUNT(*) AS count FROM class_order WHERE class_name = ?',
    ['rollback-test']
  );
  assert.equal(rows[0].count, 0, 'the rolled-back insert must not be visible');
});

test('withTransaction commits and releases the connection back to the pool', async () => {
  const before = db.snapshot();

  await db.withTransaction(async (connection) => {
    await connection.execute('SELECT 1');
  });

  const after = db.snapshot();
  assert.equal(after.queued, 0, 'no connection should be left queued');
  assert.ok(after.free >= 1, 'connection should be returned to the pool');
  assert.ok(before.connectionLimit === after.connectionLimit);
});
