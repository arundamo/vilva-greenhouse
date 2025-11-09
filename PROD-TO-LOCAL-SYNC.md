# Production to Local Database Sync Guide

## Overview
This guide explains how to sync your production database (Render.com) to your local development database.

---

## Method 1: Via Web UI Export (Recommended)

### Step 1: Export from Production

1. **Login to Production**
   - Visit your production URL: `https://your-app.onrender.com`
   - Login with admin credentials

2. **Download Export**
   - Navigate to the app and trigger export via API:
     ```bash
     # Open in browser (will prompt download):
     https://your-app.onrender.com/api/admin/export
     ```
   - Or use curl:
     ```bash
     curl -H "Authorization: Bearer YOUR_PROD_TOKEN" \
          https://your-app.onrender.com/api/admin/export \
          -o server/data-export.json
     ```

3. **Save File**
   - The export will download as `data-export-YYYY-MM-DD-HH-MM-SS.json`
   - Rename it to `data-export.json` and place in `server/` directory

### Step 2: Import to Local

1. **Backup Local Database (Optional)**
   ```bash
   copy server\vilva-farm.db server\vilva-farm.db.backup
   ```

2. **Run Import Script**
   ```bash
   cd server
   node import-data.js
   ```

3. **Verify**
   - Start your local server: `npm run dev`
   - Check that data appears correctly in UI

---

## Method 2: Direct Database Download (Render.com)

### Step 1: Download Production Database

1. **SSH into Render Instance**
   ```bash
   # Get shell access (from Render Dashboard → Shell tab)
   ```

2. **Copy Database**
   ```bash
   # On Render shell, copy database to a temporary location
   cp /opt/render/project/src/server/vilva-farm.db /tmp/vilva-farm-prod.db
   ```

3. **Download via SFTP/SCP**
   - Use Render's file transfer or download through their dashboard
   - Alternatively, use the export API method above

### Step 2: Replace Local Database

1. **Backup Local**
   ```bash
   copy server\vilva-farm.db server\vilva-farm.db.backup
   ```

2. **Replace with Production**
   ```bash
   copy vilva-farm-prod.db server\vilva-farm.db
   ```

3. **Test Locally**
   ```bash
   npm run dev
   ```

---

## Method 3: Manual Export Scripts

### Export from Production (SSH Required)

1. **Access Render Shell**
   - Go to Render Dashboard
   - Select your service
   - Click "Shell" tab

2. **Run Export**
   ```bash
   cd /opt/render/project/src
   node server/export-data.js
   ```

3. **Download JSON**
   - File will be created at `server/data-export.json`
   - Download via Render dashboard or curl

### Import to Local

```bash
# Place data-export.json in server/ directory
cd server
node import-data.js
```

---

## Quick Reference Commands

### Export from Production (API)
```bash
# Method A: Browser
# Navigate to: https://your-app.onrender.com/api/admin/export
# (Must be logged in)

# Method B: Curl with token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.onrender.com/api/admin/export \
     -o server/data-export.json
```

### Import to Local
```bash
# Windows
cd server
node import-data.js

# Verify
npm run dev
```

### Backup Local Database
```bash
# Windows
copy server\vilva-farm.db server\vilva-farm-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.db

# Or simple backup
copy server\vilva-farm.db server\vilva-farm.db.backup
```

---

## What Gets Synced

The export/import includes:
- ✅ Greenhouses
- ✅ Raised Beds
- ✅ Spinach Varieties (with prices)
- ✅ Crops
- ✅ Daily Activities
- ✅ Harvest Records
- ✅ Customers (with email)
- ✅ Sales Orders
- ✅ Order Items
- ✅ Sales-Crop Mappings
- ✅ Users (except admin - preserved locally)
- ❌ Sessions (excluded - they're temporary)
- ❌ Notification Settings (excluded - environment-specific)

---

## Important Notes

### ⚠️ Data Clearing
The import script **clears existing data** before importing. Your local data will be replaced with production data.

**Tables Cleared:**
- sales_crop_mapping
- order_items
- sales_orders
- harvest_records
- daily_activities
- crops
- raised_beds
- greenhouses
- customers
- spinach_varieties

**Tables Preserved:**
- users (admin user is kept)
- sessions (new sessions will be created on login)

### 🔒 Authentication
When using the API export method, you need a valid admin session token:

1. **Get Token from Browser:**
   - Login to production
   - Open DevTools → Application/Storage → localStorage
   - Copy the `auth_token` value

2. **Use in Curl:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
        https://your-app.onrender.com/api/admin/export \
        -o server/data-export.json
   ```

### 🔄 Schema Compatibility
The import script handles schema differences:
- Maps old `requested_via` values to valid options
- Maps old `delivery_status` values to valid options
- Skips duplicate admin users
- Handles missing columns gracefully

---

## Troubleshooting

### Export File Not Found
```
❌ data-export.json not found!
```
**Solution:** Ensure `data-export.json` is in the `server/` directory before running import.

### Foreign Key Constraint Errors
```
Error: FOREIGN KEY constraint failed
```
**Solution:** The import script handles order automatically. If errors persist:
1. Backup your database
2. Delete `vilva-farm.db`
3. Run migrations: `node server/database.js`
4. Run import again

### Permission Denied
```
Error: EACCES: permission denied
```
**Solution:** 
- On Windows: Run terminal as Administrator
- Ensure `vilva-farm.db` is not locked by another process

### Missing Migrations
```
Error: no such table: notification_settings
```
**Solution:** Run migrations after import:
```bash
cd server
node migrations/add-notifications.js
```

---

## Best Practices

### 1. Regular Backups
```bash
# Before each import
copy server\vilva-farm.db server\backups\vilva-farm-%date%.db
```

### 2. Verify Import
After importing, verify:
- Customers count matches production
- Sales orders are present
- Crop varieties and prices are correct
- User accounts exist (except admin)

### 3. Test Locally
Always test on local before deploying changes back to production.

### 4. Schedule Syncs
For development, sync weekly or before major feature work:
```bash
# Create sync script (sync-from-prod.bat)
@echo off
echo Backing up local database...
copy server\vilva-farm.db server\vilva-farm.db.backup

echo Downloading from production...
curl -H "Authorization: Bearer %PROD_TOKEN%" ^
     https://your-app.onrender.com/api/admin/export ^
     -o server/data-export.json

echo Importing to local...
cd server
node import-data.js

echo Sync complete!
pause
```

---

## Automation Script

Create `server/sync-prod-to-local.bat`:

```batch
@echo off
setlocal

:: Configuration
set PROD_URL=https://your-app.onrender.com
set EXPORT_FILE=server\data-export.json

echo ====================================
echo Production to Local DB Sync
echo ====================================
echo.

:: Step 1: Backup local database
echo [1/4] Backing up local database...
if exist server\vilva-farm.db (
    copy server\vilva-farm.db server\vilva-farm.db.backup >nul
    echo ✓ Backup created: server\vilva-farm.db.backup
) else (
    echo ⚠ No local database found (fresh install?)
)
echo.

:: Step 2: Get auth token
set /p PROD_TOKEN="Enter your production admin token: "
echo.

:: Step 3: Download export
echo [2/4] Downloading export from production...
curl -H "Authorization: Bearer %PROD_TOKEN%" ^
     %PROD_URL%/api/admin/export ^
     -o %EXPORT_FILE%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to download export
    pause
    exit /b 1
)
echo ✓ Export downloaded
echo.

:: Step 4: Import to local
echo [3/4] Importing data to local database...
cd server
node import-data.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Import failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

:: Step 5: Verify
echo [4/4] Sync complete!
echo.
echo ✅ Production data synced to local successfully
echo.
echo Next steps:
echo   1. Start local server: npm run dev
echo   2. Verify data in UI
echo   3. If issues, restore backup: copy server\vilva-farm.db.backup server\vilva-farm.db
echo.
pause
```

### Usage:
```bash
# Run the sync script
sync-prod-to-local.bat

# Enter your token when prompted
# (Get from browser: DevTools → localStorage → auth_token)
```

---

## Summary

**Recommended Workflow:**
1. Export from production via API: `/api/admin/export`
2. Download JSON file to `server/data-export.json`
3. Backup local: `copy server\vilva-farm.db server\vilva-farm.db.backup`
4. Import: `node server/import-data.js`
5. Verify: `npm run dev`

**Quick Command:**
```bash
# Full sync (after downloading export JSON)
copy server\vilva-farm.db server\vilva-farm.db.backup && cd server && node import-data.js
```

---

## Need Help?

- Export script: `server/export-data.js`
- Import script: `server/import-data.js`
- API endpoint: `/api/admin/export` (requires admin auth)
- Database location (local): `server/vilva-farm.db`
- Database location (Render): `/opt/render/project/src/server/vilva-farm.db`

**Last Updated:** November 2025
