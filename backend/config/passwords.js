'use strict';

const bcrypt = require('bcryptjs');

const ROUNDS = Number.parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;

// bcrypt hashes are `$2a$`, `$2b$` or `$2y$` followed by a cost. Anything else is a
// legacy plaintext value written before hashing was introduced.
const BCRYPT_PATTERN = /^\$2[aby]?\$\d{2}\$/;

function isHashed(value) {
  return typeof value === 'string' && BCRYPT_PATTERN.test(value);
}

async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

/**
 * Check a password against a stored value, transparently supporting legacy plaintext.
 *
 * Every account in the existing database stores its password in clear text. Switching
 * the comparison to bcrypt-only would lock out all of them, so a plaintext row is
 * compared directly and reported as `needsUpgrade`, letting the caller re-hash it on
 * the successful login that proves the password is correct.
 *
 * @returns {Promise<{ matches: boolean, needsUpgrade: boolean }>}
 */
async function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || typeof plain !== 'string') {
    return { matches: false, needsUpgrade: false };
  }

  if (isHashed(stored)) {
    const matches = await bcrypt.compare(plain, stored);
    return { matches, needsUpgrade: false };
  }

  // Legacy plaintext path. Compare in constant time-ish fashion via bcrypt's own
  // primitives is not possible, so use a length-aware direct comparison.
  const matches = stored.length === plain.length && stored === plain;
  return { matches, needsUpgrade: matches };
}

module.exports = { hashPassword, verifyPassword, isHashed, ROUNDS };
