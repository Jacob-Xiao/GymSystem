-- 器材预约训练记录表（训练计划/记录）
CREATE TABLE IF NOT EXISTS `equipment_training_record` (
  `record_id` int NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `booking_id` int NOT NULL COMMENT '预约ID',
  `session_id` int NULL DEFAULT NULL COMMENT '所属会话ID（NULL表示旧数据）',
  `set_number` int NOT NULL COMMENT '组数序号（从1递增）',
  `weight` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '重量（用户输入）',
  `repetitions` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '重复次数（用户输入）',
  `completed` tinyint(1) NOT NULL DEFAULT 0 COMMENT '该组是否已完成：0-未完成，1-已完成',
  `exercise_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '训练动作名称',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`record_id`) USING BTREE,
  INDEX `idx_booking_id` (`booking_id`) USING BTREE,
  INDEX `idx_session_id` (`session_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '器材预约训练记录表' ROW_FORMAT = Compact;

-- 器材预约训练会话表（每次点击“完成”生成一条会话，用于固定展示历史）
CREATE TABLE IF NOT EXISTS `equipment_training_session` (
  `session_id` int NOT NULL AUTO_INCREMENT COMMENT '会话ID',
  `booking_id` int NOT NULL COMMENT '预约ID',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '完成时间',
  PRIMARY KEY (`session_id`) USING BTREE,
  INDEX `idx_booking_id` (`booking_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '器材预约训练会话表' ROW_FORMAT = Compact;

-- 若表已存在且无 session_id，可执行：ALTER TABLE equipment_training_record ADD COLUMN session_id int NULL DEFAULT NULL AFTER booking_id;
