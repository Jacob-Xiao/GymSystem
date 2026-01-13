-- 为会员表添加照片字段
ALTER TABLE `member` 
ADD COLUMN `member_photo` VARCHAR(500) NULL DEFAULT NULL COMMENT '会员照片URL' AFTER `member_phone`;
