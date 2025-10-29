# Hosting Guide for Vilva Greenhouse Management System

This guide will help you deploy your application to a public domain.

---

## 🌐 Prerequisites

- GitHub account
- Your application code in a Git repository
- A domain name (optional - many platforms provide free subdomains)

---

## Option 1: Render.com (Easiest & Free)

### Steps:

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Sign up at [Render.com](https://render.com)**

3. **Create a Web Service for Backend:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `vilva-greenhouse-api`
     - Runtime: `Node`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Add Environment Variable: `NODE_ENV=production`

4. **Create a Static Site for Frontend:**
   - Click "New +" → "Static Site"
   - Connect same repository
   - Configure:
     - Name: `vilva-greenhouse-web`
     - Build Command: `cd client && npm install && npm run build`
     - Publish Directory: `client/dist`

5. **Update API URL:**
   - Get your API URL from Render (e.g., `https://vilva-greenhouse-api.onrender.com`)
   - Update `client/vite.config.js` to proxy to production API
   - In the frontend, set `axios.defaults.baseURL` to your API URL

6. **Your app will be live at:**
   - Frontend: `https://vilva-greenhouse-web.onrender.com`
   - Backend: `https://vilva-greenhouse-api.onrender.com`

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Frontend on Vercel:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd client
   vercel
   ```
   
3. **Follow prompts:**
   - Link to project
   - Set root directory to `client`
   - Override build settings if needed

### Backend on Railway:

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create New Project:**
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository
   - Railway auto-detects Node.js

3. **Add SQLite Persistent Storage:**
   - Add a volume mount for `/app/server/vilva-farm.db`

4. **Set Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=5000`

---

## Option 3: VPS Hosting (DigitalOcean, AWS, etc.)

### For a VPS (Ubuntu server):

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Node.js & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. **Install Nginx:**
   ```bash
   sudo apt install nginx
   ```

4. **Clone your repository:**
   ```bash
   git clone https://github.com/yourusername/vilva-greenhouse.git
   cd vilva-greenhouse
   ```

5. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install && npm run build
   cd ..
   ```

6. **Start backend with PM2:**
   ```bash
   pm2 start server/index.js --name vilva-api
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/vilva-greenhouse
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Frontend
       location / {
           root /path/to/vilva-greenhouse/client/dist;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Uploads
       location /uploads {
           proxy_pass http://localhost:5000;
       }
   }
   ```

8. **Enable site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/vilva-greenhouse /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Add SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Option 4: Netlify (Frontend) + Backend elsewhere

1. **Build your frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify:**
   - Drag and drop the `client/dist` folder to [Netlify Drop](https://app.netlify.com/drop)
   - Or use Netlify CLI:
     ```bash
     npm install -g netlify-cli
     netlify deploy --prod
     ```

3. **Deploy backend separately** (Railway, Render, or VPS)

---

## 🔧 Important Configuration Changes

### 1. Update CORS Origins:

In `server/index.js`:
```javascript
app.use(cors({ 
  origin: ['https://your-frontend-domain.com'], 
  credentials: true 
}));
```

### 2. Update Client API Base URL:

Create `client/.env.production`:
```
VITE_API_URL=https://your-backend-domain.com
```

Update API calls in client to use `import.meta.env.VITE_API_URL`

### 3. Database Persistence:

- For SQLite, ensure the database file is in a persistent volume
- Consider migrating to PostgreSQL for production (Render/Railway offer free PostgreSQL)

### 4. Environment Variables:

Create `.env` file (don't commit to Git):
```
NODE_ENV=production
PORT=5000
CLIENT_ORIGIN=https://your-frontend-domain.com
```

---

## 📝 Pre-Deployment Checklist

- [ ] Change default admin password
- [ ] Set up proper CORS origins
- [ ] Configure environment variables
- [ ] Test build locally: `npm run build` in client folder
- [ ] Ensure database migrations run on startup
- [ ] Set up database backups
- [ ] Configure SSL certificates
- [ ] Test all API endpoints
- [ ] Test authentication flow
- [ ] Monitor logs for errors

---

## 💰 Cost Comparison

| Platform | Frontend | Backend | Database | Total/Month |
|----------|----------|---------|----------|-------------|
| **Render** | Free (Static) | Free (750hrs) | SQLite (Free) | $0 |
| **Vercel + Railway** | Free | $5 | Free (500MB) | $5 |
| **Netlify + Render** | Free | Free | SQLite (Free) | $0 |
| **DigitalOcean VPS** | Included | Included | Included | $6+ |

---

## 🎯 Recommended Setup

**For Production:**
- **Frontend:** Vercel or Netlify (Free, excellent performance)
- **Backend:** Railway or Render (Easy to manage)
- **Database:** Migrate to PostgreSQL for reliability
- **Domain:** Use Namecheap/Google Domains (~$12/year)

**For Development/Testing:**
- **Everything on Render:** Free tier, easy setup, single platform

---

## 🔗 Custom Domain Setup

Once deployed:

1. **Buy a domain** (e.g., `vilva-greenhouse.com`)

2. **Add DNS records:**
   - For Render/Vercel/Netlify, add CNAME record pointing to their URL
   - For VPS, add A record pointing to your server IP

3. **Configure SSL:**
   - Most platforms auto-configure SSL
   - For VPS, use Let's Encrypt (shown above)

---

## 📞 Support

If you encounter issues:
- Check platform documentation
- Review server logs
- Verify environment variables
- Test API endpoints directly
- Ensure database migrations completed

---

## 🚀 Quick Start (Render - Free)

```bash
# 1. Commit your code
git add .
git commit -m "Ready for deployment"
git push

# 2. Go to render.com and sign up

# 3. Create "Web Service" for backend
# 4. Create "Static Site" for frontend

# 5. Done! Your app is live 🎉
```

Your URLs will be:
- https://vilva-greenhouse-web.onrender.com
- https://vilva-greenhouse-api.onrender.com
