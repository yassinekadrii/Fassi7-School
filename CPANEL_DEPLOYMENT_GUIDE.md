# 🚀 cPanel One-Folder Deployment Guide for Fassi7 Academy

This project is unified into a single fullstack package (Frontend + REST API + SQLite Database) with a root `server.js` ready for **cPanel "Setup Node.js App"** (CloudLinux / Phusion Passenger).

---

## 📋 Quick Deployment Steps on cPanel

### Step 1: Upload Files to cPanel
You can either upload via **cPanel Git Version Control** or as a **ZIP file via File Manager**:

#### Option A: Via cPanel Git Version Control (Recommended)
1. In cPanel, search for **Git™ Version Control**.
2. Click **Create**.
3. Enter Clone URL: `https://github.com/yassinekadrii/Fassi7-School.git`
4. Choose Repository Path (e.g. `/home/username/fassi7-school` or `/home/username/public_html`).
5. Click **Create**.

#### Option B: Via File Manager (ZIP)
1. Zip the contents of the project.
2. In cPanel, go to **File Manager**.
3. Upload and extract into your desired directory (e.g., `fassi7` or `public_html`).
*(Note: Do NOT upload `node_modules` or `.next` — they will be built directly on cPanel).*

---

### Step 2: Configure "Setup Node.js App" in cPanel
1. In cPanel, click on **Setup Node.js App** (under the **Software** section).
2. Click **Create Application**.
3. Fill in the fields:
   - **Node.js version**: Select `18.x` or `20.x` (or newer).
   - **Application mode**: `Production`.
   - **Application root**: Path to your project folder (e.g. `fassi7-school` or `public_html`).
   - **Application URL**: Your domain or subdomain (e.g. `academy.yourdomain.com`).
   - **Application startup file**: `server.js`
4. Under **Environment variables**, click **Add Variable**:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `fassi7_production_secret_key_change_me`
   - `PORT` = `3000` (cPanel will assign its internal port automatically)
5. Click **Create** at the top right.

---

### Step 3: Install Dependencies & Build
1. In the Node.js App details page, copy the command at the top to enter your virtual environment.  
   *(Example: `source /home/username/nodevenv/fassi7-school/20/bin/activate && cd /home/username/fassi7-school`)*
2. In cPanel, open the **Terminal** tool and paste that command.
3. Run the following commands:
   ```bash
   # 1. Install all dependencies
   npm install

   # 2. Build the production Next.js assets
   npm run build
   ```
*(Alternatively, in the cPanel Node.js interface, you can click the **Run NPM Install** button).*

---

### Step 4: Restart & Launch
1. Go back to **Setup Node.js App**.
2. Click **Restart Application**.
3. Click the link next to **Application URL** or visit your domain.
4. **Done!** The entire platform (Public Website, API Routes, and SQLite Database) is now live on your cPanel server.

---

## 🔑 Default Staff Logins
Once launched, you can immediately log in:
- **Super Admin (Owner)**: `admin@fassi7.com` | `admin123`
- **Admin (Secretary)**: `nadia@fassi7.com` | `admin123`
*(Change these passwords inside `/dashboard/staff` once logged in).*
