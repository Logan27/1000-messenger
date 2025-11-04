# Auto-Merge Scripts

This directory contains scripts for automatically merging feature branches into the main branch with automatic conflict resolution.

## Quick Start (Windows PowerShell)

```powershell
# Navigate to project directory
cd C:\Users\anton\Documents\1000-messenger

# Preview what will be merged (recommended first step)
.\scripts\auto-merge-all.ps1 -DryRun

# Merge all branches and push
.\scripts\auto-merge-all.ps1

# Merge locally without pushing
.\scripts\auto-merge-all.ps1 -NoPush
```

**Note:** If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Available Scripts

### 1a. `auto-merge-all.ps1` (PowerShell - Windows)

Native PowerShell script for Windows users.

**Features:**
- Merges all feature branches matching patterns: `feat-*`, `fix-*`, `chore-*`, `test-*`, `refactor-*`, `perf-*`, `docs-*`, `style-*`, `build-*`, `ci-*`, `t[0-9]*`, or `[0-9]+-*`
- Automatically resolves conflicts by accepting the newer version (incoming branch)
- Creates automatic backup branch before starting
- Comprehensive logging to timestamped log file
- Dry-run mode for testing
- Proper error handling and cleanup
- Detailed merge statistics
- Native Windows PowerShell (no Git Bash required)

**Usage:**
```powershell
# Basic usage - merge all branches and push
.\scripts\auto-merge-all.ps1

# Dry run - see what would be merged without making changes
.\scripts\auto-merge-all.ps1 -DryRun

# Merge locally but don't push to remote
.\scripts\auto-merge-all.ps1 -NoPush

# Get help
.\scripts\auto-merge-all.ps1 -Help
```

**Output:**
- Color-coded console output
- Timestamped log file: `merge-log-YYYYMMDD-HHMMSS.txt`
- Backup branch: `backup-main-YYYYMMDD-HHMMSS` (deleted on success)

### 1b. `auto-merge-all.sh` (Bash - Git Bash/WSL/Linux)

The most comprehensive and robust auto-merge script with full logging and error handling.

**Features:**
- Merges all feature branches matching patterns: `feat-*`, `fix-*`, `chore-*`, `test-*`, `refactor-*`, `perf-*`, `docs-*`, `style-*`, `build-*`, `ci-*`, `t[0-9]*`, or `[0-9]+-*`
- Automatically resolves conflicts by accepting the newer version (incoming branch)
- Creates automatic backup branch before starting
- Comprehensive logging to timestamped log file
- Dry-run mode for testing
- Proper error handling and cleanup
- Detailed merge statistics

**Usage:**
```bash
# Basic usage - merge all branches and push
./scripts/auto-merge-all.sh

# Dry run - see what would be merged without making changes
./scripts/auto-merge-all.sh --dry-run

# Merge locally but don't push to remote
./scripts/auto-merge-all.sh --no-push

# Combine flags
./scripts/auto-merge-all.sh --dry-run --no-push
```

**Output:**
- Color-coded console output
- Timestamped log file: `merge-log-YYYYMMDD-HHMMSS.txt`
- Backup branch: `backup-main-YYYYMMDD-HHMMSS` (deleted on success)

### 2. `auto-merge-branches.sh`

Interactive version with user prompts for confirmation.

**Usage:**
```bash
./scripts/auto-merge-branches.sh
```

**Features:**
- Prompts before deleting backup branch
- Useful for manual review of each step
- Good for learning/debugging

### 3. `auto-merge-non-interactive.sh`

Fully automated version without any user interaction.

**Usage:**
```bash
./scripts/auto-merge-non-interactive.sh
```

**Features:**
- No prompts - runs completely automatically
- Automatically deletes backup on success
- Good for CI/CD pipelines

### 4. `test-merge-single.sh`

Test script for merging a single branch.

**Usage:**
```bash
./scripts/test-merge-single.sh
```

**Features:**
- Tests merge logic on single branch (001-messenger-app)
- Interactive prompt before pushing
- Good for testing changes to merge logic

## Conflict Resolution Strategy

All scripts use the **"theirs"** strategy for conflict resolution:

- When conflicts occur, the script automatically accepts the **incoming branch version** (newer code)
- This is done using: `git checkout --theirs <file>`
- Rationale: Feature branches typically contain the latest improvements

## Safety Features

1. **Backup Branch**: Automatically creates backup before merging
2. **Uncommitted Changes Check**: Refuses to run with uncommitted changes
3. **Already Merged Detection**: Skips branches already in main
4. **Remote Validation**: Verifies branches exist on remote
5. **Cleanup on Error**: Aborts merges and returns to original branch on failure

## Workflow Example

**PowerShell (Windows):**
```powershell
# 1. First, do a dry run to see what will be merged
.\scripts\auto-merge-all.ps1 -DryRun

# 2. Review the list of branches

# 3. Run the actual merge
.\scripts\auto-merge-all.ps1

# 4. Review the log file
Get-Content merge-log-*.txt
```

**Bash (Git Bash/WSL/Linux):**
```bash
# 1. First, do a dry run to see what will be merged
./scripts/auto-merge-all.sh --dry-run

# 2. Review the list of branches

# 3. Run the actual merge
./scripts/auto-merge-all.sh

# 4. Review the log file
cat merge-log-*.txt
```

## Branch Naming Conventions

The scripts look for branches matching these patterns:

- `feat-*` or `feat/*` - New features
- `fix-*` or `fix/*` - Bug fixes
- `chore-*` or `chore/*` - Maintenance tasks
- `test-*` or `test/*` - Test additions
- `refactor-*` - Code refactoring
- `perf-*` - Performance improvements
- `docs-*` - Documentation
- `style-*` - Code style changes
- `build-*` - Build system changes
- `ci-*` - CI/CD changes
- `t[0-9]*` - Task number (e.g., t001, t042)
- `[0-9]+-*` - Issue number (e.g., 001-messenger-app)

## Troubleshooting

### PowerShell: "Execution Policy" Error
```powershell
# Allow running local scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or bypass for single execution
PowerShell -ExecutionPolicy Bypass -File .\scripts\auto-merge-all.ps1 -DryRun
```

### Script fails with "uncommitted changes"
```bash
# Stash or commit your changes
git stash
# or
git add . && git commit -m "WIP"
```

### Need to restore from backup
```bash
# List backup branches
git branch | grep backup-main

# Restore from backup
git reset --hard backup-main-YYYYMMDD-HHMMSS

# Delete backup when done
git branch -D backup-main-YYYYMMDD-HHMMSS
```

### Merge pushed but want to undo
```bash
# Reset to before the merge (use commit hash from log)
git reset --hard <commit-hash>

# Force push (DANGEROUS - coordinate with team)
git push --force origin main
```

### Script hangs or errors
```bash
# Kill the script (Ctrl+C)

# Clean up any merge state
git merge --abort

# Return to main
git checkout main

# Check status
git status
```

## Log Files

Log files are created automatically with format: `merge-log-YYYYMMDD-HHMMSS.txt`

**Log contents:**
- Timestamp for each operation
- Branch commit hashes and messages
- Conflict resolution details
- Success/failure status
- Final statistics

**Example log entry:**
```
[2025-11-04 16:12:22] [INFO] Processing branch: feat-t026-jwt-utils
[2025-11-04 16:12:23] [INFO] Branch HEAD: a1b2c3d4...
[2025-11-04 16:12:23] [INFO] Latest commit: Add JWT utilities
[2025-11-04 16:12:24] [WARNING] ⚠ Conflicts detected, resolving automatically...
[2025-11-04 16:12:24] [SUCCESS] ✓ Successfully merged feat-t026-jwt-utils with conflict resolution
```

## CI/CD Integration

To use in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Auto-merge feature branches
  run: |
    chmod +x scripts/auto-merge-all.sh
    ./scripts/auto-merge-all.sh --no-push
    # Run tests here
    git push origin main
```

```yaml
# GitLab CI example
merge-branches:
  script:
    - chmod +x scripts/auto-merge-all.sh
    - ./scripts/auto-merge-all.sh
  only:
    - schedules
```

## Best Practices

1. **Always run dry-run first** to preview changes
2. **Coordinate with team** before running during active development
3. **Review logs** after merge to ensure everything merged correctly
4. **Keep backups** until you've verified the merge
5. **Run tests** after merging to catch integration issues
6. **Consider timing** - run during low-activity periods

## Customization

To customize branch patterns, edit the regex in the script:

```bash
# In auto-merge-all.sh, find this section:
if [[ $branch =~ ^(feat|fix|chore|test|refactor|perf|docs|style|build|ci|t[0-9]+) ]] || [[ $branch =~ ^[0-9]+-.*$ ]]; then
    FILTERED_BRANCHES+=("$branch")
fi

# Add your patterns:
if [[ $branch =~ ^(feat|fix|chore|YOUR_PATTERN) ]] || [[ $branch =~ ^[0-9]+-.*$ ]]; then
    FILTERED_BRANCHES+=("$branch")
fi
```

## Support

For issues or questions:
1. Check the log files for detailed error messages
2. Run with `--dry-run` to diagnose issues
3. Review the backup branch to see state before merge
4. Check git status and recent commits
