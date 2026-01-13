const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const memberBatchUpdateService = require('../services/memberBatchUpdateService');

// 创建通知
router.post('/create', async (req, res) => {
  try {
    const { title, content, targetType, targetAccounts } = req.body;
    
    if (!title || !content || !targetType) {
      return res.status(400).json({ 
        success: false, 
        message: '标题、内容和目标类型不能为空' 
      });
    }

    if (targetType === 'specific' && (!targetAccounts || targetAccounts.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: '选择个别会员时，必须指定至少一个会员账号' 
      });
    }

    const notificationId = await notificationService.create({
      title,
      content,
      targetType,
      targetAccounts: targetAccounts || []
    });

    res.json({ 
      success: true, 
      message: '通知发送成功',
      data: { notificationId }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取所有通知
router.get('/all', async (req, res) => {
  try {
    const notifications = await notificationService.findAll();
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取单个通知
router.get('/:id', async (req, res) => {
  try {
    const notification = await notificationService.findById(parseInt(req.params.id));
    if (notification) {
      res.json({ success: true, data: notification });
    } else {
      res.status(404).json({ success: false, message: '通知不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除通知
router.delete('/:id', async (req, res) => {
  try {
    await notificationService.delete(parseInt(req.params.id));
    res.json({ success: true, message: '通知删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取会员收到的通知
router.get('/member/:account', async (req, res) => {
  try {
    const memberAccount = parseInt(req.params.account);
    const notifications = await notificationService.findByMemberAccount(memberAccount);
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 批量更新会员信息（课时数和会籍时长）
router.post('/batch-update-members', async (req, res) => {
  try {
    const { targetType, targetAccounts, cardNextClass, membershipDuration } = req.body;

    if (!targetType) {
      return res.status(400).json({ 
        success: false, 
        message: '目标类型不能为空' 
      });
    }

    if (targetType === 'specific' && (!targetAccounts || targetAccounts.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        message: '选择个别会员时，必须指定至少一个会员账号' 
      });
    }

    if (cardNextClass === undefined && membershipDuration === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: '至少需要指定一个要更新的字段（课时数或会籍时长）' 
      });
    }

    await memberBatchUpdateService.batchUpdate({
      targetType,
      targetAccounts: targetAccounts || [],
      cardNextClass,
      membershipDuration
    });

    res.json({ 
      success: true, 
      message: '会员信息更新成功'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
