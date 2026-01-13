-- 为会员表添加会籍时长字段（单位：月）
ALTER TABLE `member` 
ADD COLUMN `membership_duration` INT NULL DEFAULT NULL COMMENT '会籍时长（月）' AFTER `card_time`;

-- 如果已有数据，可以为现有会员设置默认会籍时长（例如12个月）
-- UPDATE member SET membership_duration = 12 WHERE membership_duration IS NULL;
