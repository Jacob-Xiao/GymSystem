# 健身房管理系统

毕业设计项目，已从 Spring Boot + Thymeleaf 迁移至 Node.js + React.js 技术栈。

## 技术栈

### 后端
* **框架**: Node.js + Express
* **数据库**: MySQL 8.0
* **数据库驱动**: mysql2

### 前端
* **框架**: React.js 18
* **路由**: React Router DOM 6
* **HTTP客户端**: Axios
* **UI框架**: Bootstrap 5
* **图标**: Bootstrap Icons

## 项目结构

```
gym-management-system/
├── backend/              # Node.js 后端
│   ├── config/          # 配置文件
│   ├── routes/          # 路由
│   ├── services/        # 业务逻辑层
│   ├── server.js        # 服务器入口
│   └── package.json
├── frontend/            # React 前端
│   ├── public/         # 静态文件
│   ├── src/
│   │   ├── components/ # 公共组件
│   │   ├── pages/      # 页面组件
│   │   ├── services/   # API 服务
│   │   ├── App.js      # 应用主组件
│   │   └── index.js    # 入口文件
│   └── package.json
├── gym_management_system.sql  # 数据库脚本
└── README.md
```

## 功能模块

### 管理员功能
1. 管理员登录
2. 管理员主页（统计信息）
3. 会员管理（增删改查）
4. 员工管理（增删改查）
5. 器材管理（增删改查）
6. 课程管理（增删改查、查看报名信息）

### 会员功能
1. 会员登录
2. 会员主页
3. 个人信息管理（查看、修改）
4. 课程报名
5. 我的课程（查看、退课）

## 数据库设计

系统包含以下数据表：
- `admin` - 管理员表
- `member` - 会员表
- `employee` - 员工表
- `equipment` - 器材表
- `class_table` - 课程表
- `class_order` - 课程报名表

详细数据库结构请参考 `gym_management_system.sql` 文件。

## 安装与运行

### 前置要求
- Node.js (推荐 v16+)
- MySQL 8.0+
- npm 或 yarn

### 数据库配置

1. 创建数据库：
```sql
CREATE DATABASE gym_management_system;
```

2. 导入数据库脚本：
```bash
mysql -u root -p gym_management_system < gym_management_system.sql
```

### 后端配置与运行

1. 进入后端目录：
```bash
cd backend
```

2. 安装依赖：
```bash
npm install
```

3. 配置数据库连接（创建 `.env` 文件）：
```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=gym_management_system
JWT_SECRET=your-secret-key-change-in-production
```

4. 启动后端服务：
```bash
npm start
# 或开发模式（自动重启）
npm run dev
```

后端服务将运行在 `http://localhost:3001`

### 前端配置与运行

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

前端应用将运行在 `http://localhost:3000`

## API 接口

### 登录接口
- `POST /api/login/admin` - 管理员登录
- `POST /api/login/user` - 会员登录

### 会员管理接口
- `GET /api/member/all` - 获取所有会员
- `GET /api/member/:account` - 根据账号获取会员
- `POST /api/member/add` - 添加会员
- `PUT /api/member/update` - 更新会员信息
- `DELETE /api/member/:account` - 删除会员

### 员工管理接口
- `GET /api/employee/all` - 获取所有员工
- `GET /api/employee/:account` - 根据账号获取员工
- `POST /api/employee/add` - 添加员工
- `PUT /api/employee/update` - 更新员工信息
- `DELETE /api/employee/:account` - 删除员工

### 器材管理接口
- `GET /api/equipment/all` - 获取所有器材
- `GET /api/equipment/:id` - 根据ID获取器材
- `POST /api/equipment/add` - 添加器材
- `PUT /api/equipment/update` - 更新器材信息
- `DELETE /api/equipment/:id` - 删除器材

### 课程管理接口
- `GET /api/class/all` - 获取所有课程
- `GET /api/class/:id` - 根据ID获取课程
- `POST /api/class/add` - 添加课程
- `DELETE /api/class/:id` - 删除课程
- `GET /api/class/:id/orders` - 获取课程报名信息

### 会员用户接口
- `GET /api/user/info/:account` - 获取会员信息
- `PUT /api/user/info/update` - 更新会员信息
- `GET /api/user/classes/:account` - 获取会员课程
- `POST /api/user/apply` - 报名课程
- `DELETE /api/user/classes/:orderId` - 退课

## 默认账号

### 管理员账号
- 账号：1001
- 密码：123456

### 会员账号
- 账号：202100788
- 密码：123456

更多测试账号请查看数据库脚本。

## 开发说明

### 后端开发
- 使用 Express 框架构建 RESTful API
- 使用 mysql2 进行数据库操作
- 服务层负责业务逻辑，路由层负责请求处理

### 前端开发
- 使用 React Hooks 进行状态管理
- 使用 React Router 进行路由管理
- 使用 Axios 进行 HTTP 请求
- 使用 Bootstrap 5 进行 UI 设计

## 注意事项

1. 确保 MySQL 服务已启动
2. 确保数据库连接配置正确
3. 后端和前端需要同时运行
4. 前端开发服务器默认代理后端 API 请求到 `http://localhost:3001`

## 许可证

ISC License
