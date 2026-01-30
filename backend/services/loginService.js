const db = require('../config/database');
const adminService = require('./adminService');
const memberService = require('./memberService');

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

  async getAdminDashboardStats() {
    const [memberCount] = await db.execute('SELECT COUNT(*) as count FROM member');
    const [employeeCount] = await db.execute('SELECT COUNT(*) as count FROM employee');
    const [equipmentCount] = await db.execute('SELECT COUNT(*) as count FROM equipment');
    
    return {
      memberTotal: memberCount[0].count,
      employeeTotal: employeeCount[0].count,
      humanTotal: memberCount[0].count + employeeCount[0].count,
      equipmentTotal: equipmentCount[0].count
    };
  }
};

module.exports = loginService;
