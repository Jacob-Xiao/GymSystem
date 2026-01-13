-- 修复会员照片字段类型，从 VARCHAR(500) 改为 MEDIUMTEXT 以支持 base64 图片
-- 
-- 问题说明：
-- 会员修改个人信息时，如果选择修改图片，点击保存会显示"更新失败"
-- 原因：member_photo 字段类型为 VARCHAR(500)，只能存储 500 个字符
--      但 base64 编码的图片数据通常有几千到几万字符，超出限制导致数据库错误
--
-- 解决方案：
-- 将字段类型改为 MEDIUMTEXT，可以存储最多 16MB 的数据，足够存储 base64 编码的图片
--
-- 使用方法：
-- 1. 连接到 MySQL 数据库
-- 2. 选择 gym_management_system 数据库
-- 3. 执行此 SQL 脚本

ALTER TABLE `member` 
MODIFY COLUMN `member_photo` MEDIUMTEXT NULL DEFAULT NULL COMMENT '会员照片URL（base64编码）';
