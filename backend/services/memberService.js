const db = require('../config/database');

const memberService = {
  async findAll() {
    const [rows] = await db.execute('SELECT * FROM member ORDER BY member_account');
    return rows;
  },

  async findByAccount(memberAccount) {
    const [rows] = await db.execute(
      'SELECT * FROM member WHERE member_account = ?',
      [memberAccount]
    );
    return rows[0] || null;
  },

  async insert(member) {
    const {
      memberAccount,
      memberPassword,
      memberName,
      memberGender,
      memberAge,
      memberHeight,
      memberWeight,
      memberPhone,
      cardTime,
      cardClass,
      cardNextClass,
      membershipDuration
    } = member;

    try {
      // Try insert with membership_duration field
      await db.execute(
        `INSERT INTO member (member_account, member_password, member_name, member_gender, 
         member_age, member_height, member_weight, member_phone, card_time, card_class, card_next_class, membership_duration) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [memberAccount, memberPassword, memberName, memberGender, memberAge, 
         memberHeight, memberWeight, memberPhone, cardTime, cardClass, cardNextClass, membershipDuration || null]
      );
    } catch (error) {
      // If error is about unknown column 'membership_duration', try without it
      const isUnknownColumnError = error.code === 'ER_BAD_FIELD_ERROR' || 
                                    error.code === 1054 ||
                                    (error.message && error.message.includes('membership_duration'));
      
      if (isUnknownColumnError) {
        await db.execute(
          `INSERT INTO member (member_account, member_password, member_name, member_gender, 
           member_age, member_height, member_weight, member_phone, card_time, card_class, card_next_class) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [memberAccount, memberPassword, memberName, memberGender, memberAge, 
           memberHeight, memberWeight, memberPhone, cardTime, cardClass, cardNextClass]
        );
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    return true;
  },

  async update(member) {
    const {
      memberAccount,
      memberName,
      memberGender,
      memberAge,
      memberHeight,
      memberWeight,
      memberPhone,
      memberPhoto,
      membershipDuration
    } = member;

    // #region agent log
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(__dirname, '..', '..', '.cursor', 'debug.log');
    const logData1 = {sessionId:'debug-session',runId:'run1',hypothesisId:'C',location:'services/memberService.js:78',message:'Service: Update function entry',data:{hasMemberPhoto:!!memberPhoto,memberPhotoLength:memberPhoto?memberPhoto.length:0,memberPhotoPrefix:memberPhoto?memberPhoto.substring(0,50):null,memberAccount},timestamp:Date.now()};
    try { fs.appendFileSync(logPath, JSON.stringify(logData1) + '\n'); } catch(e) {}
    
    // Check column type
    try {
      const [cols] = await db.execute(`
        SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'member' AND COLUMN_NAME = 'member_photo'
      `);
      const logDataCol = {sessionId:'debug-session',runId:'run1',hypothesisId:'A',location:'services/memberService.js:90',message:'Service: Column type check',data:{columnExists:cols.length>0,dataType:cols[0]?.DATA_TYPE||'N/A',maxLength:cols[0]?.CHARACTER_MAXIMUM_LENGTH||'N/A'},timestamp:Date.now()};
      try { fs.appendFileSync(logPath, JSON.stringify(logDataCol) + '\n'); } catch(e) {}
      console.log('[DEBUG] Column type check:', cols.length > 0 ? `${cols[0].DATA_TYPE} (max: ${cols[0].CHARACTER_MAXIMUM_LENGTH})` : 'NOT FOUND');
    } catch(e) {
      console.log('[DEBUG] Column type check error:', e.message);
    }
    // #endregion

    try {
      // Try update with member_photo and membership_duration fields
      // #region agent log
      const logData2 = {sessionId:'debug-session',runId:'run1',hypothesisId:'B',location:'services/memberService.js:80',message:'Service: Before SQL execute (with photo)',data:{memberAccount},timestamp:Date.now()};
      try { fs.appendFileSync(logPath, JSON.stringify(logData2) + '\n'); } catch(e) {}
      // #endregion
      await db.execute(
        `UPDATE member SET member_name = ?, member_gender = ?, member_age = ?, 
         member_height = ?, member_weight = ?, member_phone = ?, member_photo = ?, membership_duration = ? 
         WHERE member_account = ?`,
        [memberName, memberGender, memberAge, memberHeight, memberWeight, memberPhone, memberPhoto || null, membershipDuration || null, memberAccount]
      );
      // #region agent log
      const logData3 = {sessionId:'debug-session',runId:'run1',hypothesisId:'B',location:'services/memberService.js:85',message:'Service: SQL execute succeeded (with photo)',data:{},timestamp:Date.now()};
      try { fs.appendFileSync(logPath, JSON.stringify(logData3) + '\n'); } catch(e) {}
      // #endregion
    } catch (error) {
      // #region agent log
      const logData4 = {sessionId:'debug-session',runId:'run1',hypothesisId:'B',location:'services/memberService.js:113',message:'Service: SQL execute error caught',data:{errorCode:error.code,errorMessage:error.message,errorSqlState:error.sqlState,errorSqlMessage:error.sqlMessage},timestamp:Date.now()};
      try { fs.appendFileSync(logPath, JSON.stringify(logData4) + '\n'); } catch(e) {}
      // #endregion
      console.error('[DEBUG] SQL error:', error.code, error.message);

      // If error is about unknown column, try without optional fields
      const isUnknownColumnError = error.code === 'ER_BAD_FIELD_ERROR' || 
                                    error.code === 1054 ||
                                    (error.message && (error.message.includes('member_photo') || error.message.includes('membership_duration')));
      
      // If error is about data too long (e.g., base64 image exceeds VARCHAR limit)
      if (error.code === 'ER_DATA_TOO_LONG' || error.code === 1406) {
        // #region agent log
        const logData5 = {sessionId:'debug-session',runId:'run1',hypothesisId:'A',location:'services/memberService.js:127',message:'Service: Data too long error detected',data:{errorCode:error.code},timestamp:Date.now()};
        try { fs.appendFileSync(logPath, JSON.stringify(logData5) + '\n'); } catch(e) {}
        // #endregion
        console.error('[DEBUG] Data too long error');
        throw new Error('图片数据过大，请使用较小的图片或联系管理员');
      }
      
      if (isUnknownColumnError) {
        // #region agent log
        const logData6 = {sessionId:'debug-session',runId:'run1',hypothesisId:'E',location:'services/memberService.js:97',message:'Service: Unknown column error, trying fallback',data:{},timestamp:Date.now()};
        try { fs.appendFileSync(logPath, JSON.stringify(logData6) + '\n'); } catch(e) {}
        // #endregion
        try {
          // Try with member_photo but without membership_duration
          await db.execute(
            `UPDATE member SET member_name = ?, member_gender = ?, member_age = ?, 
             member_height = ?, member_weight = ?, member_phone = ?, member_photo = ? 
             WHERE member_account = ?`,
            [memberName, memberGender, memberAge, memberHeight, memberWeight, memberPhone, memberPhoto || null, memberAccount]
          );
          // #region agent log
          const logData7 = {sessionId:'debug-session',runId:'run1',hypothesisId:'E',location:'services/memberService.js:100',message:'Service: Fallback SQL (with photo, no duration) succeeded',data:{},timestamp:Date.now()};
          try { fs.appendFileSync(logPath, JSON.stringify(logData7) + '\n'); } catch(e) {}
          // #endregion
        } catch (error2) {
          // #region agent log
          const logData8 = {sessionId:'debug-session',runId:'run1',hypothesisId:'E',location:'services/memberService.js:106',message:'Service: Fallback SQL (with photo) failed, trying without photo',data:{errorCode:error2.code,errorMessage:error2.message},timestamp:Date.now()};
          try { fs.appendFileSync(logPath, JSON.stringify(logData8) + '\n'); } catch(e) {}
          // #endregion
          // Try without both optional fields
          await db.execute(
            `UPDATE member SET member_name = ?, member_gender = ?, member_age = ?, 
             member_height = ?, member_weight = ?, member_phone = ? 
             WHERE member_account = ?`,
            [memberName, memberGender, memberAge, memberHeight, memberWeight, memberPhone, memberAccount]
          );
          // #region agent log
          const logData9 = {sessionId:'debug-session',runId:'run1',hypothesisId:'E',location:'services/memberService.js:112',message:'Service: Final fallback SQL (without photo) succeeded',data:{},timestamp:Date.now()};
          try { fs.appendFileSync(logPath, JSON.stringify(logData9) + '\n'); } catch(e) {}
          // #endregion
        }
      } else {
        // #region agent log
        const logData10 = {sessionId:'debug-session',runId:'run1',hypothesisId:'B',location:'services/memberService.js:115',message:'Service: Re-throwing error (not unknown column)',data:{errorCode:error.code},timestamp:Date.now()};
        try { fs.appendFileSync(logPath, JSON.stringify(logData10) + '\n'); } catch(e) {}
        // #endregion
        // Re-throw other errors
        throw error;
      }
    }

    return true;
  },

  async deleteByAccount(memberAccount) {
    await db.execute('DELETE FROM member WHERE member_account = ?', [memberAccount]);
    return true;
  },

  async getTotalCount() {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM member');
    return rows[0].count;
  }
};

module.exports = memberService;
