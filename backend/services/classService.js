const db = require('../config/database');

const classService = {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM class_table ORDER BY class_id');
    return rows;
  },

  async findById(classId) {
    const [rows] = await db.execute(
      'SELECT * FROM class_table WHERE class_id = ?',
      [classId]
    );
    return rows[0] || null;
  },

  async insert(classTable) {
    const {
      classId,
      className,
      classBegin,
      classTime,
      coach
    } = classTable;

    await db.execute(
      `INSERT INTO class_table (class_id, class_name, class_begin, class_time, coach) 
       VALUES (?, ?, ?, ?, ?)`,
      [classId, className, classBegin, classTime, coach]
    );

    return true;
  },

  async update(classTable) {
    const {
      classId,
      className,
      classBegin,
      classTime,
      coach
    } = classTable;

    await db.execute(
      `UPDATE class_table SET class_name = ?, class_begin = ?, class_time = ?, coach = ? 
       WHERE class_id = ?`,
      [className, classBegin, classTime, coach, classId]
    );

    return true;
  },

  async deleteById(classId) {
    await db.execute('DELETE FROM class_table WHERE class_id = ?', [classId]);
    return true;
  }
};

module.exports = classService;
