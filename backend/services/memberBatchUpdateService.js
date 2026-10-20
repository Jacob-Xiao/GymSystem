const db = require('../config/database');

// Build the SET clause from the fields the caller actually supplied. The previous
// implementation repeated the same four-branch if/else twice (once normally and once
// again when legacy databases lacked `membership_duration`), which made it easy to let
// the two copies drift.
function buildAssignments({ cardNextClass, membershipDuration }) {
  const assignments = [];
  const values = [];

  if (cardNextClass !== undefined) {
    assignments.push('card_next_class = ?');
    values.push(cardNextClass);
  }

  if (membershipDuration !== undefined) {
    assignments.push('membership_duration = ?');
    values.push(membershipDuration);
  }

  return { assignments, values };
}

function isMissingMembershipDuration(error) {
  return (
    (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 1054)) &&
    typeof error.message === 'string' &&
    error.message.includes('membership_duration')
  );
}

const memberBatchUpdateService = {
  // 批量更新会员的课时数和会籍时长
  async batchUpdate(params) {
    const { targetType, targetAccounts, cardNextClass, membershipDuration } = params;

    const { assignments, values } = buildAssignments({ cardNextClass, membershipDuration });

    // Nothing supplied: the route rejects this, but guard the service boundary too.
    if (assignments.length === 0) {
      throw new Error('无效的更新参数');
    }

    let where = '';
    let whereValues = [];

    if (targetType === 'specific') {
      if (!Array.isArray(targetAccounts) || targetAccounts.length === 0) {
        throw new Error('无效的更新参数');
      }
      where = ` WHERE member_account IN (${targetAccounts.map(() => '?').join(',')})`;
      whereValues = targetAccounts;
    } else if (targetType !== 'all') {
      throw new Error('无效的更新参数');
    }

    try {
      await db.execute(
        `UPDATE member SET ${assignments.join(', ')}${where}`,
        [...values, ...whereValues]
      );
    } catch (error) {
      // Legacy database without the membership_duration column: apply what it can
      // support instead of failing the whole request. Any other error is real.
      if (!isMissingMembershipDuration(error)) throw error;

      const fallback = buildAssignments({ cardNextClass, membershipDuration: undefined });
      if (fallback.assignments.length === 0) return true;

      await db.execute(
        `UPDATE member SET ${fallback.assignments.join(', ')}${where}`,
        [...fallback.values, ...whereValues]
      );
    }

    return true;
  }
};

module.exports = memberBatchUpdateService;
module.exports.buildAssignments = buildAssignments;
