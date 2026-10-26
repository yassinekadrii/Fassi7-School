# ⚡ Fassi7 Language Academy - Standalone Fastify Backend

High-performance, standalone backend server built with **Fastify 4**, **TypeScript**, and **SQLite (`better-sqlite3`)**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default settings:
- `PORT=5000`
- `HOST=0.0.0.0`
- `DATABASE_PATH=../fassi7.db` (connects to the root SQLite database)
- `FRONTEND_URL=http://localhost:3000`

### 3. Run in Development Mode
```bash
npm run dev
```
The server will start at `http://localhost:5000`.

### 4. Build & Run in Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck & uptime | Public |
| `POST` | `/api/auth/login` | Staff credential login | Public |
| `POST` | `/api/auth/quick-login` | 1-Click demo account login | Public |
| `GET` | `/api/auth/me` | Fetch active user session | Authenticated |
| `POST` | `/api/auth/logout` | Clear auth cookie | Authenticated |
| `GET` | `/api/courses` | List published/archived courses with search & filters | Public / Admin |
| `POST` | `/api/courses` | Create a new course | Super Admin & Admin |
| `PUT` | `/api/courses` | Update course details | Super Admin & Admin |
| `POST` | `/api/courses/duplicate` | 1-Click duplicate course with teacher assignments | Super Admin & Admin |
| `GET` | `/api/languages` | List 7 taught languages with course counters | Public |
| `POST` | `/api/languages` | Create new language | Super Admin & Admin |
| `GET` | `/api/enrollments` | List enrollments with filters | Super Admin & Admin |
| `POST` | `/api/enrollments` | Register student application | Public |
| `PUT` | `/api/enrollments` | Update enrollment status & notes | Super Admin & Admin |
| `GET` | `/api/payments` | List official payment transactions | Super Admin & Admin |
| `POST` | `/api/payments` | Record BaridiMob/CCP payment & issue receipt | Super Admin & Admin |
| `GET` | `/api/payments/receipt/:id` | Fetch receipt details by ID | Public / Admin |
| `GET` | `/api/schedule` | Timetable of upcoming class sessions | Authenticated |
| `POST` | `/api/schedule` | Schedule a new live session | Super Admin & Admin |
| `GET` | `/api/schedule/attendance` | Fetch attendance sheet for session | Super Admin & Admin & Teacher |
| `POST` | `/api/schedule/attendance` | Save student attendance records | Super Admin & Admin & Teacher |
| `GET` | `/api/staff` | List staff accounts | Super Admin only |
| `POST` | `/api/staff` | Create Secretary/Admin account | Super Admin only |
| `PUT` | `/api/staff/:id` | Edit staff credentials/status | Super Admin only |
| `GET` | `/api/students` | List student directory | Super Admin & Admin |
| `GET` | `/api/teachers` | List public teacher directory | Public |
| `GET` | `/api/inquiries` | List contact form inquiries | Super Admin & Admin |
| `POST` | `/api/inquiries` | Submit contact form inquiry | Public |
| `GET` | `/api/reports` | Key financial KPIs and language analytics | Super Admin & Admin |

---

## 🌐 Hosting & Deployment Options

### Deploying to Render / Railway / Fly.io / VPS
1. **Set Root Directory**: Point to the `backend/` folder in your deployment dashboard.
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   - `PORT=5000` (or provided by host)
   - `FRONTEND_URL=https://your-frontend-domain.com`
   - `JWT_SECRET=your_production_secret`
   - `DATABASE_PATH=./fassi7.db` (mount a persistent volume if using cloud hosts)
