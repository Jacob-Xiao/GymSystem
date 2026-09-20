'use strict';

const zlib = require('zlib');

function intFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const COMPRESSIBLE = /json|text|javascript|xml|svg|x-www-form-urlencoded/;

/**
 * gzip responses above `threshold` bytes using Node's built-in zlib.
 *
 * JSON list payloads dominate this API (member/class/equipment lists), so compressing
 * them cuts egress and client-side transfer time substantially at no dependency cost.
 */
function compression(options = {}) {
  const threshold = options.threshold === undefined ? intFromEnv('COMPRESSION_THRESHOLD', 1024) : options.threshold;
  const level = options.level === undefined ? intFromEnv('COMPRESSION_LEVEL', 6) : options.level;

  return function compressionMiddleware(req, res, next) {
    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    if (!acceptEncoding.includes('gzip')) return next();

    // Content negotiation happened regardless of whether we end up compressing.
    res.setHeader('Vary', 'Accept-Encoding');

    const originalSend = res.send;
    res.send = function sendWithCompression(body) {
      if (body === undefined || body === null) return originalSend.call(this, body);

      let buffer;
      if (Buffer.isBuffer(body)) buffer = body;
      else if (typeof body === 'string') buffer = Buffer.from(body);
      else return originalSend.call(this, body); // objects are serialized by express before send

      if (buffer.length < threshold) return originalSend.call(this, body);
      if (res.getHeader('Content-Encoding')) return originalSend.call(this, body);

      const contentType = res.getHeader('Content-Type');
      if (contentType && !COMPRESSIBLE.test(String(contentType))) {
        return originalSend.call(this, body);
      }

      zlib.gzip(buffer, { level }, (error, compressed) => {
        if (error) return originalSend.call(res, body);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        return originalSend.call(res, compressed);
      });
    };

    next();
  };
}

/**
 * Per-client fixed-window limiter. This is overload protection, not billing: the
 * default ceiling is deliberately far above the 1000 QPS target so legitimate traffic
 * is never throttled, while a runaway client cannot consume the whole event loop.
 */
function rateLimit(options = {}) {
  const enabled = options.enabled === undefined
    ? process.env.RATE_LIMIT_ENABLED !== 'false'
    : options.enabled;
  const windowMs = options.windowMs === undefined ? intFromEnv('RATE_LIMIT_WINDOW_MS', 1000) : options.windowMs;
  const max = options.max === undefined ? intFromEnv('RATE_LIMIT_MAX', 5000) : options.max;
  const keyGenerator = options.keyGenerator;

  const buckets = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs * 10);
  if (typeof cleanup.unref === 'function') cleanup.unref();

  return function rateLimitMiddleware(req, res, next) {
    if (!enabled) return next();

    const key = keyGenerator ? keyGenerator(req) : req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - bucket.count));

    if (bucket.count > max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message: '请求过于频繁，请稍后重试' });
    }

    return next();
  };
}

/**
 * Bound how long a client waits for a response. A saturated database would otherwise
 * leave requests hanging until the socket times out, holding memory the whole time.
 */
function requestTimeout(options = {}) {
  const ms = options.ms === undefined ? intFromEnv('REQUEST_TIMEOUT_MS', 15000) : options.ms;

  return function requestTimeoutMiddleware(req, res, next) {
    if (ms <= 0) return next();

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ success: false, message: '请求超时，请稍后重试' });
      }
    }, ms);
    if (typeof timer.unref === 'function') timer.unref();

    const clear = () => clearTimeout(timer);
    res.on('finish', clear);
    res.on('close', clear);

    return next();
  };
}

module.exports = { compression, rateLimit, requestTimeout };
