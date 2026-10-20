const db = require('../config/database');
const schema = require('../config/schema');

// Fields the list view renders. `member_photo` (mediumtext base64) and
// `member_password` are deliberately excluded: the first is a blob read only by
// the profile screens, the second must never leave the server.
const LIST_COLUMNS = [
  'member_account',
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

// Columns a client may edit through the member update endpoint.
const UPDATABLE_COLUMNS = [
  ['memberName', 'member_name'],
  ['memberGender', 'member_gender'],
  ['memberAge', 'member_age'],
  ['memberHeight', 'member_height'],
  ['memberWeight', 'member_weight'],
  ['memberPhone', 'member_phone'],
  ['memberPhoto', 'member_photo'],
  ['cardClass', 'card_class'],
  ['cardNextClass', 'card_next_class']
];

function listProjection(supportsMembershipDuration) {
  const columns = [...LIST_COLUMNS];
  if (supportsMembershipDuration) columns.push('membership_duration');
  return columns.join(', ');
}

function toColumnValue(value) {
  // An explicit empty string means "clear this field"; anything else is stored as-is.
  return value === '' || value === undefined ? null : value;
}

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

/**
 * Build a partial UPDATE from only the fields present in the request.
 *
 * The previous implementation wrote every column, filling absent ones with NULL. Admin
 * edit forms do not send `memberPhoto`, so a routine "edit phone number" silently wiped
 * a stored photo. Partial updates make an omitted field mean "leave it alone"; an
 * explicitly empty value still clears the column.
 */
function buildUpdate(member, supportsMembershipDuration) {
  const assignments = [];
  const values = [];

  for (const [field, column] of UPDATABLE_COLUMNS) {
    if (!Object.prototype.hasOwnProperty.call(member, field)) continue;
    assignments.push(`${column} = ?`);
    values.push(toColumnValue(member[field]));
  }

  if (supportsMembershipDuration && Object.prototype.hasOwnProperty.call(member, 'membershipDuration')) {
    assignments.push('membership_duration = ?');
    values.push(toColumnValue(member.membershipDuration));
  }

  if (assignments.length === 0) return null;

  values.push(member.memberAccount);

  return {
    sql: `UPDATE member SET ${assignments.join(', ')} WHERE member_account = ?`,
    values
  };
}

const memberService = {
  // Opt-in pagination: callers that omit `limit` keep the full-list behaviour the
  // React app depends on, but a bounded scan is available under load.
  async findAll(options = {}) {
    const { membershipDuration } = await schema.get();
    const projection = listProjection(membershipDuration);

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

  // Full row (including the photo and password) for server-side use: login, and the
  // services that derive a member's name or credentials. Never return this to a client.
  async findByAccount(memberAccount) {
    const [rows] = await db.execute(
      'SELECT * FROM member WHERE member_account = ?',
      [memberAccount]
    );
    return rows[0] || null;
  },

  // Client-safe projection. `member_photo` is included because the admin edit form
  // needs it to render/keep the photo, but the password is never selected.
  async findProfileByAccount(memberAccount) {
    const { membershipDuration } = await schema.get();

    const columns = [...LIST_COLUMNS, 'member_photo'];
    if (membershipDuration) columns.push('membership_duration');

    const [rows] = await db.execute(
      `SELECT ${columns.join(', ')} FROM member WHERE member_account = ?`,
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
    const statement = buildUpdate(member, membershipDuration);

    // Nothing to change: succeed without touching the row.
    if (!statement) return true;

    await db.execute(statement.sql, statement.values);
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
module.exports.buildUpdate = buildUpdate;
module.exports.LIST_COLUMNS = LIST_COLUMNS;
