# JWT_SECRET 配置说明

## 当前状态

**重要**: 当前版本的代码**没有使用JWT（JSON Web Token）**进行身份验证。

虽然 `package.json` 中包含了 `jsonwebtoken` 依赖，但代码中并未实际使用JWT。目前的身份验证方式是通过 sessionStorage（前端）来管理登录状态。

## 如何配置

由于代码中未使用JWT，`JWT_SECRET` 环境变量**不是必需的**，但为了保持配置文件的完整性，你可以设置任意字符串值。

### 简单配置（推荐）

在 `backend/.env` 文件中，你可以设置一个简单的字符串：

```env
JWT_SECRET=my-gym-management-secret-key-2024
```

或者：

```env
JWT_SECRET=gym-system-secret-12345
```

### 安全配置（如果将来使用JWT）

如果将来代码中添加了JWT认证功能，建议使用一个随机、复杂的字符串。你可以：

1. **生成随机字符串**（使用Node.js）：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

2. **使用在线生成器**：
   - 访问 https://randomkeygen.com/
   - 选择 "CodeIgniter Encryption Keys" 或 "Symmetric Keys"

3. **手动创建**：
   使用至少32个字符的随机字符串，包含字母、数字和特殊字符。

## 示例配置

以下是一个完整的 `.env` 文件示例：

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345678
DB_NAME=gym_management_system
JWT_SECRET=gym-management-system-secret-key-2024-change-in-production
```

## 总结

- ✅ **当前**: JWT_SECRET 可以设置为任意字符串，不会被使用
- ⚠️ **建议**: 设置一个简单的字符串即可，如：`my-gym-secret-key-2024`
- 🔮 **未来**: 如果添加JWT认证，则需要使用安全、随机的密钥

## 如果将来需要添加JWT认证

如果将来要使用JWT进行身份验证，需要：

1. 在登录成功后生成JWT token
2. 客户端存储token并在请求头中发送
3. 服务器验证token
4. 此时JWT_SECRET将用于签名和验证token

但目前不需要担心这个，当前的实现已经可以正常工作。
