const express = require('express');
const router = express.Router();
const employeeService = require('../services/employeeService');

// Get all employees
router.get('/all', async (req, res) => {
  try {
    const employees = await employeeService.findAll();
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get employee by account
router.get('/:account', async (req, res) => {
  try {
    const employee = await employeeService.findByAccount(parseInt(req.params.account));
    if (employee) {
      res.json({ success: true, data: [employee] });
    } else {
      res.json({ success: false, message: '员工不存在！', data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add employee
router.post('/add', async (req, res) => {
  try {
    const employee = req.body;
    
    // Generate random account (1010 + 5 digits)
    const account = 101000000 + Math.floor(Math.random() * 100000);
    employee.employeeAccount = account;
    
    // Set current date
    const now = new Date();
    employee.entryTime = now.toISOString().split('T')[0];
    
    await employeeService.insert(employee);
    res.json({ success: true, message: '员工添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update employee
router.put('/update', async (req, res) => {
  try {
    await employeeService.update(req.body);
    res.json({ success: true, message: '员工信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete employee
router.delete('/:account', async (req, res) => {
  try {
    await employeeService.deleteByAccount(parseInt(req.params.account));
    res.json({ success: true, message: '员工删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
