'use strict';

require('dotenv').config();

const db = require('../config/database');

function columnCheck(table, column) {
  return {
    sql: `SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    params: [table, column]
  };
}

function indexCheck(table, indexName) {
  return {
    sql: `SELECT 1 FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    params: [table, indexName]
  };
}

// Ordered, idempotent steps. Each step runs only when its `check` returns no rows, so
// re-running the migration on an already-migrated database is a no-op.
const STEPS = [
  {
    name: 'member.membership_duration column',
    check: columnCheck('member', 'membership_duration'),
    apply: [
      `ALTER TABLE member ADD COLUMN membership_duration int NULL DEFAULT NULL
         COMMENT '会籍时长（月）' AFTER card_time`
    ]
  },
  {
    name: 'equipment_training_session.status column',
    check: columnCheck('equipment_training_session', 'status'),
    apply: [
      `ALTER TABLE equipment_training_session ADD COLUMN status varchar(20) NOT NULL
         DEFAULT 'completed' COMMENT 'confirmed-确认计划, completed-完成' AFTER booking_id`
    ]
  },
  {
    name: 'class_order.class_id index',
    check: indexCheck('class_order', 'idx_class_id'),
    apply: ['ALTER TABLE class_order ADD INDEX idx_class_id (class_id)']
  },
  {
    name: 'class_order.member_account index',
    check: indexCheck('class_order', 'idx_member_account'),
    apply: ['ALTER TABLE class_order ADD INDEX idx_member_account (member_account)']
  },
  {
    // Must run before the unique index: duplicate (class_id, member_account) rows would
    // otherwise make the ALTER fail. Keeps the earliest enrolment of each pair.
    name: 'class_order duplicate enrolment cleanup',
    // Note the direction: every `check` in this file answers "is there nothing left to
    // do?" (returns a row => skip). So this returns a row only when the table is already
    // free of duplicates. An earlier version asked "do duplicates exist?", which inverted
    // the convention and re-ran the DELETE on every migration.
    check: {
      sql: `SELECT 1 FROM DUAL WHERE NOT EXISTS (
              SELECT 1 FROM class_order
               WHERE class_id IS NOT NULL AND member_account IS NOT NULL
               GROUP BY class_id, member_account HAVING COUNT(*) > 1
            )`,
      params: []
    },
    apply: [
      `DELETE c1 FROM class_order c1
         JOIN class_order c2
           ON c1.class_id = c2.class_id
          AND c1.member_account = c2.member_account
          AND c1.class_order_id > c2.class_order_id
        WHERE c1.class_id IS NOT NULL AND c1.member_account IS NOT NULL`
    ]
  },
  {
    name: 'class_order unique (class_id, member_account)',
    check: indexCheck('class_order', 'uq_class_order_class_member'),
    apply: ['ALTER TABLE class_order ADD UNIQUE INDEX uq_class_order_class_member (class_id, member_account)']
  },
  {
    name: 'notification.created_at index',
    check: indexCheck('notification', 'idx_created_at'),
    apply: ['ALTER TABLE notification ADD INDEX idx_created_at (created_at)']
  },
  {
    // Matches the conflict-detection predicate in equipmentBookingService.createBooking.
    name: 'equipment_booking conflict-detection index',
    check: indexCheck('equipment_booking', 'idx_equipment_status_time'),
    apply: [
      `ALTER TABLE equipment_booking ADD INDEX idx_equipment_status_time
         (equipment_id, status, start_time, end_time)`
    ]
  },
  {
    name: 'equipment_share_request.requester status index',
    check: indexCheck('equipment_share_request', 'idx_requester_status'),
    apply: ['ALTER TABLE equipment_share_request ADD INDEX idx_requester_status (requester_account, status)']
  },
  {
    name: 'equipment_share_request.booking status index',
    check: indexCheck('equipment_share_request', 'idx_booking_status'),
    apply: ['ALTER TABLE equipment_share_request ADD INDEX idx_booking_status (booking_id, status)']
  }
];

async function migrate() {
  let applied = 0;
  let skipped = 0;

  for (const step of STEPS) {
    const [rows] = await db.execute(step.check.sql, step.check.params);
    if (rows.length > 0) {
      console.log(`  skip    ${step.name}`);
      skipped += 1;
      continue;
    }

    for (const statement of step.apply) {
      await db.query(statement);
    }
    console.log(`  applied ${step.name}`);
    applied += 1;
  }

  return { applied, skipped };
}

if (require.main === module) {
  migrate()
    .then(({ applied, skipped }) => {
      console.log(`\nMigration complete: ${applied} applied, ${skipped} already present.`);
      return db.end();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\nMigration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { migrate, STEPS };
