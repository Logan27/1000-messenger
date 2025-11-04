# Quick Start Guide - Windows PowerShell

## Step 1: Open PowerShell

1. Press `Windows Key + X`
2. Click **"Windows PowerShell"** or **"Terminal"**
3. Navigate to your project:

```powershell
cd C:\Users\anton\Documents\1000-messenger
```

## Step 2: Enable Script Execution (First Time Only)

If you get an execution policy error:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Type **Y** and press Enter.

## Step 3: Preview Changes (Dry Run)

**RECOMMENDED:** Always run this first to see what will be merged:

```powershell
.\scripts\auto-merge-all.ps1 -DryRun
```

This will show you:
- How many branches will be merged
- List of all branch names
- No actual changes are made

## Step 4: Run the Auto-Merge

After reviewing the dry run, execute the merge:

```powershell
.\scripts\auto-merge-all.ps1
```

The script will:
- ✅ Switch to main branch
- ✅ Create backup branch
- ✅ Merge all 67 feature branches
- ✅ Auto-resolve conflicts (accept newer version)
- ✅ Push to GitHub
- ✅ Return to your original branch

## Alternative Options

### Merge Without Pushing

To merge locally first (and push manually later):

```powershell
.\scripts\auto-merge-all.ps1 -NoPush
```

Then push when ready:
```powershell
git push origin main
```

### Get Help

```powershell
.\scripts\auto-merge-all.ps1 -Help
```

## What Happens?

```
[INFO] Found 67 feature branches to process:
  1. feat-t026-jwt-utils
  2. feat-t027-password-utils-bcrypt
  3. feat-t028-implement-logger-util-winston
  ... (64 more branches)

--- Processing branch: feat-t026-jwt-utils ---
[INFO] Fetching origin/feat-t026-jwt-utils...
[SUCCESS] ✓ Successfully merged feat-t026-jwt-utils

=== Merge Summary ===
Merged successfully: 67
  (with conflicts resolved): 12
Failed to merge: 0
Skipped (already merged): 0
Total processed: 67

[SUCCESS] Successfully pushed to origin/main
[INFO] Full log saved to: merge-log-20251104-161530.txt
=== Auto-Merge Complete ===
```

## Safety Features

- **Backup Created**: `backup-main-YYYYMMDD-HHMMSS` (auto-deleted on success)
- **Uncommitted Changes Check**: Won't run if you have uncommitted work
- **Conflict Resolution**: Automatically accepts newer version from feature branches
- **Full Logging**: Every action logged to `merge-log-*.txt`
- **Error Recovery**: Returns to original branch on failure

## Troubleshooting

### "Cannot be loaded because running scripts is disabled"

Run this command:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "You have uncommitted changes"

Save your work first:
```powershell
git add .
git commit -m "WIP: saving work"
```

Or stash changes:
```powershell
git stash
```

### Need to Undo the Merge

Check the log file to find the backup branch name:
```powershell
Get-Content merge-log-*.txt | Select-String "backup"
```

Then restore:
```powershell
git reset --hard backup-main-YYYYMMDD-HHMMSS
git push --force origin main  # CAREFUL: Coordinate with team!
```

## Summary Commands

```powershell
# Navigate to project
cd C:\Users\anton\Documents\1000-messenger

# Preview
.\scripts\auto-merge-all.ps1 -DryRun

# Execute
.\scripts\auto-merge-all.ps1

# Review log
Get-Content merge-log-*.txt
```

That's it! 🎉
