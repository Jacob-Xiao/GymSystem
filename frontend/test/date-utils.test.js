// Plain node test (no Jest/react-scripts) so the helper can be exercised without a
// DOM. The module is ESM-authored for the app, so it is loaded through a dynamic import
// after a tiny transform is avoided by keeping it dependency-free.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'utils', 'date.js'),
  'utf8'
);

// Evaluate the ES module body as a script by exposing the exports it declares.
function loadDateUtils() {
  const body = source
    .replace(/export const /g, 'const ')
    .replace(/\n\s*export const /g, '\nconst ');
  const sandbox = { module: { exports: {} }, Date, Math, Number, String };
  vm.createContext(sandbox);
  vm.runInContext(
    `${body}\nmodule.exports = { formatDate, formatDateTime, membershipRemaining };`,
    sandbox
  );
  return sandbox.module.exports;
}

const { formatDate, formatDateTime, membershipRemaining } = loadDateUtils();

test('formatDate renders DATE columns as calendar days, not ISO timestamps', () => {
  assert.equal(formatDate('2020-06-05T04:00:00.000Z'), '2020/6/5');
  assert.equal(formatDate('2021-01-01T04:00:00.000Z'), '2021/1/1');
});

test('formatDate degrades gracefully for missing or invalid values', () => {
  assert.equal(formatDate(null), '-');
  assert.equal(formatDate(''), '-');
  assert.equal(formatDate('not-a-date'), 'not-a-date');
});

test('formatDateTime keeps the time component for real moments', () => {
  const formatted = formatDateTime('2030-01-01T10:30:00.000Z');
  assert.match(formatted, /2030/);
  assert.match(formatted, /\d{2}:\d{2}/, 'datetime output must include a time');
  assert.equal(formatted.includes('T'), false, 'must not leak the ISO separator');
});

test('formatDateTime degrades gracefully for missing or invalid values', () => {
  assert.equal(formatDateTime(null), '-');
  assert.equal(formatDateTime(''), '-');
  assert.equal(formatDateTime('not-a-date'), 'not-a-date');
});

test('membershipRemaining reports an unset membership', () => {
  // Field comparison rather than deepEqual: the sandbox above creates objects with its
  // own Object.prototype, so structural identity checks do not apply.
  const missingTime = membershipRemaining(null, 12);
  assert.equal(missingTime.text, '未设置');
  assert.equal(missingTime.expired, false);

  const missingDuration = membershipRemaining('2021-01-01', null);
  assert.equal(missingDuration.text, '未设置');
  assert.equal(missingDuration.expired, false);
});

test('membershipRemaining reports an expired membership', () => {
  const result = membershipRemaining('2020-01-01T00:00:00.000Z', 1);
  assert.equal(result.expired, true);
  assert.equal(result.text, '已过期');
});

test('membershipRemaining counts whole months still remaining', () => {
  // Signed up 6 months ago with a 24 month membership -> 18 months left.
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const result = membershipRemaining(sixMonthsAgo.toISOString(), 24);
  assert.equal(result.expired, false);
  assert.equal(result.text, '18个月');
});
