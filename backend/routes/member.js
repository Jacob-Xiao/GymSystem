const express = require('express');
const router = express.Router();
const memberService = require('../services/memberService');

// Get all members
router.get('/all', async (req, res) => {
  try {
    const members = await memberService.findAll();
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get member by account
router.get('/:account', async (req, res) => {
  try {
    const member = await memberService.findByAccount(parseInt(req.params.account));
    if (member) {
      res.json({ success: true, data: [member] });
    } else {
      res.json({ success: false, message: '会员卡号不存在！', data: [] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add member
router.post('/add', async (req, res) => {
  try {
    const member = req.body;
    
    // Generate random account (2021 + 5 digits)
    const account = 202100000 + Math.floor(Math.random() * 100000);
    member.memberAccount = account;
    
    // Set default password
    member.memberPassword = '123456';
    
    // Set current date
    const now = new Date();
    member.cardTime = now.toISOString().split('T')[0];
    
    // Set card next class same as card class
    member.cardNextClass = member.cardClass;
    
    await memberService.insert(member);
    res.json({ success: true, message: '会员添加成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update member
router.put('/update', async (req, res) => {
  try {
    await memberService.update(req.body);
    res.json({ success: true, message: '会员信息更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete member
router.delete('/:account', async (req, res) => {
  try {
    await memberService.deleteByAccount(parseInt(req.params.account));
    res.json({ success: true, message: '会员删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
