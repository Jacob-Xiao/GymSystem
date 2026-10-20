'use strict';

// Regression tests for the partial-update bug: the admin edit form does not send
// `memberPhoto`, and the old implementation wrote every column with `|| null`, so editing
// a phone number silently erased the stored photo. The same path also returned the
// plaintext password through the list and profile endpoints.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.COMPRESSION_THRESHOLD = '1';
process.env.RATE_LIMIT_ENABLED = 'false';

const { buildApp } = require('../server');
const db = require('../config/database');
const memberService = require('../services/memberService');
const { buildUpdate } = require('../services/memberService');

const TEST_ACCOUNT = 999910001;
const PHOTO = `data:image/png;base64,${'A'.repeat(64)}`;

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function request(baseUrl, path, body, method = 'GET') {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = http.request(
      `${baseUrl}${path}`,
      {
        method,
        headers: payload
          ? { 'Content-Type': 'application/json', 'Content-Length': payload.length }
          : {}
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString()
        }));
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let server;
let baseUrl;

async function cleanup() {
  await db.execute('DELETE FROM member WHERE member_account = ?', [TEST_ACCOUNT]);
}

async function seedMember() {
  await cleanup();
  await db.execute(
    `INSERT INTO member
       (member_account, member_password, member_name, member_gender, member_age,
        member_height, member_weight, member_phone, card_time, card_class, card_next_class, member_photo)
     VALUES (?, '123456', 'photo-test', '男', 30, 180, 75, 13800000000, '2021-01-01', 10, 10, ?)`,
    [TEST_ACCOUNT, PHOTO]
  );
}

test.before(async () => {
  ({ server, baseUrl } = await listen(buildApp()));
});

test.after(async () => {
  await cleanup();
  await close(server);
  await db.end();
});

test('buildUpdate omits columns that are absent from the request', () => {
  const statement = buildUpdate(
    { memberAccount: 1, memberName: '新名字' },
    false
  );

  assert.match(statement.sql, /member_name = \?/);
  assert.equal(
    /member_photo/.test(statement.sql),
    false,
    'an update without memberPhoto must not touch the photo column'
  );
  assert.equal(
    /member_password/.test(statement.sql),
    false,
    'the password is never updated through this path'
  );
  assert.equal(statement.values.length, 2);
});

test('buildUpdate lets an explicit empty string clear a column', () => {
  const statement = buildUpdate({ memberAccount: 1, memberPhoto: '' }, false);

  assert.match(statement.sql, /member_photo = \?/);
  assert.equal(statement.values[0], null, 'empty string clears the column');
});

test('buildUpdate writes nothing when no editable field is supplied', () => {
  assert.equal(buildUpdate({ memberAccount: 1 }, false), null);
});

test('updating a member through the API preserves the stored photo', async () => {
  await seedMember();

  const before = await memberService.findByAccount(TEST_ACCOUNT);
  assert.equal(before.member_photo, PHOTO, 'fixture must start with a photo');

  const res = await request(
    baseUrl,
    '/api/member/update',
    { memberAccount: TEST_ACCOUNT, memberName: '改名后', memberGender: '男', memberPhone: 13900000000 },
    'PUT'
  );
  assert.equal(res.status, 200);

  const after = await memberService.findByAccount(TEST_ACCOUNT);
  assert.equal(after.member_photo, PHOTO, 'an admin edit must not erase the photo');
  assert.equal(after.member_name, '改名后');
  assert.equal(Number(after.member_phone), 13900000000);
});

test('partial update leaves untouched columns alone', async () => {
  await seedMember();

  await memberService.update({ memberAccount: TEST_ACCOUNT, memberPhone: 13711112222 });

  const after = await memberService.findByAccount(TEST_ACCOUNT);
  assert.equal(Number(after.member_phone), 13711112222);
  assert.equal(after.member_name, 'photo-test', 'name must survive a phone-only update');
  assert.equal(after.card_class, 10, 'card_class must survive a phone-only update');
  assert.equal(after.member_photo, PHOTO);
});

test('member list does not expose the password or the photo blob', async () => {
  await seedMember();

  const res = await request(baseUrl, '/api/member/all');
  assert.equal(res.status, 200);
  const rows = JSON.parse(res.body).data;
  const row = rows.find((r) => Number(r.member_account) === TEST_ACCOUNT);

  assert.ok(row, 'fixture member must be listed');
  assert.equal('member_password' in row, false, 'list payload must not leak the password');
  assert.equal('member_photo' in row, false, 'list payload must not ship base64 photos');
});

test('member detail exposes the photo but never the password', async () => {
  await seedMember();

  const res = await request(baseUrl, `/api/member/${TEST_ACCOUNT}`);
  assert.equal(res.status, 200);
  const member = JSON.parse(res.body).data[0];

  assert.equal(member.member_photo, PHOTO, 'the edit form needs the photo');
  assert.equal('member_password' in member, false, 'detail payload must not leak the password');
});

test('user profile endpoint never returns the password', async () => {
  await seedMember();

  const res = await request(baseUrl, `/api/user/info/${TEST_ACCOUNT}`);
  assert.equal(res.status, 200);
  const member = JSON.parse(res.body).data;

  assert.equal('member_password' in member, false);
  assert.equal(member.member_name, 'photo-test');
});
