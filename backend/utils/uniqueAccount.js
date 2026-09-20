'use strict';

const crypto = require('node:crypto');

/**
 * Allocate a unique account number and insert, retrying on primary-key collision.
 *
 * Account numbers were previously generated with `Math.random()` and inserted with no
 * retry, so two concurrent "add member"/"add employee" requests could draw the same
 * number and surface as an unhandled 500. `crypto.randomInt` gives a uniform draw, and
 * a duplicate-key response now just re-draws instead of failing the request.
 */
async function insertWithUniqueAccount({ base, range, insert, maxAttempts = 5 }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const account = base + crypto.randomInt(range);
    try {
      await insert(account);
      return account;
    } catch (error) {
      const isDuplicateKey = error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062);

      // A non-collision error is a genuine failure: surface it immediately.
      if (!isDuplicateKey) throw error;

      // Out of attempts: fall through to the typed allocation failure rather than
      // leaking a raw driver duplicate-key error to the caller.
      if (attempt === maxAttempts) break;
    }
  }

  const error = new Error('账号分配失败，请重试');
  error.code = 'ACCOUNT_ALLOCATION_FAILED';
  throw error;
}

module.exports = { insertWithUniqueAccount };
