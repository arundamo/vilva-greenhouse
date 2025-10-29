# Render.com Deployment Guide - Vilva Greenhouse App

Complete step-by-step guide to deploy your application to Render.com (Free tier available!)

---

## 📋 Prerequisites

- [x] GitHub account
- [x] Your code pushed to GitHub repository
- [ ] Render.com account (we'll create this)

---

## 🚀 Step-by-Step Deployment

### **Step 1: Prepare Your Code**

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify your GitHub repository is public** (or connect Render to private repos)

---

### **Step 2: Create Render Account**

1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with **GitHub** (easiest - auto connects your repos)
4. Authorize Render to access your repositories

---

### **Step 3: Deploy Backend API**

1. **From Render Dashboard:**
   - Click **"New +"** button (top right)
   - Select **"Web Service"**

2. **Connect Repository:**
   - Find and select **"vilva-greenhouse"** repository
   - Click **"Connect"**

3. **Configure Backend Service:**
   
   | Setting | Value |
   |---------|-------|
   | **Name** | `vilva-greenhouse-api` |
   | **Region** | Select closest to your users |
   | **Branch** | `main` |
   | **Root Directory** | (leave empty) |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server/index.js` |
   | **Instance Type** | `Free` |

4. **Add Environment Variables:**
   Click **"Advanced"** and add:
   
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `CLIENT_ORIGIN` | (We'll update this after frontend deploys) |

5. **Create Web Service** (Click the button at bottom)

6. **Wait for deployment** (5-10 minutes first time)
   - You'll see build logs
   - Once deployed, you'll get a URL like: `https://vilva-greenhouse-api.onrender.com`
   - **COPY THIS URL** - you'll need it next!

---

### **Step 4: Deploy Frontend**

1. **From Render Dashboard:**
   - Click **"New +"** again
   - Select **"Static Site"**

2. **Connect Repository:**
   - Select **"vilva-greenhouse"** repository again
   - Click **"Connect"**

3. **Configure Frontend:**
   
   | Setting | Value |
   |---------|-------|
   | **Name** | `vilva-greenhouse-web` |
   | **Branch** | `main` |
   | **Root Directory** | `client` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

4. **Add Environment Variables:**
   Click **"Advanced"** → **"Environment Variables"** and add:
   
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://vilva-greenhouse-api.onrender.com` (use your actual API URL from Step 3) |

5. **Create Static Site**

6. **Wait for deployment** (3-5 minutes)
   - You'll get a URL like: `https://vilva-greenhouse-web.onrender.com`

---

### **Step 5: Update CORS Configuration**

Now that you have both URLs, update the backend to allow frontend requests:

1. **Go to your Backend service** in Render dashboard
2. **Click "Environment"** in left sidebar
3. **Update/Add:**
   
   | Key | Value |
   |-----|-------|
   | `CLIENT_ORIGIN` | `https://vilva-greenhouse-web.onrender.com` (your actual frontend URL) |

4. **Save Changes** - This will redeploy automatically

---

### **Step 6: Configure API Proxy in Frontend**

Update `client/vite.config.js` to handle production API:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

---

### **Step 7: Test Your Deployed Application**

1. **Visit your frontend URL:** `https://vilva-greenhouse-web.onrender.com`

2. **Test Public Features:**
   - ✓ Home page loads
   - ✓ Click "Order Now" → order form works
   - ✓ Submit test order

3. **Test Admin Features:**
   - ✓ Try to access `/dashboard` → should show login
   - ✓ Login with: `admin` / `admin123`
   - ✓ Access all admin pages
   - ✓ Change admin password immediately!

---

## 🔧 Common Issues & Solutions

### **Issue 1: CORS Errors**
**Error:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
- Verify `CLIENT_ORIGIN` environment variable in backend
- Make sure it matches your frontend URL exactly (no trailing slash)
- Redeploy backend after updating

### **Issue 2: API Calls Fail (404)**
**Error:** API endpoints return 404

**Solution:**
- Check `VITE_API_URL` in frontend environment variables
- Verify API URL is correct
- Check backend service logs in Render dashboard

### **Issue 3: Database Not Persisting**
**Problem:** Data resets after backend redeploys

**Solution:**
1. In Render backend service, go to **"Disks"**
2. Click **"Add Disk"**
3. Configure:
   - Name: `database`
   - Mount Path: `/app/server`
   - Size: `1 GB` (free tier)
4. Save and redeploy

### **Issue 4: Build Fails**
**Solution:**
- Check build logs in Render dashboard
- Verify `package.json` has all dependencies
- Make sure Node version is compatible

---

## 💾 Database Persistence (Important!)

By default, Render's free tier doesn't persist files. Add a persistent disk:

1. **Backend Service → Disks**
2. **Add Disk:**
   - Mount Path: `/app/server`
   - Size: 1GB (free)
3. **Save** - service will redeploy

This ensures your SQLite database survives redeployments.

---

## 🎯 Custom Domain (Optional)

1. **Buy a domain** (e.g., from Namecheap, Google Domains)

2. **For Frontend (Static Site):**
   - In Render: Settings → Custom Domains
   - Add: `www.yourdomain.com`
   - Follow DNS instructions (add CNAME record)

3. **For Backend (Web Service):**
   - In Render: Settings → Custom Domains
   - Add: `api.yourdomain.com`
   - Follow DNS instructions

4. **Update Environment Variables:**
   - Backend `CLIENT_ORIGIN`: `https://www.yourdomain.com`
   - Frontend `VITE_API_URL`: `https://api.yourdomain.com`

**Render automatically provides SSL certificates!**

---

## 📊 Monitoring & Logs

### **View Logs:**
1. Go to your service in Render
2. Click **"Logs"** tab
3. Monitor real-time application output

### **Check Service Health:**
- Visit: `https://your-api-url.onrender.com/api/health`
- Should return: `{"status":"ok","time":"..."}`

### **Free Tier Limitations:**
- ⚠️ Services sleep after 15 minutes of inactivity
- 🕐 First request after sleep takes ~30 seconds to wake up
- 💾 750 hours/month free (shared across services)
- 🔄 Consider upgrading to paid plan for always-on service

---

## ⚡ Performance Tips

1. **Keep Service Awake:**
   - Use a free uptime monitor (UptimeRobot, Better Uptime)
   - Ping your API every 10 minutes

2. **Upgrade to Paid Plan ($7/month):**
   - Service stays awake 24/7
   - Better performance
   - More resources

3. **Enable Caching:**
   - Frontend static files are automatically cached by Render

---

## 🔐 Security Checklist

Before going live:

- [ ] Change default admin password (`admin123`)
- [ ] Update `CLIENT_ORIGIN` to production URL
- [ ] Add rate limiting to API (future enhancement)
- [ ] Enable database backups (Render dashboard)
- [ ] Review API endpoints for public exposure
- [ ] Test authentication flow thoroughly

---

## 📱 Quick Access URLs

After deployment, bookmark these:

- **Frontend:** `https://vilva-greenhouse-web.onrender.com`
- **Backend:** `https://vilva-greenhouse-api.onrender.com`
- **API Health:** `https://vilva-greenhouse-api.onrender.com/api/health`
- **Admin Login:** `https://vilva-greenhouse-web.onrender.com/dashboard`
- **Public Order Form:** `https://vilva-greenhouse-web.onrender.com/order`

---

## 🆘 Need Help?

1. **Check Render Docs:** [https://render.com/docs](https://render.com/docs)
2. **View Build Logs:** Render Dashboard → Your Service → Logs
3. **Check Browser Console:** F12 → Console tab for frontend errors
4. **API Testing:** Use Postman or curl to test API directly

---

## ✅ Deployment Checklist

Copy this checklist:

```
BACKEND DEPLOYMENT:
[ ] Code pushed to GitHub
[ ] Render account created
[ ] Backend web service created
[ ] Environment variables added (NODE_ENV, PORT, CLIENT_ORIGIN)
[ ] Persistent disk added for database
[ ] Service deployed successfully
[ ] API health check returns OK

FRONTEND DEPLOYMENT:
[ ] Frontend static site created
[ ] Build command configured correctly
[ ] VITE_API_URL environment variable set
[ ] Service deployed successfully
[ ] Frontend loads in browser

TESTING:
[ ] Home page works
[ ] Order form works
[ ] Admin login works
[ ] All admin pages accessible
[ ] Data persists after redeployment
[ ] CORS working properly

POST-DEPLOYMENT:
[ ] Admin password changed
[ ] Custom domain configured (if applicable)
[ ] Monitoring set up
[ ] Database backup enabled
```

---

## 🎉 You're Live!

Your greenhouse management system is now accessible worldwide!

Share these links:
- **Public Homepage:** Your frontend URL
- **Order Form:** `your-frontend-url/order`
- **Admin Panel:** `your-frontend-url/dashboard`

---

**Need help with any step? Let me know!** 🚀
