const db = require('./database');

// Optional-column support is detected once and memoized.
//
// The original code issued an INFORMATION_SCHEMA query on *every* member update and
// wrapped every training-session write in a try/catch retry, because some environments
// were created before `member.membership_duration` / `equipment_training_session.status`
// existed. Both patterns put a guaranteed extra round-trip (or a guaranteed failed
// statement) on the write path. We keep the same graceful degradation but pay for the
// probe only once per process.
let supportPromise = null;

async function detect() {
  const [rows] = await db.execute(
    `SELECT TABLE_NAME, COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND ((TABLE_NAME = 'member' AND COLUMN_NAME = 'membership_duration')
          OR (TABLE_NAME = 'equipment_training_session' AND COLUMN_NAME = 'status'))`
  );

  const found = new Set(rows.map((r) => `${r.TABLE_NAME}.${r.COLUMN_NAME}`));
  return {
    membershipDuration: found.has('member.membership_duration'),
    trainingSessionStatus: found.has('equipment_training_session.status')
  };
}

module.exports = {
  // Resolves to { membershipDuration: boolean, trainingSessionStatus: boolean }.
  get() {
    if (!supportPromise) {
      supportPromise = detect().catch((error) => {
        // Do not cache a failed probe; the next write should retry detection.
        supportPromise = null;
        throw error;
      });
    }
    return supportPromise;
  },

  // Test hook: force re-detection.
  reset() {
    supportPromise = null;
  }
};
