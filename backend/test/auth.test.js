'use strict';

// Authentication and authorization regression tests.
//
// The important properties:
//   * passwords are stored as bcrypt hashes, and existing plaintext rows still log in
//     (upgrading in place) so the migration cannot lock anyone out
//   * business routes reject missing / invalid / wrong-role tokens
//   * a member cannot read or mutate another member's data by passing their account

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.COMPRESSION_THRESHOLD = '1';
process.env.RATE_LIMIT_ENABLED = 'false';

const { buildApp } = require('../server');
const db = require('../config/database');
const { hashPassword, verifyPassword, isHashed } = require('../config/passwords');
const { signToken } = require('../middleware/auth');

const ADMIN_ACCOUNT = 1001;
// Seeded members; passwords are plaintext on a fresh database.
const MEMBER_A = 202100788;
const MEMBER_B = 202009867;

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

function call(baseUrl, path, { method = 'GET', token, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = payload.length;
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const req = http.request(`${baseUrl}${path}`, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch (_) { /* non-JSON body */ }
        resolve({ status: res.statusCode, body: parsed, raw: text });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let server;
let baseUrl;

async function adminToken() {
  const res = await call(baseUrl, '/api/login/admin', {
    method: 'POST',
    body: { adminAccount: ADMIN_ACCOUNT, adminPassword: '123456' }
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.token, 'login must return a token');
  return res.body.token;
}

async function memberToken(account) {
  const res = await call(baseUrl, '/api/login/user', {
    method: 'POST',
    body: { memberAccount: account, memberPassword: '123456' }
  });
  assert.equal(res.status, 200, `member ${account} fixture login must succeed`);
  return res.body.token;
}

test.before(async () => {
  ({ server, baseUrl } = await listen(buildApp()));
});

test.after(async () => {
  await close(server);
  await db.end();
});

// --- password primitives -----------------------------------------------------------

test('hashPassword produces a bcrypt hash and verifyPassword accepts it', async () => {
  const hash = await hashPassword('s3cret');
  assert.equal(isHashed(hash), true);
  assert.notEqual(hash, 's3cret');

  assert.deepEqual(await verifyPassword('s3cret', hash), { matches: true, needsUpgrade: false });
  assert.deepEqual(await verifyPassword('wrong', hash), { matches: false, needsUpgrade: false });
});

test('verifyPassword accepts legacy plaintext and flags it for upgrade', async () => {
  assert.deepEqual(await verifyPassword('123456', '123456'), { matches: true, needsUpgrade: true });
  assert.deepEqual(await verifyPassword('nope', '123456'), { matches: false, needsUpgrade: false });
});

test('verifyPassword rejects non-string stored values instead of throwing', async () => {
  assert.equal((await verifyPassword('x', null)).matches, false);
  assert.equal((await verifyPassword('x', undefined)).matches, false);
});

// --- login -------------------------------------------------------------------------

test('a legacy plaintext member can log in and the stored password becomes a hash', async () => {
  // Force the row back to plaintext to simulate a pre-migration database.
  await db.execute('UPDATE member SET member_password = ? WHERE member_account = ?', ['123456', MEMBER_A]);

  const res = await call(baseUrl, '/api/login/user', {
    method: 'POST',
    body: { memberAccount: MEMBER_A, memberPassword: '123456' }
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token, 'a successful login must issue a token');

  const [rows] = await db.execute(
    'SELECT member_password FROM member WHERE member_account = ?',
    [MEMBER_A]
  );
  assert.equal(isHashed(rows[0].member_password), true, 'plaintext must be upgraded in place');
  assert.equal(rows[0].member_password.includes('123456'), false);
});

test('a wrong password does not rewrite the stored credential', async () => {
  await db.execute('UPDATE member SET member_password = ? WHERE member_account = ?', ['123456', MEMBER_B]);

  const res = await call(baseUrl, '/api/login/user', {
    method: 'POST',
    body: { memberAccount: MEMBER_B, memberPassword: 'wrong-password' }
  });
  assert.equal(res.status, 401);

  const [rows] = await db.execute(
    'SELECT member_password FROM member WHERE member_account = ?',
    [MEMBER_B]
  );
  assert.equal(rows[0].member_password, '123456', 'a failed guess must not touch the row');
});

test('login responses never include the stored password', async () => {
  const res = await call(baseUrl, '/api/login/user', {
    method: 'POST',
    body: { memberAccount: MEMBER_A, memberPassword: '123456' }
  });
  assert.equal(JSON.stringify(res.body).includes('"member_password"'), false);
  assert.equal(JSON.stringify(res.body).includes('$2'), false, 'hash must not leak either');
});

// --- middleware --------------------------------------------------------------------

test('business routes reject a request with no token', async () => {
  const res = await call(baseUrl, '/api/member/all');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('business routes reject a malformed or forged token', async () => {
  const res = await call(baseUrl, '/api/member/all', { token: 'not.a.jwt' });
  assert.equal(res.status, 401);
});

test('a member token cannot reach admin-only routes', async () => {
  const token = await memberToken(MEMBER_A);

  const res = await call(baseUrl, '/api/member/all', { token });
  assert.equal(res.status, 403, 'member must not list all members');

  const add = await call(baseUrl, '/api/employee/add', {
    method: 'POST',
    token,
    body: { employeeName: 'x', employeeGender: '男', staff: 'y' }
  });
  assert.equal(add.status, 403);
});

test('an admin token can reach admin-only routes', async () => {
  const token = await adminToken();
  const res = await call(baseUrl, '/api/member/all', { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('a member can read their own profile but not another member\'s', async () => {
  const token = await memberToken(MEMBER_A);

  const own = await call(baseUrl, `/api/user/info/${MEMBER_A}`, { token });
  assert.equal(own.status, 200);

  const other = await call(baseUrl, `/api/user/info/${MEMBER_B}`, { token });
  assert.equal(other.status, 403);
});

test('a member cannot update another member\'s profile', async () => {
  const token = await memberToken(MEMBER_A);

  const res = await call(baseUrl, '/api/user/info/update', {
    method: 'PUT',
    token,
    body: { memberAccount: MEMBER_B, memberName: 'hacked' }
  });
  assert.equal(res.status, 403);
});

test('a member cannot act on another member\'s booking by passing their account', async () => {
  const token = await memberToken(MEMBER_A);

  const res = await call(baseUrl, '/api/equipment-booking/booking/create', {
    method: 'POST',
    token,
    body: {
      equipmentId: 1,
      memberAccount: MEMBER_B,
      startTime: '2033-01-01T10:00',
      endTime: '2033-01-01T11:00'
    }
  });
  assert.equal(res.status, 403, 'creating a booking as somebody else must be rejected');
});

test('a token signed for the other role cannot be reused across role checks', async () => {
  // Valid signature, wrong role: this proves authorization is role-based, not just
  // signature-based.
  const forgedRole = signToken({ role: 'member', account: ADMIN_ACCOUNT });
  const res = await call(baseUrl, '/api/member/all', { token: forgedRole });
  assert.equal(res.status, 403);
});
