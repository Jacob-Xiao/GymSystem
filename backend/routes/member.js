const express = require('express');
const router = express.Router();
const memberService = require('../services/memberService');
const { insertWithUniqueAccount } = require('../utils/uniqueAccount');

// Get all members
//
// Pagination is opt-in: omitting `pageSize` returns the full list exactly as before, so
// existing callers are unaffected. `?pageSize=50&page=2` bounds the scan under load.
router.get('/all', async (req, res) => {
  try {
    const pageSize = Number.parseInt(req.query.pageSize, 10);
    const page = Number.parseInt(req.query.page, 10);

    const options = {};
    if (Number.isInteger(pageSize) && pageSize > 0) {
      options.limit = pageSize;
      options.offset = Number.isInteger(page) && page > 1 ? (page - 1) * pageSize : 0;
    }

    const members = await memberService.findAll(options);
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

    // Set default password
    member.memberPassword = '123456';

    // Set current date
    const now = new Date();
    member.cardTime = now.toISOString().split('T')[0];

    // Set card next class same as card class
    member.cardNextClass = member.cardClass;

    // Account is allocated here (2021 + 5 digits) and retried if the draw collides.
    await insertWithUniqueAccount({
      base: 202100000,
      range: 100000,
      insert: (account) => {
        member.memberAccount = account;
        return memberService.insert(member);
      }
    });

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
