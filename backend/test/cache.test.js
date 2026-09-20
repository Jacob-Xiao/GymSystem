'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { TtlCache } = require('../config/cache');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('serves from cache within the TTL and reloads after expiry', async () => {
  const cache = new TtlCache({ defaultTtlMs: 40, maxEntries: 10 });
  let loads = 0;
  const loader = async () => {
    loads += 1;
    return { n: loads };
  };

  const first = await cache.wrap('k', undefined, loader);
  const second = await cache.wrap('k', undefined, loader);

  assert.equal(loads, 1, 'second read must be served from cache');
  assert.deepEqual(first, second);

  await sleep(60);

  const third = await cache.wrap('k', undefined, loader);
  assert.equal(loads, 2, 'value must be reloaded after TTL expiry');
  assert.deepEqual(third, { n: 2 });
});

test('collapses concurrent misses for the same key into one load (single-flight)', async () => {
  const cache = new TtlCache({ defaultTtlMs: 1000, maxEntries: 10 });

  let loads = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });

  const loader = async () => {
    loads += 1;
    await gate;
    return 'value';
  };

  const p1 = cache.wrap('k', 1000, loader);
  const p2 = cache.wrap('k', 1000, loader);
  const p3 = cache.wrap('k', 1000, loader);

  release();
  const results = await Promise.all([p1, p2, p3]);

  assert.equal(loads, 1, 'loader must run once for concurrent misses');
  assert.deepEqual(results, ['value', 'value', 'value']);
  assert.equal(cache.stats().coalesced, 2);
  assert.equal(cache.stats().inflight, 0, 'inflight entry must be cleared');
});

test('does not cache a failed load and retries on the next call', async () => {
  const cache = new TtlCache({ defaultTtlMs: 1000, maxEntries: 10 });
  let attempts = 0;
  const failing = async () => {
    attempts += 1;
    throw new Error('boom');
  };

  await assert.rejects(() => cache.wrap('k', 1000, failing), /boom/);
  await assert.rejects(() => cache.wrap('k', 1000, failing), /boom/);

  assert.equal(attempts, 2, 'failure must not be cached');
  assert.equal(cache.stats().inflight, 0);
});

test('invalidate removes only keys with the given prefix', async () => {
  const cache = new TtlCache({ defaultTtlMs: 1000, maxEntries: 10 });

  cache.set('class:all', [1]);
  cache.set('class:other', [2]);
  cache.set('equipment:all', [3]);

  const removed = cache.invalidate('class:');

  assert.equal(removed, 2);
  assert.equal(cache.get('class:all'), undefined);
  assert.equal(cache.get('class:other'), undefined);
  assert.deepEqual(cache.get('equipment:all'), [3], 'other namespaces must survive');
});

test('bounds the store and evicts the oldest entry', () => {
  const cache = new TtlCache({ defaultTtlMs: 1000, maxEntries: 2 });

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  assert.equal(cache.stats().size, 2);
  assert.equal(cache.get('a'), undefined, 'oldest entry should be evicted');
  assert.equal(cache.get('b'), 2);
  assert.equal(cache.get('c'), 3);
});

test('reports hit rate and counts hits and misses', () => {
  const cache = new TtlCache({ defaultTtlMs: 1000, maxEntries: 10 });

  cache.set('k', 1);
  cache.get('k');
  cache.get('missing');

  const stats = cache.stats();
  assert.equal(stats.hits, 1);
  assert.equal(stats.misses, 1);
  assert.equal(stats.hitRate, 0.5);
});
