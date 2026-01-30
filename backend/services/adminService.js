const db = require('../config/database');

const adminService = {
  async findByAccount(adminAccount) {
    const [rows] = await db.execute(
      'SELECT * FROM admin WHERE admin_account = ?',
      [adminAccount]
    );
    return rows[0] || null;
  }
};

module.exports = adminService;
