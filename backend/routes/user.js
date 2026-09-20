const express = require('express');
const router = express.Router();
const memberService = require('../services/memberService');
const classService = require('../services/classService');
const classOrderService = require('../services/classOrderService');

// Get user info
router.get('/info/:account', async (req, res) => {
  try {
    const member = await memberService.findByAccount(parseInt(req.params.account));
    if (member) {
      res.json({ success: true, data: member });
    } else {
      res.status(404).json({ success: false, message: '会员不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user info
router.put('/info/update', async (req, res) => {
  try {
    await memberService.update(req.body);
    res.json({ success: true, message: '个人信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user classes
router.get('/classes/:account', async (req, res) => {
  try {
    const orders = await classOrderService.findByMemberAccount(parseInt(req.params.account));
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply for class
router.post('/apply', async (req, res) => {
  try {
    const { classId, memberAccount } = req.body;

    // Fast path for the common case; the unique index on (class_id, member_account) is
    // the authoritative guard when two requests race past this check.
    const existingOrder = await classOrderService.findByClassIdAndMemberAccount(classId, memberAccount);
    if (existingOrder) {
      return res.json({ success: false, message: '您已经报名了该课程' });
    }

    // Get class info
    const classItem = await classService.findById(classId);
    if (!classItem) {
      return res.status(404).json({ success: false, message: '课程不存在' });
    }

    // Get member info
    const member = await memberService.findByAccount(memberAccount);
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    // Create order
    const classOrder = {
      classId: classItem.class_id,
      className: classItem.class_name,
      coach: classItem.coach,
      memberName: member.member_name,
      memberAccount: member.member_account,
      classBegin: classItem.class_begin
    };

    try {
      await classOrderService.insert(classOrder);
    } catch (error) {
      if (error.code === 'DUPLICATE_ENROLLMENT') {
        // A concurrent request won the race; same user-visible outcome as the pre-check.
        return res.json({ success: false, message: error.message });
      }
      throw error;
    }

    res.json({ success: true, message: '报名成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel class order
router.delete('/classes/:orderId', async (req, res) => {
  try {
    await classOrderService.deleteById(parseInt(req.params.orderId));
    res.json({ success: true, message: '退课成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
