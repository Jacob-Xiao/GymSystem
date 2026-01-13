const db = require('../config/database');

const equipmentService = {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM equipment ORDER BY equipment_id');
    return rows;
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

    return true;
  },

  async deleteById(equipmentId) {
    await db.execute('DELETE FROM equipment WHERE equipment_id = ?', [equipmentId]);
    return true;
  },

  async getTotalCount() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM equipment');
    return rows[0].count;
  }
};

module.exports = equipmentService;
