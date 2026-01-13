const db = require('../config/database');

const equipmentBookingService = {
  // 获取所有器材列表（用于预约，只显示状态为"正常"的）
  async getAllEquipment() {
    const [rows] = await db.execute(
      "SELECT * FROM equipment WHERE equipment_status = '正常' ORDER BY equipment_id"
    );
    return rows;
  },

  // 获取器材的预约信息（按时间范围）
  async getBookingsByEquipmentAndTime(equipmentId, startTime, endTime) {
    const [rows] = await db.execute(
      `SELECT * FROM equipment_booking 
       WHERE equipment_id = ? 
       AND status = 'active'
       AND (
         (start_time <= ? AND end_time > ?) OR
         (start_time < ? AND end_time >= ?) OR
         (start_time >= ? AND end_time <= ?)
       )
       ORDER BY start_time`,
      [equipmentId, startTime, startTime, endTime, endTime, startTime, endTime]
    );
    return rows;
  },

  // 获取会员的所有预约（包括自己创建的以及通过接受分享请求获得的）
  async getBookingsByMember(memberAccount) {
    // 获取用户自己创建的预约
    const [ownBookings] = await db.execute(
      `SELECT eb.*, e.equipment_name, e.equipment_location, 'owner' as booking_type
       FROM equipment_booking eb
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE eb.member_account = ? AND eb.status = 'active'
       ORDER BY eb.start_time DESC`,
      [memberAccount]
    );

    // 获取用户通过接受分享请求获得的预约
    // 注意：当其他用户接受了用户发送的分享请求时，该用户作为requester_account应该能看到这个预约
    const [sharedBookings] = await db.execute(
      `SELECT eb.*, e.equipment_name, e.equipment_location, 'shared' as booking_type
       FROM equipment_share_request esr
       JOIN equipment_booking eb ON esr.booking_id = eb.booking_id
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE esr.requester_account = ? 
         AND esr.status = 'accepted' 
         AND eb.status = 'active'
       ORDER BY eb.start_time DESC`,
      [memberAccount]
    );

    // 合并结果并去重（基于booking_id）
    const bookingMap = new Map();
    
    ownBookings.forEach(booking => {
      bookingMap.set(booking.booking_id, booking);
    });
    
    sharedBookings.forEach(booking => {
      bookingMap.set(booking.booking_id, booking);
    });

    // 转换为数组并按时间排序
    const allBookings = Array.from(bookingMap.values());
    allBookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

    return allBookings;
  },

  // 获取特定预约的详细信息
  async getBookingById(bookingId) {
    const [rows] = await db.execute(
      `SELECT eb.*, e.equipment_name, e.equipment_location 
       FROM equipment_booking eb
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE eb.booking_id = ?`,
      [bookingId]
    );
    return rows[0] || null;
  },

  // 创建预约
  async createBooking(booking) {
    const {
      equipmentId,
      memberAccount,
      memberName,
      startTime,
      endTime,
      locationNote
    } = booking;

    // 检查时间冲突
    const conflicts = await this.getBookingsByEquipmentAndTime(equipmentId, startTime, endTime);
    if (conflicts.length > 0) {
      throw new Error('该时间段已被预约，请选择其他时间');
    }

    const [result] = await db.execute(
      `INSERT INTO equipment_booking 
       (equipment_id, member_account, member_name, start_time, end_time, location_note, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [equipmentId, memberAccount, memberName, startTime, endTime, locationNote || '']
    );

    return result.insertId;
  },

  // 取消预约
  async cancelBooking(bookingId, memberAccount) {
    const [result] = await db.execute(
      `UPDATE equipment_booking 
       SET status = 'cancelled' 
       WHERE booking_id = ? AND member_account = ?`,
      [bookingId, memberAccount]
    );
    return result.affectedRows > 0;
  },

  // 获取器材的当前有效预约
  async getActiveBookingsByEquipment(equipmentId) {
    const now = new Date();
    const [rows] = await db.execute(
      `SELECT eb.*, e.equipment_name, e.equipment_location 
       FROM equipment_booking eb
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE eb.equipment_id = ? 
       AND eb.status = 'active'
       AND eb.end_time > ?
       ORDER BY eb.start_time ASC`,
      [equipmentId, now]
    );
    return rows;
  },

  // 创建分享请求
  async createShareRequest(bookingId, requesterAccount, requesterName) {
    // 检查是否已经存在pending的请求
    const [existing] = await db.execute(
      `SELECT * FROM equipment_share_request 
       WHERE booking_id = ? AND requester_account = ? AND status = 'pending'`,
      [bookingId, requesterAccount]
    );

    if (existing.length > 0) {
      throw new Error('您已经提交过分享请求，请等待处理');
    }

    // 检查预约是否存在且有效
    const booking = await this.getBookingById(bookingId);
    if (!booking || booking.status !== 'active') {
      throw new Error('预约不存在或已失效');
    }

    if (booking.member_account === requesterAccount) {
      throw new Error('不能向自己的预约申请分享');
    }

    const [result] = await db.execute(
      `INSERT INTO equipment_share_request 
       (booking_id, requester_account, requester_name, status) 
       VALUES (?, ?, ?, 'pending')`,
      [bookingId, requesterAccount, requesterName]
    );

    return result.insertId;
  },

  // 获取预约的所有分享请求
  async getShareRequestsByBooking(bookingId) {
    const [rows] = await db.execute(
      `SELECT * FROM equipment_share_request 
       WHERE booking_id = ? 
       ORDER BY created_at DESC`,
      [bookingId]
    );
    return rows;
  },

  // 获取会员收到的分享请求（作为预约者）- 返回所有请求（用于消息页面）
  async getReceivedShareRequests(memberAccount) {
    const [rows] = await db.execute(
      `SELECT esr.*, eb.start_time, eb.end_time, eb.location_note, eb.booking_id,
              e.equipment_name, e.equipment_location
       FROM equipment_share_request esr
       JOIN equipment_booking eb ON esr.booking_id = eb.booking_id
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE eb.member_account = ? 
       ORDER BY esr.created_at DESC`,
      [memberAccount]
    );
    return rows;
  },

  // 获取待处理的分享请求数量（用于未读消息计数）
  async getPendingShareRequestsCount(memberAccount) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count 
       FROM equipment_share_request esr
       JOIN equipment_booking eb ON esr.booking_id = eb.booking_id
       WHERE eb.member_account = ? 
       AND esr.status = 'pending'`,
      [memberAccount]
    );
    return rows[0].count;
  },

  // 处理分享请求（接受或拒绝）
  async handleShareRequest(requestId, bookingOwnerAccount, action) {
    // 验证请求属于该用户
    const [requests] = await db.execute(
      `SELECT esr.* FROM equipment_share_request esr
       JOIN equipment_booking eb ON esr.booking_id = eb.booking_id
       WHERE esr.request_id = ? AND eb.member_account = ?`,
      [requestId, bookingOwnerAccount]
    );

    if (requests.length === 0) {
      throw new Error('请求不存在或无权限处理');
    }

    const status = action === 'accept' ? 'accepted' : 'rejected';
    await db.execute(
      `UPDATE equipment_share_request 
       SET status = ? 
       WHERE request_id = ?`,
      [status, requestId]
    );

    return true;
  },

  // 获取会员发送的分享请求
  async getSentShareRequests(requesterAccount) {
    const [rows] = await db.execute(
      `SELECT esr.*, eb.start_time, eb.end_time, eb.location_note,
              eb.member_name as owner_name, eb.member_account as owner_account,
              e.equipment_name, e.equipment_location
       FROM equipment_share_request esr
       JOIN equipment_booking eb ON esr.booking_id = eb.booking_id
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE esr.requester_account = ?
       ORDER BY esr.created_at DESC`,
      [requesterAccount]
    );
    return rows;
  }
};

module.exports = equipmentBookingService;
