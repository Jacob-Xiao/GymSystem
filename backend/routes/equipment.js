const express = require('express');
const router = express.Router();
const equipmentService = require('../services/equipmentService');

// Get all equipment
router.get('/all', async (req, res) => {
  try {
    const equipment = await equipmentService.findAll();
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get equipment by id
router.get('/:id', async (req, res) => {
  try {
    const equipment = await equipmentService.findById(parseInt(req.params.id));
    if (equipment) {
      res.json({ success: true, data: [equipment] });
    } else {
      res.json({ success: false, message: '设备不存在！', data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add equipment
router.post('/add', async (req, res) => {
  try {
    await equipmentService.insert(req.body);
    res.json({ success: true, message: '设备添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update equipment
router.put('/update', async (req, res) => {
  try {
    await equipmentService.update(req.body);
    res.json({ success: true, message: '设备信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
  try {
    await equipmentService.deleteById(parseInt(req.params.id));
    res.json({ success: true, message: '设备删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
