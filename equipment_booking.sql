-- 器材预约表
CREATE TABLE IF NOT EXISTS `equipment_booking` (
  `booking_id` int NOT NULL AUTO_INCREMENT COMMENT '预约ID',
  `equipment_id` int NOT NULL COMMENT '器材ID',
  `member_account` int NOT NULL COMMENT '预约会员账号',
  `member_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '预约会员姓名',
  `start_time` datetime NOT NULL COMMENT '开始时间',
  `end_time` datetime NOT NULL COMMENT '结束时间',
  `location_note` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '训练地址备注',
  `status` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'active' COMMENT '状态：active-有效，cancelled-已取消，completed-已完成',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`booking_id`) USING BTREE,
  INDEX `idx_equipment_id` (`equipment_id`) USING BTREE,
  INDEX `idx_member_account` (`member_account`) USING BTREE,
  INDEX `idx_time` (`start_time`, `end_time`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '器材预约表' ROW_FORMAT = Compact;

-- 器材分享请求表
CREATE TABLE IF NOT EXISTS `equipment_share_request` (
  `request_id` int NOT NULL AUTO_INCREMENT COMMENT '请求ID',
  `booking_id` int NOT NULL COMMENT '预约ID',
  `requester_account` int NOT NULL COMMENT '请求者会员账号',
  `requester_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '请求者姓名',
  `status` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'pending' COMMENT '状态：pending-待处理，accepted-已接受，rejected-已拒绝',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`request_id`) USING BTREE,
  INDEX `idx_booking_id` (`booking_id`) USING BTREE,
  INDEX `idx_requester` (`requester_account`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '器材分享请求表' ROW_FORMAT = Compact;
