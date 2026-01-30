-- 为器材表添加图片和功能字段，并修复字段类型以支持base64图片
-- 
-- 问题说明：
-- 器材信息修改时，修改图片后点击保存，会显示"Unknown column 'equipment_image' in 'field list'"
-- 原因：equipment表中缺少equipment_image和equipment_function字段
--
-- 解决方案：
-- 1. 添加equipment_image字段（MEDIUMTEXT类型以支持base64图片）
-- 2. 添加equipment_function字段（TEXT类型）
-- 3. 如果字段已存在但类型是VARCHAR，则修改为MEDIUMTEXT
--
-- 使用方法：
-- 1. 连接到 MySQL 数据库
-- 2. 选择 gym_management_system 数据库
-- 3. 执行此 SQL 脚本
-- 
-- 注意：如果字段已存在，ALTER TABLE会失败，可以安全地忽略错误，或者先检查字段是否存在

-- 添加equipment_image字段（如果不存在，可以安全地忽略错误）
ALTER TABLE `equipment` 
ADD COLUMN `equipment_image` MEDIUMTEXT NULL DEFAULT NULL COMMENT '器材图片URL（base64编码）' AFTER `equipment_status`;

-- 如果字段已存在但类型是VARCHAR，则修改为MEDIUMTEXT
ALTER TABLE `equipment` 
MODIFY COLUMN `equipment_image` MEDIUMTEXT NULL DEFAULT NULL COMMENT '器材图片URL（base64编码）';

-- 添加equipment_function字段（如果不存在，可以安全地忽略错误）
ALTER TABLE `equipment` 
ADD COLUMN `equipment_function` TEXT NULL DEFAULT NULL COMMENT '器材功能说明' AFTER `equipment_image`;
