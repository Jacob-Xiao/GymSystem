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
  // #region agent log
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, '..', '..', '.cursor', 'debug.log');
  const logData = {sessionId:'debug-session',runId:'run1',hypothesisId:'C',location:'routes/user.js:22',message:'Backend route: Received update request',data:{hasMemberPhoto:!!req.body.memberPhoto,memberPhotoLength:req.body.memberPhoto?req.body.memberPhoto.length:0,memberPhotoPrefix:req.body.memberPhoto?req.body.memberPhoto.substring(0,50):null,memberAccount:req.body.memberAccount,requestBodyKeys:Object.keys(req.body)},timestamp:Date.now()};
  try { fs.appendFileSync(logPath, JSON.stringify(logData) + '\n'); } catch(e) {}
  // #endregion

  try {
    console.log('[DEBUG] Update request received, memberPhoto length:', req.body.memberPhoto ? req.body.memberPhoto.length : 0);
    await memberService.update(req.body);
    // #region agent log
    const logData2 = {sessionId:'debug-session',runId:'run1',hypothesisId:'C',location:'routes/user.js:32',message:'Backend route: Update service call succeeded',data:{},timestamp:Date.now()};
    try { fs.appendFileSync(logPath, JSON.stringify(logData2) + '\n'); } catch(e) {}
    // #endregion
    console.log('[DEBUG] Update succeeded');
    res.json({ success: true, message: '个人信息更新成功' });
  } catch (error) {
    // #region agent log
    const logData3 = {sessionId:'debug-session',runId:'run1',hypothesisId:'B',location:'routes/user.js:40',message:'Backend route: Error caught',data:{errorMessage:error.message,errorCode:error.code,errorStack:error.stack?.substring(0,200)},timestamp:Date.now()};
    try { fs.appendFileSync(logPath, JSON.stringify(logData3) + '\n'); } catch(e) {}
    // #endregion
    console.error('[DEBUG] Update error:', error.message, error.code);
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
    
    // Check if already applied
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
    
    await classOrderService.insert(classOrder);
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
