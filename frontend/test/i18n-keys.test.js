/**
 * Fails if any t('...') call references a key missing from the catalog.
 *
 * translate() returns the key verbatim when it is unknown, which keeps a page from
 * crashing but surfaces a raw key in the UI. This catches that before release.
 */
'use strict';

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const SRC = path.join(__dirname, '..', 'src');

function loadCatalog() {
  const source = fs.readFileSync(path.join(SRC, 'i18n', 'messages.js'), 'utf8');
  const body = source
    .replace(/^export default messages;$/m, '')
    .replace(/^export \{ zh, en \};$/m, '');
  const sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(`${body}\nmodule.exports = { zh, en };`, sandbox);
  return sandbox.module.exports;
}

function jsFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      if (entry !== 'i18n') jsFiles(full, acc);
    } else if (entry.endsWith('.js')) {
      acc.push(full);
    }
  }
  return acc;
}

test('every t() key used in the source exists in the catalog', () => {
  const catalog = loadCatalog();
  const known = new Set(Object.keys(catalog.zh));

  const missing = [];
  for (const file of jsFiles(SRC)) {
    const source = fs.readFileSync(file, 'utf8');
    // Match t('dotted.key') only: the key must start with a lowercase area segment and
    // contain a dot, which excludes API paths like t('/member/all').
    for (const match of source.matchAll(/\bt\('([a-z][a-zA-Z0-9]*\.[\w.]+)'/g)) {
      if (!known.has(match[1])) {
        missing.push(`${path.relative(SRC, file)}: ${match[1]}`);
      }
    }
  }

  assert.deepEqual(missing, [], `unknown keys referenced:\n${missing.join('\n')}`);
});

test('catalog keys follow the area.name convention', () => {
  const catalog = loadCatalog();
  const malformed = Object.keys(catalog.zh).filter(
    (key) => !/^[a-z][a-zA-Z0-9]*\.[\w.]+$/.test(key)
  );

  assert.deepEqual(malformed, [], `malformed keys: ${malformed.join(', ')}`);
});
