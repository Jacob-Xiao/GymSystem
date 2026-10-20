'use strict';

const jwt = require('jsonwebtoken');

const DEFAULT_TTL = process.env.JWT_EXPIRES_IN || '8h';

// A signing key must not silently fall back to a guessable literal in production: a
// well-known secret makes every issued token forgeable. Development gets an ephemeral
// key so tokens stop validating after a restart, which is the safe failure direction.
let cachedSecret = null;

function getSecret() {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to at least 16 characters in production');
  }

  // Development/test only: random per process, with a loud warning.
  const crypto = require('node:crypto');
  cachedSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    '[auth] JWT_SECRET is unset or too short; generated a temporary development key.\n' +
    '        Issued tokens will stop working when the server restarts.'
  );
  return cachedSecret;
}

/**
 * Issue a signed token for an authenticated principal.
 *
 * The payload deliberately carries only an identifier and a role. Names, emails and
 * other profile fields live in the database, so a token cannot go stale against them.
 */
function signToken({ role, account }) {
  return jwt.sign(
    { sub: String(account), role },
    getSecret(),
    { expiresIn: DEFAULT_TTL, issuer: 'gym-management-system' }
  );
}

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

/**
 * Verify the bearer token and attach the principal to the request.
 *
 * Returns 401 for a missing/invalid/expired token. Authorization (which role may reach
 * which route) is a separate concern, handled by `requireRole` and `requireSelf`.
 */
function authenticate(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: '未登录或登录已过期' });
  }

  try {
    const payload = jwt.verify(token, getSecret(), { issuer: 'gym-management-system' });
    req.user = {
      account: Number.parseInt(payload.sub, 10),
      role: payload.role
    };
    return next();
  } catch (error) {
    const message = error && error.name === 'TokenExpiredError'
      ? '登录已过期，请重新登录'
      : '登录凭证无效';
    return res.status(401).json({ success: false, message });
  }
}

/** Restrict a route to one or more roles (`admin` / `member`). Must follow `authenticate`. */
function requireRole(...roles) {
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未登录或登录已过期' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: '无权限执行此操作' });
    }
    return next();
  };
}

/**
 * Allow only the member whose account appears in the request.
 *
 * The account can arrive as a path param, query string or body field. Admins are
 * deliberately not granted implicit access here: routes that admins may read are
 * declared with `requireRole('admin', 'member')` instead, so an admin cannot silently
 * act as an arbitrary member on write paths.
 */
function requireSelf(paramNames = ['account', 'memberAccount']) {
  return function requireSelfMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, message: '未登录或登录已过期' });
    }

    // These routes are member-scoped. An admin principal is rejected explicitly rather
    // than relying on admin and member account numbers never overlapping: that happens
    // to hold today, but it is not a property the schema guarantees.
    if (req.user.role !== 'member') {
      return res.status(403).json({ success: false, message: '该接口仅限会员本人访问' });
    }

    const candidates = [];
    for (const name of paramNames) {
      if (req.params && req.params[name] !== undefined) candidates.push(req.params[name]);
      if (req.query && req.query[name] !== undefined) candidates.push(req.query[name]);
      if (req.body && req.body[name] !== undefined) candidates.push(req.body[name]);
    }

    const provided = candidates
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));

    if (provided.length === 0) {
      return res.status(400).json({ success: false, message: '缺少用户标识' });
    }

    if (!provided.every((value) => value === req.user.account)) {
      return res.status(403).json({ success: false, message: '无权访问其他会员的数据' });
    }

    return next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  requireSelf,
  signToken,
  getSecret
};
