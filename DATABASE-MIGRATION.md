# Database Migration Guide

This guide helps you migrate your local database to production on Render.

## Overview

The migration process involves:
1. **Export** data from your local database to a JSON file
2. **Upload** the JSON file to your production server
3. **Import** the data into the production database

---

## Step 1: Export Local Data

Run this command from your project root:

```cmd
node server/export-data.js
```

**What it does:**
- Reads all data from `server/vilva-farm.db`
- Exports to `server/data-export.json`
- Shows a summary of exported records

**Output:**
- Creates `server/data-export.json` with all your local data

---

## Step 2: Upload to Render

### Option A: Via Git (Recommended)

1. **Add the export file to git:**
   ```cmd
   git add server/data-export.json
   git commit -m "Add database export for migration"
   git push
   ```

2. **Render will auto-deploy** with the new file included.

### Option B: Via Render Shell (Direct)

1. Go to your Render dashboard
2. Open **vilva-greenhouse-api** service
3. Click **Shell** tab
4. You'll manually paste the data (see Step 3B below)

---

## Step 3: Import to Production

### Option A: Via Git (After pushing data-export.json)

1. **SSH into Render shell:**
   - Go to your Render backend service
   - Click **Shell** tab
   - Wait for shell to connect

2. **Run the import script:**
   ```bash
   node server/import-data.js
   ```

3. **Verify:**
   - The script will show a summary of imported records
   - Log in to your admin panel and check if data is present

### Option B: Manual upload via Shell

If you can't push to git:

1. **Open Render Shell** for vilva-greenhouse-api

2. **Create the export file:**
   ```bash
   cat > server/data-export.json << 'EOF'
   [Paste entire contents of your local data-export.json here]
   EOF
   ```

3. **Run import:**
   ```bash
   node server/import-data.js
   ```

---

## Step 4: Verify Migration

1. **Login to admin panel:**
   - Go to https://vilva-greenhouse.onrender.com/admin
   - Login with your credentials

2. **Check each section:**
   - Dashboard → Should show your actual stats
   - Greenhouses → Should list your greenhouses and beds
   - Crops → Should show your crop varieties
   - Activities → Should have your logged activities
   - Sales → Should show your orders and customers

---

## Important Notes

### About Users Table
- The import script **preserves** the default admin user on Render
- Your local users (if any) will be imported separately
- Admin password remains `admin123` - change it after migration!

### Data Safety
- The import script **clears existing production data** before importing
- Make sure you're importing the correct export file
- Keep a backup of `data-export.json` locally

### Database File Location on Render
- Render stores the database in: `/opt/render/project/src/server/vilva-farm.db`
- This is persisted via the disk mount configured in `render.yaml`

### Troubleshooting

**"data-export.json not found"**
- Make sure you ran `export-data.js` first locally
- Verify the file exists in `server/` folder
- If using Option A, confirm the file was committed and pushed

**"Foreign key constraint failed"**
- The import script handles order correctly, but if you see this:
- Run the import script again - it will retry

**"No data showing after import"**
- Check Render logs for any import errors
- Verify `data-export.json` has actual data (not empty arrays)
- Try running the import script again

---

## Quick Reference

### Local (Windows)
```cmd
# Export data
node server\export-data.js

# (Optional) Test import locally
node server\import-data.js

# Commit and push
git add server\data-export.json
git commit -m "Database export for production"
git push
```

### Render Shell (Linux)
```bash
# Import data (after git push)
node server/import-data.js

# Or check if export file exists
ls -lh server/data-export.json
```

---

## After Migration

1. ✅ Verify all data is present in admin panel
2. ✅ Change admin password
3. ✅ Test creating a new order
4. ✅ (Optional) Remove `data-export.json` from git:
   ```cmd
   git rm server/data-export.json
   git commit -m "Remove database export after migration"
   git push
   ```

---

**Need Help?**
- Check Render logs for detailed error messages
- Ensure your disk mount is working (check Render dashboard)
- Contact support if data isn't persisting after restart
