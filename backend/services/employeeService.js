const db = require('../config/database');

const employeeService = {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM employee ORDER BY employee_account');
    return rows;
  },

  async findByAccount(employeeAccount) {
    const [rows] = await db.execute(
      'SELECT * FROM employee WHERE employee_account = ?',
      [employeeAccount]
    );
    return rows[0] || null;
  },

  async insert(employee) {
    const {
      employeeAccount,
      employeeName,
      employeeGender,
      employeeAge,
      entryTime,
      staff,
      employeeMessage
    } = employee;

    await db.execute(
      `INSERT INTO employee (employee_account, employee_name, employee_gender, 
       employee_age, entry_time, staff, employee_message) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employeeAccount, employeeName, employeeGender, employeeAge, entryTime, staff, employeeMessage]
    );

    return true;
  },

  async update(employee) {
    const {
      employeeAccount,
      employeeName,
      employeeGender,
      employeeAge,
      staff,
      employeeMessage
    } = employee;

    await db.execute(
      `UPDATE employee SET employee_name = ?, employee_gender = ?, employee_age = ?, 
       staff = ?, employee_message = ? WHERE employee_account = ?`,
      [employeeName, employeeGender, employeeAge, staff, employeeMessage, employeeAccount]
    );

    return true;
  },

  async deleteByAccount(employeeAccount) {
    await db.execute('DELETE FROM employee WHERE employee_account = ?', [employeeAccount]);
    return true;
  },

  async getTotalCount() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM employee');
    return rows[0].count;
  }
};

module.exports = employeeService;
