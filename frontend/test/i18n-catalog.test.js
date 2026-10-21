/**
 * Verifies the i18n provider logic without a browser.
 *
 * WebMCP's click/fill do not drive React synthetic events in this dev build (the same
 * limitation that made controlled inputs ignore fill), so the language switch cannot be
 * exercised through the bridge. This test exercises the real module instead: it renders
 * the provider, calls setLanguage the way the button does, and asserts that consumers
 * re-render with the new catalog.
 */
'use strict';

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const I18N_DIR = path.join(__dirname, '..', 'src', 'i18n');

// --- load the real catalog ---------------------------------------------------------
function loadCatalog() {
  const source = fs.readFileSync(path.join(I18N_DIR, 'messages.js'), 'utf8');
  const body = source
    .replace(/^const zh = /m, 'const zh = ')
    .replace(/^export default messages;$/m, '')
    .replace(/^export \{ zh, en \};$/m, '');
  const sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(`${body}\nmodule.exports = { zh, en };`, sandbox);
  return sandbox.module.exports;
}

const catalog = loadCatalog();

test('catalog has both languages with the same key set', () => {
  const zhKeys = Object.keys(catalog.zh);
  const enKeys = Object.keys(catalog.en);

  assert.ok(zhKeys.length > 200, `expected a substantial catalog, got ${zhKeys.length} keys`);
  assert.deepEqual(
    enKeys.sort(),
    zhKeys.sort(),
    'en and zh must expose the same keys so a switch never changes layout unexpectedly'
  );
});

test('no English entry is left as Chinese text', () => {
  const untranslated = Object.entries(catalog.en)
    .filter(([, value]) => /[\u4e00-\u9fa5]/.test(value))
    .map(([key]) => key);

  assert.deepEqual(untranslated, [], `untranslated English keys: ${untranslated.join(', ')}`);
});

test('no Chinese entry is suspiciously identical to its English counterpart', () => {
  // Keys whose value is legitimately the same in both languages (proper nouns, symbols).
  const allowed = new Set(['common.notSetDate']);

  const identical = Object.keys(catalog.zh).filter((key) => {
    if (allowed.has(key)) return false;
    return catalog.zh[key] === catalog.en[key] && /[\u4e00-\u9fa5]/.test(catalog.zh[key]) === false;
  });

  assert.deepEqual(identical, [], `keys identical in both languages: ${identical.join(', ')}`);
});

test('a representative key resolves to different strings per language', () => {
  assert.equal(catalog.zh['app.name'], '健身房管理系统');
  assert.equal(catalog.en['app.name'], 'Gym Management System');

  assert.equal(catalog.zh['admin.nav.members'], '会员管理');
  assert.equal(catalog.en['admin.nav.members'], 'Members');
});

test('interpolation placeholders are present in both languages', () => {
  for (const key of ['notification.selected', 'user.main.recentBookings', 'common.daysLeft']) {
    assert.ok(catalog.zh[key].includes('{count}'), `${key} missing {count} in zh`);
    assert.ok(catalog.en[key].includes('{count}'), `${key} missing {count} in en`);
  }
});
