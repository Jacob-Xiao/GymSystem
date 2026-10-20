# Gym Management System

A gym administration system built as a final-year project. Originally written with Spring
Boot and Thymeleaf, it has been migrated to a Node.js + React architecture.

The interface supports **Chinese and English**, switchable at runtime from the top
navigation bar.

## Tech stack

### Backend

- **Runtime**: Node.js + Express
- **Database**: MySQL 8.0, accessed through `mysql2`
- **Auth**: JWT bearer tokens (`jsonwebtoken`) with bcrypt password hashing (`bcryptjs`)

### Frontend

- **Framework**: React 18
- **Routing**: React Router DOM 6
- **HTTP client**: Axios
- **UI**: Bootstrap 5 with Bootstrap Icons

## Project structure

```
gym-management-system/
├── backend/                 # Node.js API
│   ├── config/              # Database pool, cache, password helpers
│   ├── middleware/          # Authentication and performance middleware
│   ├── routes/              # HTTP routes (one router per resource)
│   ├── services/            # Business logic and SQL
│   ├── test/                # node:test suites
│   ├── scripts/             # Migrations, cluster launcher, load test
│   └── server.js            # Application entry point
├── frontend/                # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/      # Layouts and shared widgets
│   │   ├── hooks/           # Route guards
│   │   ├── i18n/            # Language context and message catalog
│   │   ├── pages/           # Admin and member screens
│   │   ├── services/        # API client
│   │   ├── utils/           # Date and session helpers
│   │   ├── App.js
│   │   └── index.js
│   └── test/
├── gym_management_system.sql  # Database schema and seed data
└── README.md
```

> The legacy Spring Boot sources under `src/` and `pom.xml` are kept for reference only.
> The running system is `backend/` + `frontend/`.

## Features

### Administrator

1. Sign in with an admin account
2. Dashboard with member, employee and equipment totals
3. Member management (create, read, update, delete, search)
4. Employee management
5. Equipment management
6. Class management and per-class enrolment lists
7. Notifications: send to all members or selected members, view history, delete
8. Batch updates of purchased sessions and membership duration

### Member

1. Sign in with a member account
2. Personal dashboard with membership status
3. View and edit profile (including photo)
4. Browse and enrol in classes, withdraw from a class
5. Book equipment, cancel a booking, view booking details
6. Training plans and logs per booking
7. Share booking requests, accepted or rejected by the booking owner
8. Receive system notifications

## Database

Core tables:

- `admin` — administrator accounts
- `member` — member accounts and membership
- `employee` — staff
- `equipment` — gym equipment
- `class_table` — classes
- `class_order` — class enrolments
- `equipment_booking` — equipment bookings
- `equipment_share_request` — booking share requests
- `equipment_training_session` / `equipment_training_record` — training plans and logs
- `notification` — system notifications

See `gym_management_system.sql` for the full schema.

## Getting started

### Prerequisites

- Node.js 18+ (tested on 22)
- MySQL 8.0+
- npm

### Database setup

```sql
CREATE DATABASE gym_management_system;
```

```bash
mysql -u root -p gym_management_system < gym_management_system.sql
mysql -u root -p gym_management_system < notification.sql
```

Optional migrations add the columns and indexes the current code relies on:

```bash
cd backend
npm run migrate
```

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-database-password
DB_NAME=gym_management_system

# Required in production: at least 16 characters.
# Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=change-me-to-a-long-random-string
```

Start the server:

```bash
npm start        # production
npm run dev      # reload on change
npm test         # node:test suite
```

The API listens on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm start        # development server on http://localhost:3000
npm run build    # production bundle
npm test         # helper unit tests
```

The dev server proxies `/api` to `http://localhost:3001`.

## Authentication

- `POST /api/login/admin` and `POST /api/login/user` verify the password and return a
  signed JWT (8 hours by default, configurable with `JWT_EXPIRES_IN`).
- Every business route requires `Authorization: Bearer <token>`.
- Authorization is explicit per route: admin-only writes, shared reads for classes and
  equipment, and owner-only access for member-scoped data.
- Passwords are stored as bcrypt hashes. Rows that still hold a legacy plaintext password
  can sign in and are upgraded to a hash on that first successful login.
- Set `JWT_SECRET` in production; the server refuses to start without it.

See `JWT_SECRET说明.md` for the full configuration and migration notes (written in Chinese).

## Internationalisation

- `frontend/src/i18n/messages.js` holds the `zh` and `en` catalogs as flat key/value maps.
- `useI18n()` exposes `t(key, params)` and `setLanguage()`.
- The selected language is stored in `localStorage` and survives a reload.
- Missing keys fall back to Chinese, so partial translation is safe to ship.

To add a language, append its code to `LANGUAGES` in `frontend/src/i18n/index.js` and
add a matching catalog.

## Default accounts

| Role    | Account     | Password |
|---------|-------------|----------|
| Admin   | `1001`      | `123456` |
| Member  | `202100788` | `123456` |

Change these before deploying anywhere reachable from a network.

## License

ISC
