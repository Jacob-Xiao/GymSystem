'use strict';

/**
 * Minimal keep-alive load generator built on node:http -- no extra dependency.
 *
 *   node scripts/loadtest.js --url http://localhost:3001/api/class/all --connections 100 --duration 15
 *
 * Reports achieved throughput, status-code mix and latency percentiles so the
 * "handles 1000 QPS" claim can be backed by a measurement instead of an assertion.
 */

const http = require('node:http');
const { URL } = require('node:url');

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index === process.argv.length - 1) return fallback;
  return process.argv[index + 1];
}

const target = arg('url', 'http://localhost:3001/api/class/all');
const connections = Number(arg('connections', 50));
const durationSec = Number(arg('duration', 10));
const method = arg('method', 'GET');
const body = arg('body', null);

const url = new URL(target);
const agent = new http.Agent({ keepAlive: true, maxSockets: connections });

const latencies = [];
const statusCounts = new Map();
let errors = 0;
let stopped = false;

function once() {
  return new Promise((resolve) => {
    const started = process.hrtime.bigint();

    const headers = { 'Accept-Encoding': 'gzip' };
    if (body) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: `${url.pathname}${url.search}`,
      method,
      agent,
      headers
    }, (res) => {
      res.resume();
      res.on('end', () => {
        latencies.push(Number(process.hrtime.bigint() - started) / 1e6);
        statusCounts.set(res.statusCode, (statusCounts.get(res.statusCode) || 0) + 1);
        resolve();
      });
    });

    req.on('error', () => {
      errors += 1;
      resolve();
    });

    if (body) req.write(body);
    req.end();
  });
}

async function worker() {
  while (!stopped) {
    await once();
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

(async () => {
  console.log(`Load test: ${method} ${target}`);
  console.log(`connections=${connections} duration=${durationSec}s\n`);

  const startedAt = Date.now();
  const workers = Array.from({ length: connections }, () => worker());
  const stopper = setTimeout(() => { stopped = true; }, durationSec * 1000);

  await Promise.all(workers);
  clearTimeout(stopper);

  const elapsedSec = (Date.now() - startedAt) / 1000;
  const total = latencies.length + errors;
  const sorted = [...latencies].sort((a, b) => a - b);

  console.log(`elapsed        : ${elapsedSec.toFixed(2)}s`);
  console.log(`total requests : ${total}`);
  console.log(`throughput     : ${(total / elapsedSec).toFixed(1)} req/s`);
  console.log(`transport errs : ${errors}`);
  console.log(`status codes   : ${[...statusCounts.entries()].map(([code, n]) => `${code}=${n}`).join(' ') || 'none'}`);
  console.log(`latency p50    : ${percentile(sorted, 50).toFixed(1)} ms`);
  console.log(`latency p95    : ${percentile(sorted, 95).toFixed(1)} ms`);
  console.log(`latency p99    : ${percentile(sorted, 99).toFixed(1)} ms`);
  console.log(`latency max    : ${(sorted[sorted.length - 1] || 0).toFixed(1)} ms`);

  agent.destroy();
  process.exit(errors > 0 ? 1 : 0);
})().catch((error) => {
  console.error('Load test failed:', error.message);
  process.exit(1);
});
