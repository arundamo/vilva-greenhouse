# 🚀 Render.com - Quick Deploy Checklist

## Before You Start
- [ ] Code committed to Git
- [ ] Code pushed to GitHub
- [ ] GitHub account connected

## Step 1: Backend (5 minutes)
1. Go to https://render.com
2. New + → Web Service
3. Connect your GitHub repo
4. Settings:
   - Name: `vilva-greenhouse-api`
   - Build: `npm install`
   - Start: `node server/index.js`
   - Add Disk: `/app/server` (1GB)
5. Deploy!
6. Copy your API URL

## Step 2: Frontend (3 minutes)
1. New + → Static Site
2. Connect same repo
3. Settings:
   - Root: `client`
   - Build: `npm install && npm run build`
   - Publish: `dist`
   - Env: `VITE_API_URL` = (your API URL from step 1)
4. Deploy!

## Step 3: Connect Them
1. Go to Backend service
2. Add environment variable:
   - `CLIENT_ORIGIN` = (your frontend URL)
3. Save (auto redeploys)

## Done! 🎉
Test at your frontend URL

## Need Help?
See full guide: RENDER-DEPLOYMENT.md
