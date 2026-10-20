# JWT 与密码存储说明

## 当前状态

系统**已启用 JWT 鉴权**，基于 `jsonwebtoken`；密码使用 `bcryptjs` 哈希存储。

> 本文档早前版本声称"当前没有使用 JWT"，该描述已失效。

## 鉴权流程

1. `POST /api/login/admin` 或 `POST /api/login/user` 校验账号密码。
2. 校验通过后返回 `token`，有效期默认 8 小时（可用 `JWT_EXPIRES_IN` 调整）。
3. 前端把 token 存入 `sessionStorage`，axios 请求拦截器自动附带：
   ```
   Authorization: Bearer <token>
   ```
4. 所有业务接口经 `middleware/auth.js` 的 `authenticate` 校验；缺失、过期或伪造的 token 返回 `401`。
5. 前端遇到 `401` 会清空会话，由路由守卫跳回登录页。

## 权限模型

| 中间件 | 作用 | 失败状态 |
|---|---|---|
| `authenticate` | 校验 Bearer token，挂载 `req.user` | 401 |
| `requireRole('admin')` | 仅管理员可访问 | 403 |
| `requireRole('admin', 'member')` | 管理员与会员均可读 | 403 |
| `requireSelf([...字段])` | 账号必须与 token 持有者一致，且角色为 `member` | 403 |

登录接口本身是公开的；其余全部业务路由均已挂载鉴权。

## 配置 JWT_SECRET

在生产环境**必须**设置 `JWT_SECRET`，否则服务拒绝启动：

```env
JWT_SECRET=至少16个字符的随机字符串
```

生成方式：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

开发环境若未设置，服务会生成一个**进程内随机密钥**并打印警告——重启后旧 token 全部失效，这属于安全方向的失败方式，但仍不建议依赖。

## 密码存储

- 新密码一律经 `bcryptjs` 哈希后写入（默认 cost 10，可用 `BCRYPT_ROUNDS` 调整）。
- **兼容旧数据**：数据库中既有的明文密码仍可登录，登录成功后会**自动原地升级为 bcrypt 哈希**。密码错误的请求不会改写任何数据。
- 登录响应与所有查询接口都不会返回密码或哈希值。

### 一次性迁移（可选）

只想在登录时被动升级也可以接受；若希望立刻清理存量明文，可执行：

```sql
-- 仅用于盘点：列出仍是明文的记录
SELECT member_account FROM member WHERE member_password NOT LIKE '$2%';
SELECT admin_account  FROM admin  WHERE admin_password  NOT LIKE '$2%';
```

脚本化迁移需逐个用 `bcrypt.hash` 重写，不要用 SQL 直接替换（SQL 无法生成 bcrypt 哈希）。

## 前端存储位置

| 键 | 内容 |
|---|---|
| `authToken` | JWT |
| `adminAccount` / `adminStats` | 管理员账号与首页统计 |
| `member` | 会员档案 JSON |

均存于 `sessionStorage`，关闭标签页即失效。路由守卫要求 **token 与对应档案同时存在**。

> 注意：浏览器端只能做体验层的跳转控制，真正的权限判断全部在后端完成。

## 切换密钥的影响

更换 `JWT_SECRET` 会让所有已签发的 token 立即失效，用户需要重新登录。这是预期行为，可用于强制下线。
