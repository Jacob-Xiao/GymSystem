-- 创建通知表
DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
  `notification_id` int NOT NULL AUTO_INCREMENT COMMENT '通知ID',
  `title` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '通知标题',
  `content` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '通知内容',
  `target_type` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '目标类型: all(全体), specific(个别)',
  `target_accounts` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '目标会员账号列表(JSON格式，仅当target_type为specific时使用)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`notification_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Compact COMMENT = '通知表';
