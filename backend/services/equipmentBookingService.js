const db = require('../config/database');
const cache = require('../config/cache');
const schema = require('../config/schema');

const EQUIPMENT_CACHE_PREFIX = 'equipment:';
const AVAILABLE_TTL_MS = Number.parseInt(process.env.EQUIPMENT_CACHE_TTL_MS, 10) || 15000;

// Same projection as the admin list: booking picks render name/location/status/message only.
const AVAILABLE_EQUIPMENT_COLUMNS =
  'equipment_id, equipment_name, equipment_location, equipment_status, equipment_message';

const equipmentBookingService = {
  // 获取所有器材列表（用于预约，只显示状态为"正常"的）
  async getAllEquipment() {
    return cache.wrap(`${EQUIPMENT_CACHE_PREFIX}available`, AVAILABLE_TTL_MS, async () => {
      const [rows] = await db.execute(
        `SELECT ${AVAILABLE_EQUIPMENT_COLUMNS} FROM equipment WHERE equipment_status = '正常' ORDER BY equipment_id`
      );
      return rows;
    });
  },

  // 获取会员的所有预约（包括自己创建的以及通过接受分享请求获得的）
  async getBookingsByMember(memberAccount) {
    const [ownBookings] = await db.execute(
      `SELECT eb.*, e.equipment_name, e.equipment_location, 'owner' as booking_type
       FROM equipment_booking eb
       JOIN equipment e ON eb.equipment_id = e.equipment_id
       WHERE eb.member_account = ? AND eb.status = 'active'
       ORDER BY eb.start_time DESC`,
      [memberAccount]
    );

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

    ownBookings.forEach((booking) => {
      bookingMap.set(booking.booking_id, booking);
    });

    sharedBookings.forEach((booking) => {
      bookingMap.set(booking.booking_id, booking);
    });

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
  //
  // The original implementation ran a conflict SELECT and then a separate INSERT with no
  // transaction, so two concurrent requests for the same slot could both pass the check
  // and double-book the equipment. The equipment row is now locked for the duration of
  // the check + insert; bookings for different equipment still run in parallel.
  async createBooking(booking) {
    const {
      equipmentId,
      memberAccount,
      memberName,
      startTime,
      endTime,
      locationNote
    } = booking;

    return db.withTransaction(async (connection) => {
      const [equipment] = await connection.execute(
        'SELECT equipment_id FROM equipment WHERE equipment_id = ? FOR UPDATE',
        [equipmentId]
      );

      if (equipment.length === 0) {
        throw new Error('器材不存在');
      }

      // Standard half-open interval overlap: existing [start,end) intersects [s,e)
      // exactly when start < e AND end > s. Equivalent to the previous three-branch
      // predicate but index-friendly.
      const [conflicts] = await connection.execute(
        `SELECT booking_id FROM equipment_booking
          WHERE equipment_id = ?
            AND status = 'active'
            AND start_time < ?
            AND end_time > ?
          LIMIT 1`,
        [equipmentId, endTime, startTime]
      );

      if (conflicts.length > 0) {
        throw new Error('该时间段已被预约，请选择其他时间');
      }

      const [result] = await connection.execute(
        `INSERT INTO equipment_booking 
         (equipment_id, member_account, member_name, start_time, end_time, location_note, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [equipmentId, memberAccount, memberName, startTime, endTime, locationNote || '']
      );

      return result.insertId;
    });
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
  //
  // Locks the booking row so the "already pending?" check and the insert are atomic;
  // previously two simultaneous submissions could both create a pending request.
  async createShareRequest(bookingId, requesterAccount, requesterName) {
    return db.withTransaction(async (connection) => {
      const [bookings] = await connection.execute(
        `SELECT booking_id, member_account, status FROM equipment_booking WHERE booking_id = ? FOR UPDATE`,
        [bookingId]
      );

      if (bookings.length === 0 || bookings[0].status !== 'active') {
        throw new Error('预约不存在或已失效');
      }

      if (parseInt(bookings[0].member_account, 10) === parseInt(requesterAccount, 10)) {
        throw new Error('不能向自己的预约申请分享');
      }

      const [existing] = await connection.execute(
        `SELECT request_id FROM equipment_share_request 
          WHERE booking_id = ? AND requester_account = ? AND status = 'pending'`,
        [bookingId, requesterAccount]
      );

      if (existing.length > 0) {
        throw new Error('您已经提交过分享请求，请等待处理');
      }

      const [result] = await connection.execute(
        `INSERT INTO equipment_share_request 
         (booking_id, requester_account, requester_name, status) 
         VALUES (?, ?, ?, 'pending')`,
        [bookingId, requesterAccount, requesterName]
      );

      return result.insertId;
    });
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
    const status = action === 'accept' ? 'accepted' : 'rejected';

    return db.withTransaction(async (connection) => {
      const [requests] = await connection.execute(
        `SELECT esr.request_id FROM equipment_share_request esr
         JOIN equipment_booking eb ON esr.booking_id = eb.booking_id
         WHERE esr.request_id = ? AND eb.member_account = ?
         FOR UPDATE`,
        [requestId, bookingOwnerAccount]
      );

      if (requests.length === 0) {
        throw new Error('请求不存在或无权限处理');
      }

      await connection.execute(
        `UPDATE equipment_share_request 
         SET status = ? 
         WHERE request_id = ?`,
        [status, requestId]
      );

      return true;
    });
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
  //
  // Previously this issued one query per session to fetch its records (N+1). All records
  // are now fetched in a single query and grouped in memory.
  async getTrainingSessionsByBooking(bookingId) {
    const supportsStatus = (await schema.get()).trainingSessionStatus;

    const [sessions] = supportsStatus
      ? await db.execute(
        `SELECT session_id, booking_id, created_at, COALESCE(status, 'completed') as status
           FROM equipment_training_session
          WHERE booking_id = ?
          ORDER BY created_at DESC`,
        [bookingId]
      )
      : (await db.execute(
        `SELECT session_id, booking_id, created_at
           FROM equipment_training_session
          WHERE booking_id = ?
          ORDER BY created_at DESC`,
        [bookingId]
      ))[0].map((s) => ({ ...s, status: 'completed' }));

    const result = [];

    if (sessions.length > 0) {
      const placeholders = sessions.map(() => '?').join(',');
      const [records] = await db.execute(
        `SELECT record_id, session_id, set_number, weight, repetitions, completed, exercise_name
           FROM equipment_training_record
          WHERE session_id IN (${placeholders})
          ORDER BY set_number ASC`,
        sessions.map((s) => s.session_id)
      );

      const bySession = new Map();
      for (const record of records) {
        const bucket = bySession.get(record.session_id);
        if (bucket) bucket.push(record);
        else bySession.set(record.session_id, [record]);
      }

      for (const session of sessions) {
        result.push({
          session_id: session.session_id,
          created_at: session.created_at,
          status: session.status || 'completed',
          records: bySession.get(session.session_id) || []
        });
      }
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

  // 保存预约的训练记录（仅预约所有者可操作；fullyComplete=true 为“完成”，false 为“确认计划”）
  async saveTrainingRecords(bookingId, records, fullyComplete = true, memberAccount) {
    if (!records || records.length === 0) return [];

    const status = fullyComplete ? 'completed' : 'confirmed';

    return db.withTransaction(async (connection) => {
      const [bookings] = await connection.execute(
        'SELECT booking_id, member_account FROM equipment_booking WHERE booking_id = ?',
        [bookingId]
      );

      if (bookings.length === 0) {
        throw new Error('预约不存在');
      }
      if (parseInt(bookings[0].member_account, 10) !== parseInt(memberAccount, 10)) {
        throw new Error('仅预约所有者可添加训练计划');
      }

      const supportsStatus = (await schema.get()).trainingSessionStatus;
      const [sessionResult] = supportsStatus
        ? await connection.execute(
          'INSERT INTO equipment_training_session (booking_id, status) VALUES (?, ?)',
          [bookingId, status]
        )
        : await connection.execute(
          'INSERT INTO equipment_training_session (booking_id) VALUES (?)',
          [bookingId]
        );

      const sessionId = sessionResult.insertId;

      // One multi-row INSERT instead of one statement per set: this is a write path,
      // and N round-trips per save is what made it expensive at high TPS.
      const placeholders = records.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = [];
      for (const record of records) {
        values.push(
          bookingId,
          sessionId,
          record.set_number,
          record.weight || '',
          record.repetitions || '',
          record.completed ? 1 : 0,
          record.exercise_name || ''
        );
      }

      await connection.execute(
        `INSERT INTO equipment_training_record
         (booking_id, session_id, set_number, weight, repetitions, completed, exercise_name)
         VALUES ${placeholders}`,
        values
      );

      return records.map((record) => ({ ...record, session_id: sessionId }));
    });
  },

  // 更新某条记录的“完成”勾选（仅预约所有者可操作）
  async updateRecordCompleted(recordId, completed, memberAccount) {
    const [rows] = await db.execute(
      `SELECT eb.member_account FROM equipment_training_record r
       INNER JOIN equipment_training_session s ON r.session_id = s.session_id
       INNER JOIN equipment_booking eb ON s.booking_id = eb.booking_id
       WHERE r.record_id = ?`,
      [recordId]
    );
    if (rows.length === 0) {
      throw new Error('记录不存在');
    }
    if (parseInt(rows[0].member_account, 10) !== parseInt(memberAccount, 10)) {
      throw new Error('仅预约所有者可修改训练计划');
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

  // 删除训练计划会话（仅预约所有者可操作）
  async deleteTrainingSession(sessionId, memberAccount) {
    return db.withTransaction(async (connection) => {
      const [sessions] = await connection.execute(
        `SELECT s.session_id, eb.member_account FROM equipment_training_session s
         INNER JOIN equipment_booking eb ON s.booking_id = eb.booking_id
         WHERE s.session_id = ?`,
        [sessionId]
      );
      if (sessions.length === 0) {
        throw new Error('会话不存在');
      }
      if (parseInt(sessions[0].member_account, 10) !== parseInt(memberAccount, 10)) {
        throw new Error('仅预约所有者可删除训练计划');
      }
      await connection.execute('DELETE FROM equipment_training_record WHERE session_id = ?', [sessionId]);
      await connection.execute('DELETE FROM equipment_training_session WHERE session_id = ?', [sessionId]);
      return true;
    });
  }
};

module.exports = equipmentBookingService;
