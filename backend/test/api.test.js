'use strict';

// Compression must trigger for tiny payloads so the assertion is meaningful; the limiter
// is disabled for the main app and enabled explicitly in the limiter test below.
process.env.COMPRESSION_THRESHOLD = '1';
process.env.RATE_LIMIT_ENABLED = 'false';
process.env.REQUEST_TIMEOUT_MS = '5000';

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('node:zlib');

const { buildApp } = require('../server');
const db = require('../config/database');

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

function request(baseUrl, path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Build an app with temporary env overrides applied only during buildApp().
function buildAppWithEnv(overrides) {
  const saved = {};
  for (const [key, value] of Object.entries(overrides)) {
    saved[key] = process.env[key];
    process.env[key] = value;
  }
  const app = buildApp();
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return app;
}

let server;
let baseUrl;

test.before(async () => {
  ({ server, baseUrl } = await listen(buildApp()));
});

test.after(async () => {
  await close(server);
  await db.end();
});

test('liveness probe returns OK without touching the database', async () => {
  const res = await request(baseUrl, '/api/health');
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body.toString());
  assert.equal(body.status, 'OK');
  assert.ok(body.pid > 0);
});

test('readiness probe reports the database as up', async () => {
  const res = await request(baseUrl, '/api/ready');
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body.toString());
  assert.equal(body.status, 'READY');
  assert.equal(body.database, 'up');
  assert.ok(body.pool.connectionLimit > 0);
});

test('compresses JSON responses when the client accepts gzip', async () => {
  const res = await request(baseUrl, '/api/class/all', { 'Accept-Encoding': 'gzip' });

  assert.equal(res.status, 200);
  assert.equal(res.headers['content-encoding'], 'gzip');
  assert.match(res.headers.vary || '', /Accept-Encoding/);

  const decoded = JSON.parse(zlib.gunzipSync(res.body).toString());
  assert.equal(decoded.success, true);
  assert.ok(Array.isArray(decoded.data));
  assert.ok(decoded.data.length > 0, 'class list should not be empty');
});

test('serves plain JSON when the client does not accept gzip', async () => {
  const res = await request(baseUrl, '/api/class/all');
  assert.equal(res.status, 200);
  assert.equal(res.headers['content-encoding'], undefined);
  const decoded = JSON.parse(res.body.toString());
  assert.equal(decoded.success, true);
});

test('member list omits the base64 photo column but keeps the other fields', async () => {
  const res = await request(baseUrl, '/api/member/all');
  assert.equal(res.status, 200);

  const decoded = JSON.parse(res.body.toString());
  assert.equal(decoded.success, true);
  assert.ok(decoded.data.length > 0);

  const row = decoded.data[0];
  assert.ok('member_account' in row, 'expected member_account to be present');
  assert.ok('member_name' in row, 'expected member_name to be present');
  assert.equal('member_photo' in row, false, 'list payload must not ship base64 photos');
});

test('equipment list omits the blob columns but keeps the rendered fields', async () => {
  const res = await request(baseUrl, '/api/equipment/all');
  assert.equal(res.status, 200);

  const decoded = JSON.parse(res.body.toString());
  assert.ok(decoded.data.length > 0);

  const row = decoded.data[0];
  assert.ok('equipment_name' in row);
  assert.ok('equipment_status' in row);
  assert.equal('equipment_image' in row, false, 'list payload must not ship base64 images');
  assert.equal('equipment_function' in row, false);
});

test('member list pagination bounds the result set and keeps the default unlimited', async () => {
  const all = await request(baseUrl, '/api/member/all');
  const allRows = JSON.parse(all.body.toString()).data;
  assert.ok(allRows.length > 3, 'fixture needs more than 3 members for this test');

  const paged = await request(baseUrl, '/api/member/all?pageSize=3');
  assert.equal(paged.status, 200);
  const pageRows = JSON.parse(paged.body.toString()).data;
  assert.equal(pageRows.length, 3, 'pageSize must bound the result');

  const secondPage = await request(baseUrl, '/api/member/all?pageSize=3&page=2');
  const secondRows = JSON.parse(secondPage.body.toString()).data;
  assert.equal(secondRows.length, 3);
  assert.notEqual(
    secondRows[0].member_account,
    pageRows[0].member_account,
    'page 2 must not repeat page 1'
  );
});

test('unknown API routes return a JSON 404', async () => {
  const res = await request(baseUrl, '/api/definitely-not-a-route');
  assert.equal(res.status, 404);
  const body = JSON.parse(res.body.toString());
  assert.equal(body.success, false);
});

test('deleting a class removes its orders in the same transaction', async () => {
  const classId = 999902;

  await db.execute('DELETE FROM class_order WHERE class_id = ?', [classId]);
  await db.execute('DELETE FROM class_table WHERE class_id = ?', [classId]);
  await db.execute(
    `INSERT INTO class_table (class_id, class_name, class_begin, class_time, coach)
     VALUES (?, 'delete-test-class', '2030-01-01 10:00', '60', 'test')`,
    [classId]
  );
  await db.execute(
    `INSERT INTO class_order (class_id, class_name, coach, member_name, member_account, class_begin)
     VALUES (?, 'delete-test-class', 'test', 'delete-test-member', 999900003, '2030-01-01 10:00')`,
    [classId]
  );

  try {
    const deleteRes = await request(baseUrl, `/api/class/${classId}`, {}, 'DELETE');
    assert.equal(deleteRes.status, 200);

    const [classes] = await db.execute('SELECT COUNT(*) AS count FROM class_table WHERE class_id = ?', [classId]);
    const [orders] = await db.execute('SELECT COUNT(*) AS count FROM class_order WHERE class_id = ?', [classId]);

    assert.equal(classes[0].count, 0, 'class row must be deleted');
    assert.equal(orders[0].count, 0, 'related orders must be deleted');
  } finally {
    await db.execute('DELETE FROM class_order WHERE class_id = ?', [classId]);
    await db.execute('DELETE FROM class_table WHERE class_id = ?', [classId]);
  }
});

test('rate limiter rejects requests over the configured ceiling with 429', async () => {
  const limited = buildAppWithEnv({ RATE_LIMIT_ENABLED: 'true', RATE_LIMIT_MAX: '2' });
  const { server: limitedServer, baseUrl: limitedUrl } = await listen(limited);

  try {
    const first = await request(limitedUrl, '/api/class/all');
    const second = await request(limitedUrl, '/api/class/all');
    const third = await request(limitedUrl, '/api/class/all');

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429, 'third request should be throttled');
    assert.ok(Number(third.headers['retry-after']) >= 1);

    const body = JSON.parse(third.body.toString());
    assert.equal(body.success, false);
  } finally {
    await close(limitedServer);
  }
});
