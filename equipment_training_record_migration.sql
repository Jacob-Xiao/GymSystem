-- 训练记录会话功能迁移（若已执行过旧版 equipment_training_record.sql，请执行本文件）
-- 1. 创建训练会话表（若已存在可跳过）
CREATE TABLE IF NOT EXISTS `equipment_training_session` (
  `session_id` int NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `booking_id` int NOT NULL COMMENT '预约ID',
  `status` varchar(20) NOT NULL DEFAULT 'completed' COMMENT 'confirmed-确认计划, completed-完成',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '完成时间',
  PRIMARY KEY (`session_id`) USING BTREE,
  INDEX `idx_booking_id` (`booking_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '器材预约训练会话表' ROW_FORMAT = Compact;

-- 2. 为旧表增加 session_id 列（若已存在该列可忽略报错）
-- ALTER TABLE equipment_training_record ADD COLUMN session_id int NULL DEFAULT NULL AFTER booking_id;
-- ALTER TABLE equipment_training_record ADD INDEX idx_session_id (session_id);

-- 3. 若 equipment_training_session 已存在但无 status 列，执行：
-- ALTER TABLE equipment_training_session ADD COLUMN status varchar(20) NOT NULL DEFAULT 'completed' AFTER booking_id;
