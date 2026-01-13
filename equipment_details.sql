-- 为器材表添加图片和功能字段
ALTER TABLE `equipment` 
ADD COLUMN `equipment_image` VARCHAR(500) NULL DEFAULT NULL COMMENT '器材图片URL' AFTER `equipment_status`,
ADD COLUMN `equipment_function` TEXT NULL DEFAULT NULL COMMENT '器材功能说明' AFTER `equipment_image`;
