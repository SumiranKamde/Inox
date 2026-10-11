# 🚀 INOX Factory Shift System — Deployment Guide

This guide covers all deployment options for the **INOX Air Products Bhandara Plant Monthly Shift Scheduling System**.

---

## 📋 Architecture Overview

The system consists of:
- **Frontend**: React + Vite + Tailwind CSS (SPA)
- **Backend**: Node.js + Express REST API (also serves the built frontend on a single port)
- **Database**: MongoDB (local or Atlas)

In production, the backend server automatically serves the built frontend (`frontend/dist`) on **Port 5000**. You only need to run one web server!

---

## 🏭 Option 1: On-Premise Factory Server / Local PC (Recommended)

Run on any Windows computer at the factory. Anyone connected to the factory Wi-Fi or LAN network can open and use the system without needing an internet connection.

### Quick Start
1. Double-click **`start-production.bat`** in the project root.
2. The script will:
   - Start local MongoDB.
   - Verify frontend production build.
   - Start the unified server on port `5000`.
   - Automatically display the computer's LAN IP address.

### Accessing the System:
- **On this computer**: `http://localhost:5000`
- **From other PCs / Tablets / Phones on factory Wi-Fi**: `http://<COMPUTER-IP>:5000` (e.g. `http://192.168.1.15:5000`)
- **Default Login**: `admin@inox.com` / `admin123`

### Allow Port 5000 in Windows Firewall (One-time setup for LAN access)
If other devices cannot connect, run this one line in PowerShell as Administrator:
```powershell
New-NetFirewallRule -DisplayName "Inox Shift System (Port 5000)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Auto-start on Windows Boot
1. Press `Win + R`, type `shell:startup`, and press Enter.
2. Right-click `start-production.bat` → **Create Shortcut**.
3. Drag the shortcut into the Startup folder.
4. The system will now launch automatically whenever the PC is turned on.

---

## 🐳 Option 2: Docker Container (Docker Compose)

Deploy anywhere using Docker (Linux, Windows Server, cloud VPS, etc.).

### Prerequisites
- Docker and Docker Compose installed.

### Steps
1. In the project root, run:
```bash
docker compose up -d --build
```
2. Check running containers:
```bash
docker compose ps
```
3. Open browser:
`http://localhost:5000`

Data is persisted automatically in the `mongodb_data` Docker volume.

---

## ☁️ Option 3: Free Cloud Deployment (Render / Railway)

Deploy to the cloud so supervisors can access the system from anywhere over the internet.

### Step 1: Set up Free MongoDB Atlas
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free M0 cluster.
3. In Database Access, create a user & password.
4. In Network Access, allow access from `0.0.0.0/0` (Anywhere).
5. Copy your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/inox_factory_db?retryWrites=true&w=majority`.

### Step 2: Deploy to Render.com
1. Push this repository to GitHub or GitLab.
2. Go to [Render.com](https://render.com) and create a **New Web Service**.
3. Connect your repository.
4. Set the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm --prefix backend install && npm --prefix frontend install && npm --prefix frontend run build`
   - **Start Command**: `node backend/src/server.js`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<Any secure random string>`
   - `ADMIN_EMAIL`: `admin@inox.com`
   - `ADMIN_PASSWORD`: `admin123`
6. Click **Deploy Web Service**.
7. Render gives you a live public URL (e.g. `https://inox-shift-system.onrender.com`).

---

## 🔒 Security Best Practices for Production

1. **Change Default Admin Password**:
   - Change `ADMIN_PASSWORD` in your production environment variables / `.env`.
2. **Back up Database**:
   - For local MongoDB: Backup the `data/db` folder regularly.
   - Command: `mongodump --db inox_factory_db --out ./backups`
