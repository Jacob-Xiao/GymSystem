const express = require('express');
const router = express.Router();
const db = require('../config/database');
const classService = require('../services/classService');
const classOrderService = require('../services/classOrderService');

// Get all classes
router.get('/all', async (req, res) => {
  try {
    const classes = await classService.findAll();
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add class
router.post('/add', async (req, res) => {
  try {
    await classService.insert(req.body);
    res.json({ success: true, message: '课程添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update class (must be before /:id route)
router.put('/update', async (req, res) => {
  try {
    await classService.update(req.body);
    res.json({ success: true, message: '课程信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get class orders (must be before /:id route)
router.get('/:id/orders', async (req, res) => {
  try {
    const orders = await classOrderService.findByClassId(parseInt(req.params.id));
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get class by id
router.get('/:id', async (req, res) => {
  try {
    const classItem = await classService.findById(parseInt(req.params.id));
    if (classItem) {
      res.json({ success: true, data: classItem });
    } else {
      res.json({ success: false, message: '课程不存在！' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    const classId = parseInt(req.params.id);

    // Orders and the class itself must disappear together; a partial failure would
    // otherwise leave orphaned enrolments pointing at a deleted class.
    await db.withTransaction(async (connection) => {
      await classOrderService.deleteByClassId(classId, connection);
      await classService.deleteById(classId, connection);
    });

    res.json({ success: true, message: '课程删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
