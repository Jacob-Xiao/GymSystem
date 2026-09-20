const db = require('../config/database');
const cache = require('../config/cache');

const CACHE_PREFIX = 'equipment:';
const LIST_TTL_MS = Number.parseInt(process.env.EQUIPMENT_CACHE_TTL_MS, 10) || 15000;

// List views (admin table, booking picker) render only these columns. `equipment_image`
// and `equipment_function` are mediumtext/text blobs read only by the detail page
// (`findById`), so excluding them keeps base64 images out of every list response.
const LIST_COLUMNS = `equipment_id, equipment_name, equipment_location, equipment_status, equipment_message`;

async function loadAll() {
  const [rows] = await db.execute(`SELECT ${LIST_COLUMNS} FROM equipment ORDER BY equipment_id`);
  return rows;
}

const equipmentService = {
  async findAll() {
    return cache.wrap(`${CACHE_PREFIX}all`, LIST_TTL_MS, loadAll);
  },

  async findById(equipmentId) {
    const [rows] = await db.execute(
      'SELECT * FROM equipment WHERE equipment_id = ?',
      [equipmentId]
    );
    return rows[0] || null;
  },

  async insert(equipment) {
    const {
      equipmentName,
      equipmentLocation,
      equipmentStatus,
      equipmentMessage,
      equipmentImage,
      equipmentFunction
    } = equipment;

    await db.execute(
      `INSERT INTO equipment (equipment_name, equipment_location, equipment_status, equipment_message, equipment_image, equipment_function) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [equipmentName, equipmentLocation, equipmentStatus, equipmentMessage || '', equipmentImage || null, equipmentFunction || null]
    );

    cache.invalidate(CACHE_PREFIX);
    return true;
  },

  async update(equipment) {
    const {
      equipmentId,
      equipmentName,
      equipmentLocation,
      equipmentStatus,
      equipmentMessage,
      equipmentImage,
      equipmentFunction
    } = equipment;

    await db.execute(
      `UPDATE equipment SET equipment_name = ?, equipment_location = ?, 
       equipment_status = ?, equipment_message = ?, equipment_image = ?, equipment_function = ? 
       WHERE equipment_id = ?`,
      [equipmentName, equipmentLocation, equipmentStatus, equipmentMessage || '', equipmentImage || null, equipmentFunction || null, equipmentId]
    );

    cache.invalidate(CACHE_PREFIX);
    return true;
  },

  async deleteById(equipmentId) {
    await db.execute('DELETE FROM equipment WHERE equipment_id = ?', [equipmentId]);
    cache.invalidate(CACHE_PREFIX);
    return true;
  },

  async getTotalCount() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM equipment');
    return rows[0].count;
  }
};

module.exports = equipmentService;
module.exports.LIST_COLUMNS = LIST_COLUMNS;
