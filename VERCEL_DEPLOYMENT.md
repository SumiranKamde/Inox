# ⚡ Deploying to Vercel — Step-by-Step Guide

This project is now configured for **1-click Vercel deployment** with:
- **Frontend**: Built and served as a high-speed static Vite SPA on Vercel CDN.
- **Backend API**: Automatically adapted to **Vercel Serverless Functions** via `api/index.js` and `vercel.json`.
- **Auto-Database Seeding**: Automatically populates the 13 employees, shifts, and verified October roster on first load.

---

## ⚠️ Important Note: Cloud MongoDB Required

Because Vercel is a serverless platform, it cannot run a local MongoDB database (`C:\Program Files\MongoDB\...`). You need a **free cloud MongoDB database** from **MongoDB Atlas**.

### Step 1: Get a Free MongoDB Atlas Database (Takes 2 minutes)
1. Sign up for free at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create a Deployment** → choose the **M0 Free (Shared)** tier.
3. Under **Security Quickstart**:
   - Create a database user (e.g., Username: `inox_admin`, Password: `YourSecurePassword123`). **Save this password!**
4. Under **Network Access**:
   - Add IP Access List: Select **"Allow Access from Anywhere"** (`0.0.0.0/0`) so Vercel serverless functions can connect.
5. Click **Connect** → **Drivers (Node.js)**:
   - Copy your connection string, which looks like:
     ```text
     mongodb+srv://inox_admin:<password>@cluster0.abcde.mongodb.net/inox_factory_db?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password and ensure the database name is `/inox_factory_db`.

---

## 🚀 Step 2: Deploy to Vercel

### Method A: Deploy via GitHub (Recommended)

1. **Initialize Git and commit code** (in your terminal inside `e:\Inox_Emp`):
   ```bash
   git init
   git add .
   git commit -m "Inox factory shift scheduling system"
   ```
2. **Push to a new GitHub repository**:
   ```bash
   git remote add origin https://github.com/<your-username>/inox-shift-system.git
   git branch -M main
   git push -u origin main
   ```
3. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository.
   - In the **Configure Project** screen:
     - Framework Preset: **Other** (or Vite)
     - Root Directory: `./` (leave default)
   - Expand **Environment Variables** and add:
     | Name | Value |
     |---|---|
     | `MONGODB_URI` | `mongodb+srv://inox_admin:...@cluster0.../inox_factory_db?...` |
     | `JWT_SECRET` | `inox_secret_jwt_key_2026_super_secure` |
     | `NODE_ENV` | `production` |
4. Click **Deploy**!

---

### Method B: Deploy directly via Vercel CLI (From Terminal)

1. Open PowerShell or Command Prompt in `e:\Inox_Emp`:
   ```bash
   npx vercel
   ```
2. Follow the interactive prompts:
   - *Set up and deploy?* → **y**
   - *Which scope?* → (Select your Vercel account)
   - *Link to existing project?* → **n**
   - *Project name?* → `inox-shift-system`
   - *In which directory is code located?* → `./`
3. Add your environment variables:
   ```bash
   npx vercel env add MONGODB_URI production
   npx vercel env add JWT_SECRET production
   ```
4. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## ✅ Step 3: Verification & Auto-Seed

Once deployed, open your live Vercel URL (e.g. `https://inox-shift-system.vercel.app`):
1. The app will automatically connect to your MongoDB Atlas cluster.
2. Because the database is new, the system will **automatically seed**:
   - Default Administrator: `admin@inox.com` / `admin123`
   - All 13 shift employees + 10 general staff
   - Shift timings (A, B, C, G)
   - Verified October 2026 schedule
3. Log in with:
   - **Email**: `admin@inox.com`
   - **Password**: `admin123`
4. The October shift chart is immediately displayed and ready to use!
