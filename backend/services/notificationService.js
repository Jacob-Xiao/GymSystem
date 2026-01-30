const db = require('../config/database');

const notificationService = {
  // 创建通知
  async create(notification) {
    const { title, content, targetType, targetAccounts } = notification;
    
    const targetAccountsJson = targetAccounts && targetAccounts.length > 0 
      ? JSON.stringify(targetAccounts) 
      : null;

    const [result] = await db.execute(
      `INSERT INTO notification (title, content, target_type, target_accounts) 
       VALUES (?, ?, ?, ?)`,
      [title, content, targetType, targetAccountsJson]
    );

    return result.insertId;
  },

  // 获取所有通知
  async findAll() {
    const [rows] = await db.execute(
      'SELECT * FROM notification ORDER BY created_at DESC'
    );
    
    // 解析target_accounts JSON
    return rows.map(row => ({
      ...row,
      target_accounts: row.target_accounts ? JSON.parse(row.target_accounts) : null
    }));
  },

  // 根据ID获取通知
  async findById(notificationId) {
    const [rows] = await db.execute(
      'SELECT * FROM notification WHERE notification_id = ?',
      [notificationId]
    );
    
    if (rows.length === 0) {
      return null;
    }

    const notification = rows[0];
    notification.target_accounts = notification.target_accounts 
      ? JSON.parse(notification.target_accounts) 
      : null;

    return notification;
  },

  // 删除通知
  async delete(notificationId) {
    await db.execute('DELETE FROM notification WHERE notification_id = ?', [notificationId]);
    return true;
  },

  // 根据会员账号获取该会员应该收到的通知
  async findByMemberAccount(memberAccount) {
    // 确保memberAccount是整数类型
    const accountNum = typeof memberAccount === 'string' ? parseInt(memberAccount) : memberAccount;
    
    // 获取所有通知
    const [rows] = await db.execute(
      `SELECT * FROM notification 
       ORDER BY created_at DESC`
    );
    
    // 过滤出该会员应该收到的通知
    const notifications = rows
      .map(row => {
        try {
          const targetAccounts = row.target_accounts ? JSON.parse(row.target_accounts) : null;
          return {
            ...row,
            target_accounts: targetAccounts
          };
        } catch (e) {
          return {
            ...row,
            target_accounts: null
          };
        }
      })
      .filter(row => {
        // 全体通知，所有会员都能看到
        if (row.target_type === 'all') {
          return true;
        }
        // 个别通知，检查是否包含该会员账号
        if (row.target_type === 'specific' && row.target_accounts) {
          // 将target_accounts中的每个账号都转换为整数进行比较
          const accounts = row.target_accounts.map(acc => 
            typeof acc === 'string' ? parseInt(acc) : acc
          );
          return accounts.includes(accountNum);
        }
        return false;
      });

    return notifications;
  }
};

module.exports = notificationService;
