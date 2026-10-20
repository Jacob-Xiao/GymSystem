const db = require('../config/database');
const cache = require('../config/cache');
const adminService = require('./adminService');
const memberService = require('./memberService');
const { verifyPassword, hashPassword } = require('../config/passwords');
const { signToken } = require('../middleware/auth');

const DASHBOARD_CACHE_KEY = 'dashboard:stats';
const DASHBOARD_TTL_MS = Number.parseInt(process.env.DASHBOARD_CACHE_TTL_MS, 10) || 30000;

const INVALID_CREDENTIALS = '您输入的账号或密码有误，请重新输入！';

// Upgrade a legacy plaintext password on the first successful login. This runs after the
// comparison, so a failed guess never rewrites the stored value.
async function upgradeIfNeeded(table, idColumn, idValue, plain, needsUpgrade) {
  if (!needsUpgrade) return;
  try {
    await db.execute(
      `UPDATE ${table} SET ${table === 'admin' ? 'admin_password' : 'member_password'} = ? WHERE ${idColumn} = ?`,
      [await hashPassword(plain), idValue]
    );
  } catch (error) {
    // A failed upgrade must not fail the login: the user is authenticated, and the next
    // successful login will try again.
    console.error('[auth] password upgrade failed:', error.message);
  }
}

const loginService = {
  async adminLogin(adminAccount, adminPassword) {
    const admin = await adminService.findByAccount(adminAccount);

    if (!admin) {
      return { success: false, message: INVALID_CREDENTIALS };
    }

    const { matches, needsUpgrade } = await verifyPassword(adminPassword, admin.admin_password);
    if (!matches) {
      return { success: false, message: INVALID_CREDENTIALS };
    }

    await upgradeIfNeeded('admin', 'admin_account', admin.admin_account, adminPassword, needsUpgrade);

    // Get dashboard statistics
    const stats = await this.getAdminDashboardStats();

    return {
      success: true,
      token: signToken({ role: 'admin', account: admin.admin_account }),
      admin: {
        adminAccount: admin.admin_account
      },
      stats
    };
  },

  async memberLogin(memberAccount, memberPassword) {
    const member = await memberService.findByAccount(memberAccount);

    if (!member) {
      return { success: false, message: INVALID_CREDENTIALS };
    }

    const { matches, needsUpgrade } = await verifyPassword(memberPassword, member.member_password);
    if (!matches) {
      return { success: false, message: INVALID_CREDENTIALS };
    }

    await upgradeIfNeeded('member', 'member_account', member.member_account, memberPassword, needsUpgrade);

    return {
      success: true,
      token: signToken({ role: 'member', account: member.member_account }),
      member: {
        memberAccount: member.member_account,
        memberName: member.member_name,
        memberGender: member.member_gender,
        memberAge: member.member_age,
        memberHeight: member.member_height,
        memberWeight: member.member_weight,
        memberPhone: member.member_phone,
        memberPhoto: member.member_photo,
        cardTime: member.card_time,
        cardClass: member.card_class,
        cardNextClass: member.card_next_class,
        membershipDuration: member.membership_duration
      }
    };
  },

  // One round-trip instead of three, cached for a short TTL: the counters are a
  // dashboard nicety, not a consistency-critical read, and stale-by-30s is acceptable.
  async getAdminDashboardStats() {
    return cache.wrap(DASHBOARD_CACHE_KEY, DASHBOARD_TTL_MS, async () => {
      const [rows] = await db.execute(
        `SELECT
           (SELECT COUNT(*) FROM member)    AS memberTotal,
           (SELECT COUNT(*) FROM employee)  AS employeeTotal,
           (SELECT COUNT(*) FROM equipment) AS equipmentTotal`
      );

      const row = rows[0];
      return {
        memberTotal: row.memberTotal,
        employeeTotal: row.employeeTotal,
        humanTotal: row.memberTotal + row.employeeTotal,
        equipmentTotal: row.equipmentTotal
      };
    });
  }
};

module.exports = loginService;
