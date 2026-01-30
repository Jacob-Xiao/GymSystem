# 技术栈迁移指南

本项目已从 Spring Boot + Thymeleaf 迁移至 Node.js + React.js。

## 主要变更

### 后端技术栈
- **原技术栈**: Spring Boot 2.5.3 + MyBatis + Thymeleaf
- **新技术栈**: Node.js + Express + mysql2

### 前端技术栈
- **原技术栈**: Thymeleaf 模板引擎 + Bootstrap (服务端渲染)
- **新技术栈**: React.js 18 + React Router + Bootstrap 5 (客户端渲染)

## 项目结构对比

### 后端结构
```
原结构 (Spring Boot):
src/main/java/com/milotnt/
├── controller/    →  routes/ (Express路由)
├── service/       →  services/ (业务逻辑)
├── mapper/        →  已移除 (使用原生SQL)
└── pojo/          →  数据结构保持不变

新结构 (Node.js):
backend/
├── routes/        # API路由
├── services/      # 业务逻辑层
├── config/        # 配置文件
└── server.js      # 服务器入口
```

### 前端结构
```
原结构 (Thymeleaf):
src/main/resources/templates/  # HTML模板文件

新结构 (React):
frontend/
├── src/
│   ├── pages/        # 页面组件
│   ├── components/   # 公共组件
│   └── services/     # API调用服务
└── public/           # 静态资源
```

## API 端点对比

所有原来的页面路由都已转换为 RESTful API 端点：

| 原路由 (Spring MVC) | 新路由 (REST API) | 方法 |
|---------------------|-------------------|------|
| `/adminLogin` | `/api/login/admin` | POST |
| `/userLogin` | `/api/login/user` | POST |
| `/member/selMember` | `/api/member/all` | GET |
| `/member/addMember` | `/api/member/add` | POST |
| `/member/updateMember` | `/api/member/update` | PUT |
| `/member/delMember` | `/api/member/:account` | DELETE |

## 主要功能保持不变

所有原有功能都已迁移并保持相同的业务逻辑：
- ✅ 管理员登录和主页
- ✅ 会员管理（增删改查）
- ✅ 员工管理（增删改查）
- ✅ 器材管理（增删改查）
- ✅ 课程管理（增删改查、报名信息查看）
- ✅ 会员登录和主页
- ✅ 会员个人信息管理
- ✅ 课程报名和退课

## 运行方式变更

### 原来 (Spring Boot)
```bash
mvn spring-boot:run
# 访问 http://localhost:8080
```

### 现在 (Node.js + React)
```bash
# 后端
cd backend
npm install
npm start  # 运行在 http://localhost:3001

# 前端 (新终端)
cd frontend
npm install
npm start  # 运行在 http://localhost:3000
```

## 数据库

数据库结构保持不变，仍使用相同的 MySQL 数据库和表结构。只需确保数据库连接配置正确即可。

## 注意事项

1. **会话管理**: 原项目使用 HttpSession，新项目使用 sessionStorage（前端）进行状态管理
2. **页面跳转**: 原项目使用服务端重定向，新项目使用 React Router 进行客户端路由
3. **表单提交**: 原项目使用传统的表单提交，新项目使用 Axios 进行 AJAX 请求
4. **数据绑定**: 原项目使用 Thymeleaf 模板语法，新项目使用 React 的 state 和 props

## 优势

1. **前后端分离**: 更好的架构设计，便于团队协作
2. **现代化技术栈**: 使用当前主流的前端框架
3. **更好的用户体验**: React 的单页应用提供更流畅的交互
4. **易于扩展**: RESTful API 设计便于后续功能扩展
