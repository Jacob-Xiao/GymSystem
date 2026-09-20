const db = require('../config/database');
const schema = require('../config/schema');

function buildInsert(member, supportsMembershipDuration) {
  const columns = [
    'member_account',
    'member_password',
    'member_name',
    'member_gender',
    'member_age',
    'member_height',
    'member_weight',
    'member_phone',
    'card_time',
    'card_class',
    'card_next_class'
  ];
  const values = [
    member.memberAccount,
    member.memberPassword,
    member.memberName,
    member.memberGender,
    member.memberAge,
    member.memberHeight,
    member.memberWeight,
    member.memberPhone,
    member.cardTime,
    member.cardClass,
    member.cardNextClass
  ];

  if (supportsMembershipDuration) {
    columns.push('membership_duration');
    values.push(member.membershipDuration || null);
  }

  return {
    sql: `INSERT INTO member (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    values
  };
}

function buildUpdate(member, supportsMembershipDuration) {
  const columns = [
    'member_name = ?',
    'member_gender = ?',
    'member_age = ?',
    'member_height = ?',
    'member_weight = ?',
    'member_phone = ?',
    'member_photo = ?'
  ];
  const values = [
    member.memberName,
    member.memberGender,
    member.memberAge,
    member.memberHeight,
    member.memberWeight,
    member.memberPhone,
    member.memberPhoto || null
  ];

  if (supportsMembershipDuration) {
    columns.push('membership_duration = ?');
    values.push(member.membershipDuration || null);
  }

  values.push(member.memberAccount);

  return {
    sql: `UPDATE member SET ${columns.join(', ')} WHERE member_account = ?`,
    values
  };
}

const memberService = {
  // Opt-in pagination: callers that omit `limit` keep the full-list behaviour the
  // React app depends on, but a bounded scan is available under load.
  //
  // `member_photo` is a mediumtext base64 blob read only by the profile screens (via
  // findByAccount / the login response), so it is excluded here to keep it out of every
  // list payload.
  async findAll(options = {}) {
    const { membershipDuration } = await schema.get();

    const columns = [
      'member_account',
      'member_password',
      'member_name',
      'member_gender',
      'member_age',
      'member_height',
      'member_weight',
      'member_phone',
      'card_time',
      'card_class',
      'card_next_class'
    ];
    if (membershipDuration) columns.push('membership_duration');
    const projection = columns.join(', ');

    const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : null;

    if (limit === null) {
      const [rows] = await db.execute(`SELECT ${projection} FROM member ORDER BY member_account`);
      return rows;
    }

    const offset = Number.isInteger(options.offset) && options.offset > 0 ? options.offset : 0;
    const [rows] = await db.query(
      `SELECT ${projection} FROM member ORDER BY member_account LIMIT ? OFFSET ?`,
      [limit, offset]
    );
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
    const { membershipDuration } = await schema.get();
    const { sql, values } = buildInsert(member, membershipDuration);
    await db.execute(sql, values);
    return true;
  },

  async update(member) {
    const { membershipDuration } = await schema.get();
    const { sql, values } = buildUpdate(member, membershipDuration);
    await db.execute(sql, values);
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
