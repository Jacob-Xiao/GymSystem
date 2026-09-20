const mysql = require('mysql2/promise');
const os = require('node:os');
require('dotenv').config();

function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Each Node worker owns its own pool, so effective connections = connectionLimit x workers.
// A fixed limit of 50 under 12 cluster workers would ask MySQL for 600 connections against
// a typical max_connections of 151, and every worker past the cap would start failing with
// "Too many connections" under load. When clustering, divide a global budget instead.
//
// The worker count here must match the one server.js uses to fork (same env var, same
// os.cpus() fallback).
function resolveConnectionLimit() {
  const explicit = intFromEnv('DB_CONNECTION_LIMIT', null);
  if (explicit !== null) return explicit;

  if (process.env.CLUSTER_ENABLED !== 'true') return 50;

  const workers = Math.max(1, intFromEnv('CLUSTER_WORKERS', os.cpus().length));
  const budget = intFromEnv('DB_CONNECTION_BUDGET', 100);
  return Math.max(2, Math.floor(budget / workers));
}

const connectionLimit = resolveConnectionLimit();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME || 'gym_management_system',
  waitForConnections: true,
  // The original limit of 10 was the main throughput ceiling; the unbounded queue
  // (queueLimit: 0) turned saturation into unbounded memory growth. Bound both.
  connectionLimit,
  queueLimit: intFromEnv('DB_QUEUE_LIMIT', 2000),
  maxIdle: connectionLimit,
  idleTimeout: intFromEnv('DB_IDLE_TIMEOUT_MS', 60000),
  connectTimeout: intFromEnv('DB_CONNECT_TIMEOUT_MS', 10000),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4_general_ci',
  // Never allow request-supplied multi-statement SQL; migrations are executed by a script.
  multipleStatements: false,
  // Fail loudly rather than silently turning DATETIME into a JS Date with local-time drift.
  dateStrings: false
});

// Run `fn` inside a single connection transaction. Used to close check-then-insert
// races (booking conflicts, duplicate enrolment, duplicate share requests) that the
// original code left open.
pool.withTransaction = async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {
      // Rollback failure must not mask the original error.
    }
    throw error;
  } finally {
    connection.release();
  }
};

// Lightweight liveness probe used by /api/health.
pool.ping = async function ping() {
  await pool.query('SELECT 1');
  return true;
};

// Pool counters for the readiness endpoint. mysql2's pool exposes these on its
// internal generic-pool; guard so a driver upgrade cannot crash the health route.
pool.snapshot = function snapshot() {
  const inner = pool.pool;
  return {
    connectionLimit,
    total: inner && inner._allConnections ? inner._allConnections.length : null,
    free: inner && inner._freeConnections ? inner._freeConnections.length : null,
    queued: inner && inner._connectionQueue ? inner._connectionQueue.length : null
  };
};

module.exports = pool;
