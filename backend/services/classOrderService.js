const db = require('../config/database');

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

  async insert(classOrder) {
    const {
      classId,
      className,
      coach,
      memberName,
      memberAccount,
      classBegin
    } = classOrder;

    await db.execute(
      `INSERT INTO class_order (class_id, class_name, coach, member_name, member_account, class_begin) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [classId, className, coach, memberName, memberAccount, classBegin]
    );

    return true;
  },

  async deleteById(classOrderId) {
    await db.execute('DELETE FROM class_order WHERE class_order_id = ?', [classOrderId]);
    return true;
  },

  async deleteByClassId(classId) {
    await db.execute('DELETE FROM class_order WHERE class_id = ?', [classId]);
    return true;
  }
};

module.exports = classOrderService;
