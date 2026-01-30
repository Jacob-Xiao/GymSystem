# 测试通知API

如果遇到404错误，请按以下步骤检查：

## 1. 确认后端服务正在运行

在浏览器中访问：
```
http://localhost:3001/api/health
```

如果返回 `{"status":"OK","message":"Server is running"}` 说明后端服务正常运行。

## 2. 确认数据库表已创建

在MySQL中执行：
```sql
USE gym_management_system;
SHOW TABLES LIKE 'notification';
```

如果表不存在，执行：
```sql
source notification.sql;
```

或者在MySQL客户端中执行 `notification.sql` 文件的内容。

## 3. 重启后端服务

**重要**：添加了新路由后，必须重启后端服务！

1. 停止当前运行的后端服务（在运行后端的终端窗口按 `Ctrl + C`）
2. 重新启动后端服务：
   ```bash
   cd backend
   npm start
   ```
   或者使用开发模式（自动重启）：
   ```bash
   npm run dev
   ```

## 4. 检查后端终端输出

启动后端服务后，检查终端是否有错误信息。如果有错误，通常会显示：
- 模块加载错误
- 数据库连接错误
- 语法错误等

## 5. 测试API端点

可以使用以下方式测试API：

### 使用浏览器（GET请求）
访问：http://localhost:3001/api/notification/all

### 使用curl（POST请求）
```bash
curl -X POST http://localhost:3001/api/notification/create \
  -H "Content-Type: application/json" \
  -d '{"title":"测试通知","content":"这是一个测试","targetType":"all"}'
```

### 使用Postman
- URL: `http://localhost:3001/api/notification/create`
- Method: POST
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "title": "测试通知",
    "content": "这是一个测试",
    "targetType": "all"
  }
  ```

## 常见问题

### 问题：后端服务启动失败
**解决方案**：
- 检查 `backend/routes/notification.js` 文件是否存在
- 检查 `backend/services/notificationService.js` 文件是否存在
- 检查 `backend/services/memberBatchUpdateService.js` 文件是否存在
- 查看终端错误信息

### 问题：数据库连接错误
**解决方案**：
- 检查 `.env` 文件中的数据库配置
- 确认MySQL服务正在运行
- 确认数据库 `gym_management_system` 已创建

### 问题：表不存在错误
**解决方案**：
- 执行 `notification.sql` 脚本创建通知表
