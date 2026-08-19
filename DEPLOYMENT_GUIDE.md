# 🚀 Full Website Cloud Deployment Guide (Hindi + English)

Yeh guide aapko aapka **Hospital Management System** 100% free cloud platform par deploy karne me step-by-step madad karegi.

---

## 🌟 Method 1: Deploy on Render.com (Recommended - 100% Free & Easiest)

### Step 1: GitHub pe code Push karein
1. Apne computer par git terminal open karein:
   ```bash
   git init
   git add .
   git commit -m "Hospital Management System Web App"
   ```
2. GitHub par ek naya repository banayein (e.g. `hospital-management-system`).
3. Push karein:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/hospital-management-system.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Render.com pe Deploy karein
1. [Render.com](https://render.com) par login ya free signup karein.
2. Dashboard par **"New +"** par click karke **"Web Service"** select karein.
3. Apni GitHub repository choose karein.
4. Settings fill karein:
   - **Name**: `hospital-management-system`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`
5. **"Deploy Web Service"** par click karein!
6. 2 minutes ke andar Render aapko ek live public URL de dega (e.g. `https://hospital-management-system.onrender.com`).

---

## 🗄️ Free Cloud MySQL Database Setup (Optional for Cloud DB)

Agar aap live cloud MySQL database connect karna chahte hain:

1. [TiDB Cloud](https://tidbcloud.com) ya [Aiven.io](https://aiven.io) par free account banayein.
2. Free Serverless MySQL cluster create karein.
3. Cluster console me jaakar `schema.sql` ka code run karein.
4. Render ke **Environment Variables** me ye add kar dein:
   - `DB_HOST` = `<your-cloud-db-host>`
   - `DB_USER` = `<your-cloud-db-user>`
   - `DB_PASSWORD` = `<your-cloud-db-password>`
   - `DB_NAME` = `HospitalDB`
   - `DB_PORT` = `4000` (ya 3306)

---

## ⚡ Method 2: Deploy on Vercel

1. [Vercel.com](https://vercel.com) par login karein.
2. **"Add New Project"** select karein.
3. GitHub repository import karein.
4. Project me already `vercel.json` added hai, so direct **"Deploy"** button dabayein!
5. 1 minute me aapka live URL live ho jayega!

---

## 💻 Local Run (Computer pe chalana)

Apne computer par test karne ke liye:
```bash
npm start
```
Browser me open karein: `http://localhost:5000`
