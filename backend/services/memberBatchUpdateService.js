const db = require('../config/database');

const memberBatchUpdateService = {
  // 批量更新会员的课时数和会籍时长
  async batchUpdate(params) {
    const { targetType, targetAccounts, cardNextClass, membershipDuration } = params;

    try {
      if (targetType === 'all') {
        // 更新所有会员
        if (cardNextClass !== undefined && membershipDuration !== undefined) {
          await db.execute(
            `UPDATE member SET card_next_class = ?, membership_duration = ?`,
            [cardNextClass, membershipDuration]
          );
        } else if (cardNextClass !== undefined) {
          await db.execute(
            `UPDATE member SET card_next_class = ?`,
            [cardNextClass]
          );
        } else if (membershipDuration !== undefined) {
          await db.execute(
            `UPDATE member SET membership_duration = ?`,
            [membershipDuration]
          );
        }
      } else if (targetType === 'specific' && targetAccounts && targetAccounts.length > 0) {
        // 更新指定会员
        const placeholders = targetAccounts.map(() => '?').join(',');
        
        if (cardNextClass !== undefined && membershipDuration !== undefined) {
          await db.execute(
            `UPDATE member SET card_next_class = ?, membership_duration = ? 
             WHERE member_account IN (${placeholders})`,
            [cardNextClass, membershipDuration, ...targetAccounts]
          );
        } else if (cardNextClass !== undefined) {
          await db.execute(
            `UPDATE member SET card_next_class = ? 
             WHERE member_account IN (${placeholders})`,
            [cardNextClass, ...targetAccounts]
          );
        } else if (membershipDuration !== undefined) {
          await db.execute(
            `UPDATE member SET membership_duration = ? 
             WHERE member_account IN (${placeholders})`,
            [membershipDuration, ...targetAccounts]
          );
        }
      } else {
        throw new Error('无效的更新参数');
      }

      return true;
    } catch (error) {
      // 如果字段不存在，尝试不更新该字段
      if (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 1054) {
        if (error.message && error.message.includes('membership_duration')) {
          // membership_duration字段不存在，只更新card_next_class
          if (targetType === 'all') {
            if (cardNextClass !== undefined) {
              await db.execute(`UPDATE member SET card_next_class = ?`, [cardNextClass]);
            }
          } else if (targetType === 'specific' && targetAccounts && targetAccounts.length > 0) {
            const placeholders = targetAccounts.map(() => '?').join(',');
            if (cardNextClass !== undefined) {
              await db.execute(
                `UPDATE member SET card_next_class = ? WHERE member_account IN (${placeholders})`,
                [cardNextClass, ...targetAccounts]
              );
            }
          }
          return true;
        }
      }
      throw error;
    }
  }
};

module.exports = memberBatchUpdateService;
