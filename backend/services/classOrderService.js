const db = require('../config/database');

// The unique index `uq_class_order_class_member (class_id, member_account)` added by
// scripts/migrate.js is what actually prevents duplicate enrolment. This maps the
// resulting driver error to a typed error so routes can return the same friendly
// message the pre-check produced.
function duplicateEnrollmentError() {
  const error = new Error('您已经报名了该课程');
  error.code = 'DUPLICATE_ENROLLMENT';
  return error;
}

const classOrderService = {
  async findByClassId(classId) {
    const [rows] = await db.execute(
      'SELECT * FROM class_order WHERE class_id = ?',
      [classId]
    );
    return rows;
  },

  async findByMemberAccount(memberAccount) {
    const [rows] = await db.execute(
      'SELECT * FROM class_order WHERE member_account = ?',
      [memberAccount]
    );
    return rows;
  },

  async findByClassIdAndMemberAccount(classId, memberAccount) {
    const [rows] = await db.execute(
      'SELECT * FROM class_order WHERE class_id = ? AND member_account = ?',
      [classId, memberAccount]
    );
    return rows[0] || null;
  },

  async insert(classOrder, executor = db) {
    const {
      classId,
      className,
      coach,
      memberName,
      memberAccount,
      classBegin
    } = classOrder;

    try {
      await executor.execute(
        `INSERT INTO class_order (class_id, class_name, coach, member_name, member_account, class_begin) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [classId, className, coach, memberName, memberAccount, classBegin]
      );
    } catch (error) {
      if (error && error.code === 'ER_DUP_ENTRY') {
        throw duplicateEnrollmentError();
      }
      throw error;
    }

    return true;
  },

  async deleteById(classOrderId) {
    await db.execute('DELETE FROM class_order WHERE class_order_id = ?', [classOrderId]);
    return true;
  },

  async deleteByClassId(classId, executor = db) {
    await executor.execute('DELETE FROM class_order WHERE class_id = ?', [classId]);
    return true;
  }
};

module.exports = classOrderService;
module.exports.duplicateEnrollmentError = duplicateEnrollmentError;
