const db = require('../config/database');
const cache = require('../config/cache');
const adminService = require('./adminService');
const memberService = require('./memberService');

const DASHBOARD_CACHE_KEY = 'dashboard:stats';
const DASHBOARD_TTL_MS = Number.parseInt(process.env.DASHBOARD_CACHE_TTL_MS, 10) || 30000;

const loginService = {
  async adminLogin(adminAccount, adminPassword) {
    const admin = await adminService.findByAccount(adminAccount);

    if (!admin) {
      return { success: false, message: '您输入的账号或密码有误，请重新输入！' };
    }

    if (admin.admin_password !== adminPassword) {
      return { success: false, message: '您输入的账号或密码有误，请重新输入！' };
    }

    // Get dashboard statistics
    const stats = await this.getAdminDashboardStats();

    return {
      success: true,
      admin: {
        adminAccount: admin.admin_account
      },
      stats
    };
  },

  async memberLogin(memberAccount, memberPassword) {
    const member = await memberService.findByAccount(memberAccount);

    if (!member) {
      return { success: false, message: '您输入的账号或密码有误，请重新输入！' };
    }

    if (member.member_password !== memberPassword) {
      return { success: false, message: '您输入的账号或密码有误，请重新输入！' };
    }

    return {
      success: true,
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
