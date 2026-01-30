const express = require('express');
const router = express.Router();
const equipmentBookingService = require('../services/equipmentBookingService');
const memberService = require('../services/memberService');

// 获取所有器材列表
router.get('/equipment/list', async (req, res) => {
  try {
    const equipment = await equipmentBookingService.getAllEquipment();
    res.json({ success: true, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取器材的预约信息
router.get('/equipment/:equipmentId/bookings', async (req, res) => {
  try {
    const equipmentId = parseInt(req.params.equipmentId);
    const bookings = await equipmentBookingService.getActiveBookingsByEquipment(equipmentId);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取会员的预约列表
router.get('/member/:memberAccount/bookings', async (req, res) => {
  try {
    const memberAccount = parseInt(req.params.memberAccount);
    const bookings = await equipmentBookingService.getBookingsByMember(memberAccount);
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取预约详情
router.get('/booking/:bookingId', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const booking = await equipmentBookingService.getBookingById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }

    // 获取分享请求
    const shareRequests = await equipmentBookingService.getShareRequestsByBooking(bookingId);
<<<<<<< HEAD
    // 获取训练会话列表（每次“完成”为一条，用于固定展示）
    const trainingSessions = await equipmentBookingService.getTrainingSessionsByBooking(bookingId);
=======
>>>>>>> a749d3276ce155fbc74c959ecfae055ceee5008a
    
    res.json({ 
      success: true, 
      data: {
        ...booking,
<<<<<<< HEAD
        shareRequests,
        trainingSessions
=======
        shareRequests
>>>>>>> a749d3276ce155fbc74c959ecfae055ceee5008a
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

<<<<<<< HEAD
// 保存预约的训练记录
router.post('/booking/:bookingId/training-records', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const { records } = req.body;

    const booking = await equipmentBookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: '预约不存在' });
    }

    const saved = await equipmentBookingService.saveTrainingRecords(bookingId, records || []);
    res.json({ success: true, message: '训练记录已保存', data: { records: saved } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

=======
>>>>>>> a749d3276ce155fbc74c959ecfae055ceee5008a
// 创建预约
router.post('/booking/create', async (req, res) => {
  try {
    const { equipmentId, memberAccount, startTime, endTime, locationNote } = req.body;

    if (!equipmentId || !memberAccount || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: '请填写所有必填项' });
    }

    // 获取会员信息
    const member = await memberService.findByAccount(memberAccount);
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    // 验证时间
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ success: false, message: '结束时间必须晚于开始时间' });
    }

    if (start < new Date()) {
      return res.status(400).json({ success: false, message: '不能预约过去的时间' });
    }

    const bookingId = await equipmentBookingService.createBooking({
      equipmentId,
      memberAccount,
      memberName: member.member_name,
      startTime: startTime,
      endTime: endTime,
      locationNote
    });

    res.json({ success: true, message: '预约成功', data: { bookingId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 取消预约
router.delete('/booking/:bookingId/member/:memberAccount', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const memberAccount = parseInt(req.params.memberAccount);
    
    const success = await equipmentBookingService.cancelBooking(bookingId, memberAccount);
    if (success) {
      res.json({ success: true, message: '预约已取消' });
    } else {
      res.status(404).json({ success: false, message: '预约不存在或无权限' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 创建分享请求
router.post('/share-request/create', async (req, res) => {
  try {
    const { bookingId, requesterAccount } = req.body;

    if (!bookingId || !requesterAccount) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    // 获取请求者信息
    const member = await memberService.findByAccount(requesterAccount);
    if (!member) {
      return res.status(404).json({ success: false, message: '会员不存在' });
    }

    const requestId = await equipmentBookingService.createShareRequest(
      bookingId,
      requesterAccount,
      member.member_name
    );

    res.json({ success: true, message: '分享请求已提交', data: { requestId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取收到的分享请求
router.get('/member/:memberAccount/share-requests/received', async (req, res) => {
  try {
    const memberAccount = parseInt(req.params.memberAccount);
    const requests = await equipmentBookingService.getReceivedShareRequests(memberAccount);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取发送的分享请求
router.get('/member/:memberAccount/share-requests/sent', async (req, res) => {
  try {
    const requesterAccount = parseInt(req.params.memberAccount);
    const requests = await equipmentBookingService.getSentShareRequests(requesterAccount);
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 处理分享请求（接受/拒绝）
router.post('/share-request/:requestId/handle', async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const { bookingOwnerAccount, action } = req.body;

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作' });
    }

    await equipmentBookingService.handleShareRequest(requestId, bookingOwnerAccount, action);
    
    const message = action === 'accept' ? '已接受分享请求' : '已拒绝分享请求';
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
