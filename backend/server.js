require('dotenv').config();

const cluster = require('node:cluster');
const os = require('node:os');
const express = require('express');
const cors = require('cors');

const pool = require('./config/database');
const cache = require('./config/cache');
const { compression, rateLimit, requestTimeout } = require('./middleware/performance');

function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const PORT = process.env.PORT || 3001;
const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';

function buildApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', process.env.TRUST_PROXY === 'true');

  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

  // --- Probe endpoints (registered before the limiter so they are never throttled) ---

  // Liveness: process is up. Deliberately does not touch the database.
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Server is running',
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime())
    });
  });

  // Readiness: safe to receive traffic (database reachable).
  app.get('/api/ready', async (req, res) => {
    try {
      await pool.ping();
      res.json({ status: 'READY', database: 'up', pool: pool.snapshot() });
    } catch (error) {
      res.status(503).json({ status: 'NOT_READY', database: 'down', message: error.message });
    }
  });

  // Lightweight operational counters (no external dependency).
  app.get('/api/metrics', (req, res) => {
    const memory = process.memoryUsage();
    res.json({
      pid: process.pid,
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal
      },
      pool: pool.snapshot(),
      cache: cache.stats(),
      eventLoopDelayMs: eventLoopDelay.snapshot()
    });
  });

  app.use(rateLimit());
  app.use(requestTimeout());

  // --- Routes ---
  const loginRoutes = require('./routes/login');
  const memberRoutes = require('./routes/member');
  const employeeRoutes = require('./routes/employee');
  const equipmentRoutes = require('./routes/equipment');
  const classRoutes = require('./routes/class');
  const userRoutes = require('./routes/user');
  const equipmentBookingRoutes = require('./routes/equipmentBooking');
  const notificationRoutes = require('./routes/notification');

  app.use('/api/login', loginRoutes);
  app.use('/api/member', memberRoutes);
  app.use('/api/employee', employeeRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/class', classRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/equipment-booking', equipmentBookingRoutes);
  app.use('/api/notification', notificationRoutes);

  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: '接口不存在' });
  });

  // Terminal error handler: keeps stack traces out of responses and avoids the
  // default HTML error page under load.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (res.headersSent) return;
    const status = error && error.status ? error.status : 500;
    if (status >= 500) {
      console.error('[error]', req.method, req.originalUrl, error && error.message);
    }
    res.status(status).json({ success: false, message: error && error.message ? error.message : '服务器内部错误' });
  });

  return app;
}

// Tracks event-loop responsiveness; a lagging loop is the first symptom of CPU
// saturation in a single-threaded Node process.
const eventLoopDelay = (() => {
  const samples = [];
  let last = process.hrtime.bigint();
  const timer = setInterval(() => {
    const now = process.hrtime.bigint();
    const deltaMs = Number(now - last) / 1e6;
    last = now;
    // Expected tick is ~250ms; record how much extra latency accumulated.
    samples.push(Math.max(0, deltaMs - 250));
    if (samples.length > 20) samples.shift();
  }, 250);
  if (typeof timer.unref === 'function') timer.unref();

  return {
    snapshot() {
      if (samples.length === 0) return { avg: 0, max: 0, samples: 0 };
      const sum = samples.reduce((acc, value) => acc + value, 0);
      return {
        avg: Number((sum / samples.length).toFixed(2)),
        max: Number(Math.max(...samples).toFixed(2)),
        samples: samples.length
      };
    }
  };
})();

function startServer() {
  const app = buildApp();
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (pid ${process.pid}, body limit ${BODY_LIMIT})`);
  });

  // Keep connections alive across requests (important behind a load balancer) while
  // bounding how long a slow request may occupy a socket.
  server.keepAliveTimeout = intFromEnv('KEEP_ALIVE_TIMEOUT_MS', 65000);
  server.headersTimeout = intFromEnv('HEADERS_TIMEOUT_MS', 66000);
  server.requestTimeout = intFromEnv('SERVER_REQUEST_TIMEOUT_MS', 30000);

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received, draining connections (pid ${process.pid})`);

    server.close(async () => {
      try {
        await pool.end();
      } catch (_) {
        // Pool teardown failure should not block exit.
      }
      process.exit(0);
    });

    // Hard deadline so a stuck keep-alive socket cannot block a deploy/restart.
    const force = setTimeout(() => process.exit(1), intFromEnv('SHUTDOWN_TIMEOUT_MS', 10000));
    if (typeof force.unref === 'function') force.unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('[uncaughtException]', error);
    shutdown('uncaughtException');
  });

  return server;
}

const clusterEnabled = process.env.CLUSTER_ENABLED === 'true';

// Primary forks workers; every worker (and the non-cluster case) serves traffic.
function run() {
  if (clusterEnabled && cluster.isPrimary) {
    const workers = intFromEnv('CLUSTER_WORKERS', os.cpus().length);
    console.log(`Primary ${process.pid} starting ${workers} worker(s)`);

    for (let i = 0; i < workers; i += 1) cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
      console.error(`Worker ${worker.process.pid} exited (${signal || code}); restarting`);
      cluster.fork();
    });
    return null;
  }

  return startServer();
}

// Only bind a port when this file is the entry point. Without this guard, merely
// requiring server.js (e.g. from a test that wants buildApp) would start a listener.
if (require.main === module) {
  run();
}

module.exports = { buildApp, startServer, run };
