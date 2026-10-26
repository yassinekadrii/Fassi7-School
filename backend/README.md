# 🚀 Fassi7 Language Academy - Node.js Backend

Standard, zero-build **Node.js + Express** backend server for the Fassi7 Academy Platform.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Locally
```bash
npm start
# Server starts at http://localhost:5000
```
For development with auto-reload:
```bash
npm run dev
```

---

## ☁️ Deployment Instructions (e.g. Render, Railway, VPS)

### Deploying on Render (Web Service)
1. In Render, click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository: `https://github.com/yassinekadrii/Fassi7-School`.
3. Set the following fields:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables:
   - `PORT`: `5000` (or leave default assigned by Render)
   - `FRONTEND_URL`: `https://your-frontend-domain.com`
   - `JWT_SECRET`: `your_secure_secret_key`

---

## 📡 Key API Routes

- `GET /` & `GET /health` : Healthcheck
- `POST /api/auth/login` : Staff authentication
- `GET /api/courses` : Course catalog with search & filters
- `POST /api/courses` : Create course
- `POST /api/courses/duplicate` : 1-Click duplicate course
- `GET /api/languages` : 7 taught languages
- `GET & POST /api/enrollments` : Student registrations
- `GET & POST /api/payments` : BaridiMob / CCP payments & receipts
- `GET /api/schedule` : Timetable & Google Meet sessions
- `GET & POST /api/staff` : Super Admin staff accounts
- `GET & POST /api/inquiries` : Contact leads
