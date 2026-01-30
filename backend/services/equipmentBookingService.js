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

  // 获取特定预约的详细信息（LEFT JOIN 保证即使器材被删除也能查到预约）
  async getBookingById(bookingId) {
    const [rows] = await db.execute(
      `SELECT eb.*, e.equipment_name, e.equipment_location 
       FROM equipment_booking eb
       LEFT JOIN equipment e ON eb.equipment_id = e.equipment_id
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
  },

  // 获取预约的训练记录（旧接口，返回扁平列表，兼容旧逻辑）
  async getTrainingRecordsByBooking(bookingId) {
    const [rows] = await db.execute(
      `SELECT record_id, booking_id, set_number, weight, repetitions, completed, exercise_name, created_at
       FROM equipment_training_record
       WHERE booking_id = ?
       ORDER BY set_number ASC`,
      [bookingId]
    );
    return rows;
  },

  // 获取预约的所有训练会话（含 status：confirmed 仅完成列可编辑，completed 完全只读）
  async getTrainingSessionsByBooking(bookingId) {
    let sessions;
    try {
      const [rows] = await db.execute(
        `SELECT session_id, booking_id, created_at, COALESCE(status, 'completed') as status
         FROM equipment_training_session
         WHERE booking_id = ?
         ORDER BY created_at DESC`,
        [bookingId]
      );
      sessions = rows;
    } catch (err) {
      if (err.message && err.message.includes('status')) {
        const [rows] = await db.execute(
          `SELECT session_id, booking_id, created_at
           FROM equipment_training_session
           WHERE booking_id = ?
           ORDER BY created_at DESC`,
          [bookingId]
        );
        sessions = rows.map((s) => ({ ...s, status: 'completed' }));
      } else {
        throw err;
      }
    }

    const result = [];
    for (const s of sessions) {
      const [records] = await db.execute(
        `SELECT record_id, set_number, weight, repetitions, completed, exercise_name
         FROM equipment_training_record
         WHERE session_id = ?
         ORDER BY set_number ASC`,
        [s.session_id]
      );
      result.push({
        session_id: s.session_id,
        created_at: s.created_at,
        status: s.status || 'completed',
        records
      });
    }

    // 兼容旧数据：无 session_id 的记录视为一条“历史会话”（完全只读）
    const [legacy] = await db.execute(
      `SELECT record_id, set_number, weight, repetitions, completed, exercise_name, created_at
       FROM equipment_training_record
       WHERE booking_id = ? AND (session_id IS NULL OR session_id = 0)
       ORDER BY set_number ASC`,
      [bookingId]
    );
    if (legacy.length > 0) {
      const created_at = legacy[0].created_at || null;
      result.push({ session_id: null, created_at, status: 'completed', records: legacy });
    }

    return result;
  },

  // 保存预约的训练记录（新建一条会话；fullyComplete=true 为“完成”，false 为“确认计划”）
  async saveTrainingRecords(bookingId, records, fullyComplete = true) {
    if (!records || records.length === 0) return [];

    let sessionId;
    const status = fullyComplete ? 'completed' : 'confirmed';
    try {
      const [sessionResult] = await db.execute(
        'INSERT INTO equipment_training_session (booking_id, status) VALUES (?, ?)',
        [bookingId, status]
      );
      sessionId = sessionResult.insertId;
    } catch (err) {
      if (err.message && err.message.includes('status')) {
        const [sessionResult] = await db.execute(
          'INSERT INTO equipment_training_session (booking_id) VALUES (?)',
          [bookingId]
        );
        sessionId = sessionResult.insertId;
      } else {
        throw err;
      }
    }

    const inserted = [];
    for (const r of records) {
      await db.execute(
        `INSERT INTO equipment_training_record (booking_id, session_id, set_number, weight, repetitions, completed, exercise_name)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          bookingId,
          sessionId,
          r.set_number,
          r.weight || '',
          r.repetitions || '',
          r.completed ? 1 : 0,
          r.exercise_name || ''
        ]
      );
      inserted.push({ ...r, session_id: sessionId });
    }
    return inserted;
  },

  // 更新某条记录的“完成”勾选（属于 equipment_training_session 的会话即可编辑）
  async updateRecordCompleted(recordId, completed) {
    const [rows] = await db.execute(
      `SELECT r.record_id FROM equipment_training_record r
       INNER JOIN equipment_training_session s ON r.session_id = s.session_id
       WHERE r.record_id = ?`,
      [recordId]
    );
    if (rows.length === 0) {
      throw new Error('记录不存在');
    }
    await db.execute(
      'UPDATE equipment_training_record SET completed = ? WHERE record_id = ?',
      [completed ? 1 : 0, recordId]
    );
    return true;
  },

  // 将会话从“确认计划”改为“完成”（彻底固定为不可编辑）
  async completeSession(sessionId) {
    const [result] = await db.execute(
      "UPDATE equipment_training_session SET status = 'completed' WHERE session_id = ? AND status = 'confirmed'",
      [sessionId]
    );
    if (result.affectedRows === 0) {
      throw new Error('会话不存在或已锁定');
    }
    return true;
  },

  // 删除训练计划会话（删除该会话及其所有记录）
  async deleteTrainingSession(sessionId) {
    const [sessions] = await db.execute(
      'SELECT session_id FROM equipment_training_session WHERE session_id = ?',
      [sessionId]
    );
    if (sessions.length === 0) {
      throw new Error('会话不存在');
    }
    await db.execute('DELETE FROM equipment_training_record WHERE session_id = ?', [sessionId]);
    await db.execute('DELETE FROM equipment_training_session WHERE session_id = ?', [sessionId]);
    return true;
  }
};

module.exports = equipmentBookingService;
