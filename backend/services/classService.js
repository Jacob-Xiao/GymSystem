const db = require('../config/database');
const cache = require('../config/cache');

const CACHE_PREFIX = 'class:';
const LIST_TTL_MS = Number.parseInt(process.env.CLASS_CACHE_TTL_MS, 10) || 15000;

const classService = {
  async findAll() {
    return cache.wrap(`${CACHE_PREFIX}all`, LIST_TTL_MS, async () => {
      const [rows] = await db.execute('SELECT * FROM class_table ORDER BY class_id');
      return rows;
    });
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

    cache.invalidate(CACHE_PREFIX);
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

    cache.invalidate(CACHE_PREFIX);
    return true;
  },

  async deleteById(classId, executor = db) {
    await executor.execute('DELETE FROM class_table WHERE class_id = ?', [classId]);
    cache.invalidate(CACHE_PREFIX);
    return true;
  }
};

module.exports = classService;
