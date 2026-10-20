'use strict';

// Regression tests for the state/ownership gaps in the equipment booking flow:
//   * an already-cancelled booking could be "cancelled" again and reported as success
//   * any caller could lock (complete) another member's training session
//   * accepting a share request on a cancelled or finished booking was allowed

const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../config/database');
const cache = require('../config/cache');
const equipmentBookingService = require('../services/equipmentBookingService');

const TEST_EQUIPMENT_NAME = '__invariant_test_equipment__';
const OWNER_ACCOUNT = 999920001;
const REQUESTER_ACCOUNT = 999920002;
const OTHER_ACCOUNT = 999920003;

async function cleanup() {
  await db.execute(
    `DELETE FROM equipment_training_record
      WHERE session_id IN (
        SELECT session_id FROM equipment_training_session
         WHERE booking_id IN (
           SELECT booking_id FROM equipment_booking
            WHERE equipment_id IN (SELECT equipment_id FROM (SELECT equipment_id FROM equipment WHERE equipment_name = ?) t)
         )
      )`,
    [TEST_EQUIPMENT_NAME]
  );
  await db.execute(
    `DELETE FROM equipment_training_session
      WHERE booking_id IN (
        SELECT booking_id FROM equipment_booking
         WHERE equipment_id IN (SELECT equipment_id FROM (SELECT equipment_id FROM equipment WHERE equipment_name = ?) t)
      )`,
    [TEST_EQUIPMENT_NAME]
  );
  await db.execute(
    `DELETE FROM equipment_share_request
      WHERE booking_id IN (
        SELECT booking_id FROM equipment_booking
         WHERE equipment_id IN (SELECT equipment_id FROM (SELECT equipment_id FROM equipment WHERE equipment_name = ?) t)
      )`,
    [TEST_EQUIPMENT_NAME]
  );
  await db.execute(
    `DELETE FROM equipment_booking
      WHERE equipment_id IN (SELECT equipment_id FROM (SELECT equipment_id FROM equipment WHERE equipment_name = ?) t)`,
    [TEST_EQUIPMENT_NAME]
  );
  await db.execute('DELETE FROM equipment WHERE equipment_name = ?', [TEST_EQUIPMENT_NAME]);
  await db.execute('DELETE FROM member WHERE member_account IN (?, ?, ?)', [
    OWNER_ACCOUNT,
    REQUESTER_ACCOUNT,
    OTHER_ACCOUNT
  ]);
}

async function createEquipment() {
  const [result] = await db.execute(
    `INSERT INTO equipment (equipment_name, equipment_location, equipment_status, equipment_message)
     VALUES (?, 'invariant-room', '正常', '')`,
    [TEST_EQUIPMENT_NAME]
  );
  return result.insertId;
}

async function createBooking(equipmentId, account, startTime, endTime) {
  const [result] = await db.execute(
    `INSERT INTO equipment_booking
       (equipment_id, member_account, member_name, start_time, end_time, location_note, status)
     VALUES (?, ?, 'invariant-member', ?, ?, '', 'active')`,
    [equipmentId, account, startTime, endTime]
  );
  return result.insertId;
}

test.before(async () => {
  cache.clear();
  await cleanup();
  for (const account of [OWNER_ACCOUNT, REQUESTER_ACCOUNT, OTHER_ACCOUNT]) {
    await db.execute(
      `INSERT INTO member (member_account, member_password, member_name, card_class, card_next_class)
       VALUES (?, '123456', 'invariant-member', 10, 10)`,
      [account]
    );
  }
});

test.after(async () => {
  await cleanup();
  await db.end();
});

test('cancelling an already-cancelled booking reports failure instead of success', async () => {
  const equipmentId = await createEquipment();
  const bookingId = await createBooking(
    equipmentId,
    OWNER_ACCOUNT,
    '2031-01-01 10:00:00',
    '2031-01-01 11:00:00'
  );

  assert.equal(await equipmentBookingService.cancelBooking(bookingId, OWNER_ACCOUNT), true);
  assert.equal(
    await equipmentBookingService.cancelBooking(bookingId, OWNER_ACCOUNT),
    false,
    'a second cancel must not be reported as a success'
  );
});

test('a member cannot cancel somebody else\'s booking', async () => {
  const equipmentId = await createEquipment();
  const bookingId = await createBooking(
    equipmentId,
    OWNER_ACCOUNT,
    '2031-01-02 10:00:00',
    '2031-01-02 11:00:00'
  );

  assert.equal(await equipmentBookingService.cancelBooking(bookingId, OTHER_ACCOUNT), false);

  const [rows] = await db.execute(
    'SELECT status FROM equipment_booking WHERE booking_id = ?',
    [bookingId]
  );
  assert.equal(rows[0].status, 'active');
});

test('only the booking owner can complete a training session', async () => {
  const equipmentId = await createEquipment();
  const bookingId = await createBooking(
    equipmentId,
    OWNER_ACCOUNT,
    '2031-01-03 10:00:00',
    '2031-01-03 11:00:00'
  );

  const saved = await equipmentBookingService.saveTrainingRecords(
    bookingId,
    [{ set_number: 1, weight: '20', repetitions: '12', completed: false, exercise_name: '卧推' }],
    false,
    OWNER_ACCOUNT
  );
  const sessionId = saved[0].session_id;

  await assert.rejects(
    () => equipmentBookingService.completeSession(sessionId, OTHER_ACCOUNT),
    /仅预约所有者/
  );

  await assert.rejects(
    () => equipmentBookingService.completeSession(sessionId),
    /缺少当前用户信息/
  );

  const [before] = await db.execute(
    'SELECT status FROM equipment_training_session WHERE session_id = ?',
    [sessionId]
  );
  assert.equal(before[0].status, 'confirmed', 'an unauthorised call must not lock the session');

  await equipmentBookingService.completeSession(sessionId, OWNER_ACCOUNT);

  const [after] = await db.execute(
    'SELECT status FROM equipment_training_session WHERE session_id = ?',
    [sessionId]
  );
  assert.equal(after[0].status, 'completed');

  await assert.rejects(
    () => equipmentBookingService.completeSession(sessionId, OWNER_ACCOUNT),
    /已锁定/,
    'a locked session cannot be completed twice'
  );
});

test('share requests cannot be accepted once the booking is cancelled', async () => {
  const equipmentId = await createEquipment();
  const bookingId = await createBooking(
    equipmentId,
    OWNER_ACCOUNT,
    '2031-01-04 10:00:00',
    '2031-01-04 11:00:00'
  );

  const requestId = await equipmentBookingService.createShareRequest(
    bookingId,
    REQUESTER_ACCOUNT,
    'requester'
  );

  await equipmentBookingService.cancelBooking(bookingId, OWNER_ACCOUNT);

  await assert.rejects(
    () => equipmentBookingService.handleShareRequest(requestId, OWNER_ACCOUNT, 'accept'),
    /预约已失效/
  );

  const [rows] = await db.execute(
    'SELECT status FROM equipment_share_request WHERE request_id = ?',
    [requestId]
  );
  assert.equal(rows[0].status, 'pending', 'the request must stay unhandled');
});

test('a share request cannot be handled twice', async () => {
  const equipmentId = await createEquipment();
  const bookingId = await createBooking(
    equipmentId,
    OWNER_ACCOUNT,
    '2031-01-05 10:00:00',
    '2031-01-05 11:00:00'
  );

  const requestId = await equipmentBookingService.createShareRequest(
    bookingId,
    REQUESTER_ACCOUNT,
    'requester'
  );

  await equipmentBookingService.handleShareRequest(requestId, OWNER_ACCOUNT, 'accept');

  await assert.rejects(
    () => equipmentBookingService.handleShareRequest(requestId, OWNER_ACCOUNT, 'accept'),
    /已处理/
  );
});
