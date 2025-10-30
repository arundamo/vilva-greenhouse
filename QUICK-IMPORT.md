# Quick Import Guide - Run This in Render Shell

## Step 1: Wait for Deploy
Wait for Render to finish deploying (check the dashboard - it should show "Live")

## Step 2: Open Shell
1. Go to https://dashboard.render.com
2. Click on **vilva-greenhouse-api** service
3. Click **Shell** tab at the top
4. Wait for shell prompt to appear

## Step 3: Run Import Command

Simply run this single command:

```bash
node server/import-data.js
```

That's it! The script will:
- ✅ Run necessary migrations automatically
- ✅ Clear old production data
- ✅ Import all your local data
- ✅ Show a summary of what was imported

## Expected Output

You should see:
```
🔧 Running database migrations...
📥 Importing data into database...
🧹 Clearing existing data...
📦 Importing data...
✓ Imported 3 rows into greenhouses
✓ Imported 60 rows into raised_beds
... (more rows)
✅ Import complete!
```

## Verify

After import completes:
1. Go to https://vilva-greenhouse.onrender.com/admin
2. Login with: admin / admin123
3. Check Dashboard → Should show your actual data
4. Check each section to verify everything is there

## If You See Errors

**"data-export.json not found"**
- The file should be there after git push + deploy
- Check: `ls -la server/data-export.json`
- If missing, wait a bit longer for deploy to finish

**"SQLITE_CONSTRAINT" errors**
- The new import script handles this automatically
- If you still see this, the migrations didn't run
- Try running manually: `node server/add-online-form-via.js`

## Need to Re-run?

You can safely run `node server/import-data.js` multiple times.
Each time it clears and re-imports all data.

---

**That's all!** Your local database will be in production after this command completes.
