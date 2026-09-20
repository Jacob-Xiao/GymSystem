const db = require('../config/database');
const cache = require('../config/cache');

const CACHE_PREFIX = 'notification:';
const LIST_TTL_MS = Number.parseInt(process.env.NOTIFICATION_CACHE_TTL_MS, 10) || 15000;

function parseTargetAccounts(row) {
  try {
    return {
      ...row,
      target_accounts: row.target_accounts ? JSON.parse(row.target_accounts) : null
    };
  } catch (_) {
    return { ...row, target_accounts: null };
  }
}

const notificationService = {
  // 创建通知
  async create(notification) {
    const { title, content, targetType, targetAccounts } = notification;

    // Normalize to strings so newly written rows are unambiguous. Legacy rows may still
    // hold JSON numbers, which the read path below handles.
    const normalizedAccounts = targetAccounts && targetAccounts.length > 0
      ? targetAccounts.map((account) => String(account))
      : null;

    const targetAccountsJson = normalizedAccounts ? JSON.stringify(normalizedAccounts) : null;

    const [result] = await db.execute(
      `INSERT INTO notification (title, content, target_type, target_accounts) 
       VALUES (?, ?, ?, ?)`,
      [title, content, targetType, targetAccountsJson]
    );

    cache.invalidate(CACHE_PREFIX);
    return result.insertId;
  },

  // 获取所有通知
  async findAll() {
    return cache.wrap(`${CACHE_PREFIX}all`, LIST_TTL_MS, async () => {
      const [rows] = await db.execute(
        'SELECT * FROM notification ORDER BY created_at DESC'
      );
      return rows.map(parseTargetAccounts);
    });
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

    return parseTargetAccounts(rows[0]);
  },

  // 删除通知
  async delete(notificationId) {
    await db.execute('DELETE FROM notification WHERE notification_id = ?', [notificationId]);
    cache.invalidate(CACHE_PREFIX);
    return true;
  },

  // 根据会员账号获取该会员应该收到的通知
  //
  // Previously this loaded the entire notification table and filtered/parsed every row
  // in JS on each request. The filter is now pushed into SQL and the per-member result
  // is cached.
  //
  // The predicate is deliberately a dual JSON_CONTAINS. JSON_SEARCH cannot be used here:
  // it only ever matches JSON *strings*, so it misses rows whose target_accounts hold JSON
  // numbers -- and the admin UI sends member_account as a number, so those rows are the
  // common case. Matching both the string and the numeric encoding covers rows written by
  // either the old code path or the normalized one.
  async findByMemberAccount(memberAccount) {
    const accountStr = String(typeof memberAccount === 'string' ? parseInt(memberAccount, 10) : memberAccount);

    return cache.wrap(`${CACHE_PREFIX}member:${accountStr}`, LIST_TTL_MS, async () => {
      const [rows] = await db.execute(
        `SELECT * FROM notification
          WHERE target_type = 'all'
             OR (
                  target_type = 'specific'
                  AND target_accounts IS NOT NULL
                  AND JSON_VALID(target_accounts)
                  AND (
                       JSON_CONTAINS(target_accounts, JSON_ARRAY(?))
                       OR JSON_CONTAINS(target_accounts, JSON_ARRAY(CAST(? AS UNSIGNED)))
                     )
                )
          ORDER BY created_at DESC`,
        [accountStr, accountStr]
      );

      return rows.map(parseTargetAccounts);
    });
  }
};

module.exports = notificationService;
module.exports.parseTargetAccounts = parseTargetAccounts;
