# 🎓 Fassi7 Language Academy (أكاديمية فصيح للغات)

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge)]()

> **"Learning That Fits Your Life"**  
> *Formerly Multilinguo Academy (ex Multilinguo) — Rebranded to **Fassi7 (فصيح)**: A modern, complete language academy management platform and public portal designed for Algerian and international learners.*

---

## 🌟 Overview

**Fassi7 (فصيح)** is a full-stack educational web application and management system built for language academies. It pairs a public-facing website with an administrative back-office for managing courses, student registrations, payment receipts (BaridiMob & CCP), attendance, and staff accounts.

Designed and engineered by **Kadri Yassine • Protium Agency**.

---

## ✨ Key Features

### 🌐 1. Trilingual & Bidirectional Support
- Native real-time language switching: **Arabic (العربية)**, **English (GB)**, and **French (Français)**.
- Dynamic **RTL (Right-to-Left)** layout for Arabic and **LTR** for English and French.
- Currency localized in **Algerian Dinar (DZD / د.ج)**.
- Responsive design tailored to modern mobile and desktop screens.

### 🏛️ 2. Public-Facing Web Portal
- **Homepage (`/`)**:
  - Interactive hero banner with key trust statistics (5,000+ alumni, 98% exam pass rate, 7 languages).
  - Languages taught showcase (**English, French, German, Spanish, Turkish, Italian, Mandarin Chinese**).
  - Featured course cards with real-time seat availability, level badges, and tuition in DZD.
  - Interactive CEFR Level Estimator (A1 to C2).
  - Algerian payment methods showcase (BaridiMob, CCP, CIB/Edahabia, Cash).
  - Verified student reviews and dynamic FAQ accordion.
- **Courses Catalog (`/courses`)**:
  - Real-time instant search across titles and descriptions in Arabic, French, and English.
  - Multi-parameter filtering by Language, Level (A1 to C2, IELTS, TCF), and Format (Cohort, 1-on-1, Intensive, Weekend).
  - Direct 1-click registration modal.
- **Languages Page (`/languages`)**: Complete curriculum details and international certifications (IELTS, TOEFL, TCF Canada, DELF/DALF, Goethe-Zertifikat, DELE, TOMER, HSK).
- **Faculty Directory (`/teachers`)**: Certified instructors, qualifications, biographies, and course assignments.
- **About Page (`/about`)**: The Multilinguo-to-Fassi7 transition story, educational mission, and quality standards.
- **Contact & Placement (`/contact`)**: Lead capture form saving directly into the database.

### ⚡ 3. Interactive Modals & Utilities
- **Universal Registration Modal (`EnrollmentModal`)**: 1-step course application form capturing student contact info, WhatsApp number, and preferred schedule.
- **Official Payment Receipt Generator (`ReceiptModal`)**: Generates official bilingual Algerian receipts (`REC-2026-XXXX`) with BaridiMob RIP / CCP details, official academy stamp, and 1-click browser printing/PDF export.

### 🔐 4. Two-Tier Staff Authentication & RBAC
- **Super Admin (Owner)**: Full administrative control, financial reports, course catalog management, and staff account creation.
- **Admin (Secretary / Academy Admin)**: Day-to-day operations (student applications, payments, receipts, attendance, inquiries).
- Secure password hashing with `bcrypt` and HTTP-only signed JWT session cookies.

### 📊 5. Administrative Dashboard (`/dashboard`)
- **Executive Overview**: Real-time revenue metrics, active enrollments, course occupancy rates, and pending payments.
- **Courses Management (`/dashboard/courses`)**: Full course CRUD, trilingual fields, instructor assignments, and a **1-Click Duplicate Course** feature.
- **Enrollment Pipeline (`/dashboard/enrollments`)**: Status workflow (`new` ➔ `under_review` ➔ `accepted` ➔ `awaiting_payment` ➔ `confirmed`).
- **Payments & Billing (`/dashboard/payments`)**: Record BaridiMob, CCP, cash, and bank transfers, with transaction reference logging and receipt issuance.
- **Staff Management (`/dashboard/staff`)**: Dedicated interface for the Super Admin to create and manage Secretary/Admin accounts.
- **Schedule & Attendance (`/dashboard/schedule`)**: Timetable of live classes with Google Meet integrations and student attendance sheets.
- **Lead Inbox (`/dashboard/inquiries`)**: Pipeline for prospective students reaching out via the contact form.
- **Reports & Analytics (`/dashboard/reports`)**: Revenue breakdown by language, occupancy rates, and business KPIs.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack, Server Components) |
| **Library** | React 19 |
| **Language** | TypeScript |
| **Database** | SQLite via `better-sqlite3` with auto-migrations |
| **Styling** | Scoped Vanilla CSS Tokens (No heavy Tailwind runtime) |
| **Icons** | Lucide React |
| **Security** | JWT (JSON Web Tokens), `bcryptjs`, HTTP-only cookies |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.18+ or 20+ installed
- **npm** or **yarn** / **pnpm**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yassinekadrii/Fassi7-School.git
   cd Fassi7-School
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.  
   *(The database `fassi7.db` initializes and seeds automatically on first run).*

### Production Build & cPanel Deployment

```bash
# Production build
npm run build

# Start using the unified cPanel server
npm start
```

> 📖 **cPanel Deployment Guide**: See [CPANEL_DEPLOYMENT_GUIDE.md](file:///e:/Fassi7_School/CPANEL_DEPLOYMENT_GUIDE.md) for full step-by-step instructions on setting up the app using cPanel's **Setup Node.js App** (CloudLinux / Phusion Passenger) with `server.js`.

---

## 🔑 Demo & Staff Accounts

For evaluating the administrative back-office, use these credentials (or switch instantly using the navbar quick-switch dropdown):

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin (Owner)** | `admin@fassi7.com` | `admin123` | Full control, financial analytics, staff creation |
| **Admin (Secretary)** | `nadia@fassi7.com` | `admin123` | Enrollments, payments, receipts, inquiries, schedule |

---

## 📁 Repository Structure

```
Fassi7_School/
├── public/                 # Static assets, flags, avatars, branding
├── scripts/                # Database migrations & seeding utilities
├── src/
│   ├── app/
│   │   ├── (public)/       # Home, Courses, Languages, Teachers, About, Contact
│   │   ├── api/            # 12+ REST endpoints (Auth, Courses, Payments, Staff...)
│   │   ├── auth/login/     # Secure staff login interface
│   │   ├── dashboard/      # Complete administrative management portal
│   │   ├── layout.tsx      # Root layout with multilingual providers
│   │   └── globals.css     # Fassi7 Design System tokens & RTL styles
│   ├── components/         # Navbar, Footer, CourseCard, Modals, Logo
│   ├── context/            # LanguageContext & AuthContext
│   └── lib/                # db.ts (SQLite schema), auth.ts, translations.ts
├── .env.example            # Environment variables template
├── package.json
└── README.md
```

---

## 👨‍💻 Author & Engineering Credits

Designed, architected, and engineered by:
- **Kadri Yassine**
- **Protium Agency**

---

## 📄 License

Proprietary © 2026 Fassi7 Language Academy. All rights reserved.
