# Auto-Merge PowerShell Script for merging all feature branches to main
# Automatically resolves conflicts by accepting the new version (theirs)
# Usage: .\auto-merge-all.ps1 [-DryRun] [-NoPush]

[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$NoPush,
    [switch]$Help
)

# Script configuration
$ErrorActionPreference = "Stop"
$Script:BackupBranch = ""
$Script:OriginalBranch = ""
$Script:LogFile = "merge-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"

# Counters
$Script:MergedCount = 0
$Script:FailedCount = 0
$Script:SkippedCount = 0
$Script:ConflictResolvedCount = 0
$Script:FailedBranches = @()

# Show help
if ($Help) {
    Write-Host @"
Auto-Merge PowerShell Script
Usage: .\auto-merge-all.ps1 [-DryRun] [-NoPush] [-Help]

Parameters:
  -DryRun   Show what would be merged without making changes
  -NoPush   Merge locally but don't push to remote
  -Help     Show this help message

Examples:
  .\auto-merge-all.ps1                # Merge and push
  .\auto-merge-all.ps1 -DryRun        # Preview only
  .\auto-merge-all.ps1 -NoPush        # Merge locally, no push
  .\auto-merge-all.ps1 -DryRun -NoPush # Preview with no push flag
"@
    exit 0
}

# Color output functions
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
    Add-Content -Path $Script:LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [INFO] $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
    Add-Content -Path $Script:LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [SUCCESS] $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    Add-Content -Path $Script:LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [WARNING] $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    Add-Content -Path $Script:LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] [ERROR] $Message"
}

function Write-Highlight {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Magenta
    Add-Content -Path $Script:LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message"
}

# Cleanup function
function Invoke-Cleanup {
    param([bool]$Success = $false)

    if (-not $Success) {
        Write-Error "Script encountered an error"

        # Check if merge is in progress
        $mergeHead = Join-Path (git rev-parse --git-dir) "MERGE_HEAD"
        if (Test-Path $mergeHead) {
            Write-Warning "Aborting merge..."
            git merge --abort 2>$null
        }

        # Return to original branch
        if ($Script:OriginalBranch -and $Script:OriginalBranch -ne "main") {
            Write-Status "Returning to original branch: $Script:OriginalBranch"
            git checkout $Script:OriginalBranch 2>$null
        }

        if ($Script:BackupBranch) {
            Write-Warning "Backup branch '$Script:BackupBranch' is available if you need to restore"
            Write-Status "To restore: git reset --hard $Script:BackupBranch"
        }
    }
}

# Check if in git repository
function Test-GitRepository {
    try {
        git rev-parse --git-dir | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check for uncommitted changes
function Test-UncommittedChanges {
    $status = git status --porcelain
    return ($status.Length -gt 0)
}

# Check if branch is already merged
function Test-BranchMerged {
    param([string]$Branch)

    try {
        git merge-base --is-ancestor "origin/$Branch" HEAD 2>$null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Check if branch exists remotely
function Test-RemoteBranch {
    param([string]$Branch)

    try {
        git ls-remote --exit-code --heads origin $Branch 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

# Get list of conflicted files
function Get-ConflictedFiles {
    $unmerged = git ls-files --unmerged
    if ($unmerged) {
        $files = git diff --name-only --diff-filter=U
        return $files
    }
    return @()
}

# Merge a single branch
function Merge-Branch {
    param([string]$Branch)

    Write-Highlight "--- Processing branch: $Branch ---"

    # Check if branch exists remotely
    if (-not (Test-RemoteBranch -Branch $Branch)) {
        Write-Warning "Branch $Branch does not exist remotely, skipping..."
        $Script:SkippedCount++
        return 2
    }

    # Check if already merged
    if (Test-BranchMerged -Branch $Branch) {
        Write-Warning "Branch $Branch is already merged into main, skipping..."
        $Script:SkippedCount++
        return 2
    }

    # Fetch the latest changes
    Write-Status "Fetching origin/$Branch..."
    $ErrorActionPreference = "Continue"
    git fetch origin $Branch 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    # Get commit info
    $branchCommit = git rev-parse "origin/$Branch"
    $branchMessage = git log -1 --pretty=format:"%s" "origin/$Branch"
    Write-Status "Branch HEAD: $branchCommit"
    Write-Status "Latest commit: $branchMessage"

    # Attempt merge
    Write-Status "Attempting merge..."
    $commitMessage = @"
Auto-merge: $Branch

Merged from origin/$Branch
Commit: $branchCommit
Message: $branchMessage
"@

    git merge --no-ff "origin/$Branch" -m $commitMessage 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Success "[OK] Successfully merged $Branch (no conflicts)"
        $Script:MergedCount++
        return 0
    }

    # Check for conflicts
    $conflictedFiles = Get-ConflictedFiles

    if ($conflictedFiles.Count -gt 0) {
        Write-Warning "[!] Conflicts detected, resolving automatically..."
        Write-Status "Resolving $($conflictedFiles.Count) conflicted file(s)..."

        # List conflicted files
        foreach ($file in $conflictedFiles) {
            Write-Status "  - $file"
        }

        # Resolve conflicts by accepting theirs
        foreach ($file in $conflictedFiles) {
            Write-Status "Accepting new version of: $file"
            git checkout --theirs $file 2>&1 | Out-Null
            git add $file 2>&1 | Out-Null
        }

        # Verify all conflicts resolved
        $remainingConflicts = Get-ConflictedFiles
        if ($remainingConflicts.Count -gt 0) {
            Write-Error "Failed to resolve all conflicts for $Branch"
            git merge --abort 2>&1 | Out-Null
            $Script:FailedCount++
            $Script:FailedBranches += "$Branch (unresolved conflicts)"
            return 1
        }

        # Commit the merge
        $resolvedCommitMessage = @"
Auto-merge: $Branch (conflicts auto-resolved)

Merged from origin/$Branch with automatic conflict resolution.
Conflicts resolved by accepting incoming changes (theirs strategy).
Number of conflicted files: $($conflictedFiles.Count)

Commit: $branchCommit
Message: $branchMessage
"@

        git commit --no-edit -m $resolvedCommitMessage 2>&1 | Out-Null

        if ($LASTEXITCODE -eq 0) {
            Write-Success "[OK] Successfully merged $Branch with conflict resolution"
            $Script:MergedCount++
            $Script:ConflictResolvedCount++
            return 0
        } else {
            Write-Error "Failed to commit merge for $Branch"
            git merge --abort 2>&1 | Out-Null
            $Script:FailedCount++
            $Script:FailedBranches += "$Branch (commit failed)"
            return 1
        }
    } else {
        Write-Error "Merge failed for $Branch (unknown reason)"
        git merge --abort 2>&1 | Out-Null
        $Script:FailedCount++
        $Script:FailedBranches += "$Branch (merge failed)"
        return 1
    }
}

# Main script execution
try {
    Write-Highlight "=== Auto-Merge Script Starting ==="
    Write-Status "Log file: $Script:LogFile"

    if ($DryRun) {
        Write-Warning "DRY RUN MODE - No changes will be made"
    }

    # Check if in git repository
    if (-not (Test-GitRepository)) {
        Write-Error "Not in a git repository"
        exit 1
    }

    # Check for uncommitted changes
    if (Test-UncommittedChanges) {
        Write-Error "You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    }

    # Get current branch
    $Script:OriginalBranch = git branch --show-current
    Write-Status "Current branch: $Script:OriginalBranch"

    # Switch to main
    Write-Status "Switching to main branch..."
    $ErrorActionPreference = "Continue"
    git checkout main 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    # Pull latest changes
    Write-Status "Pulling latest changes from origin/main..."
    $ErrorActionPreference = "Continue"
    git pull origin main 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    # Fetch all remote branches
    Write-Status "Fetching all remote branches..."
    $ErrorActionPreference = "Continue"
    git fetch --all --prune 2>&1 | Out-Null
    $ErrorActionPreference = "Stop"

    # Get all remote branches
    $remoteBranches = git branch -r | Where-Object {
        $_ -notmatch 'origin/main$' -and $_ -notmatch 'origin/HEAD'
    } | ForEach-Object {
        $_.Trim() -replace '^origin/', ''
    } | Sort-Object -Unique

    # Filter for feature branches
    $featureBranches = $remoteBranches | Where-Object {
        $_ -match '^(feat|fix|chore|test|refactor|perf|docs|style|build|ci|t\d+)' -or
        $_ -match '^\d+-'
    }

    if ($featureBranches.Count -eq 0) {
        Write-Warning "No feature branches found to merge"
        exit 0
    }

    Write-Status "Found $($featureBranches.Count) feature branches to process:"
    $featureBranches | ForEach-Object { $i = 1 } { Write-Host "  $i. $_"; $i++ }

    # Exit if dry run
    if ($DryRun) {
        Write-Highlight "=== Dry Run Complete ==="
        exit 0
    }

    # Create backup branch
    $Script:BackupBranch = "backup-main-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Status "Creating backup branch: $Script:BackupBranch"
    git branch $Script:BackupBranch 2>&1 | Out-Null

    # Process each branch
    Write-Highlight "=== Starting Merge Process ==="
    foreach ($branch in $featureBranches) {
        Merge-Branch -Branch $branch
        Write-Host ""
    }

    # Print summary
    Write-Highlight "=== Merge Summary ==="
    Write-Host "Merged successfully: " -NoNewline
    Write-Host $Script:MergedCount -ForegroundColor Green
    Write-Host "  (with conflicts resolved): " -NoNewline
    Write-Host $Script:ConflictResolvedCount -ForegroundColor Yellow
    Write-Host "Failed to merge: " -NoNewline
    Write-Host $Script:FailedCount -ForegroundColor Red
    Write-Host "Skipped (already merged): " -NoNewline
    Write-Host $Script:SkippedCount -ForegroundColor Cyan
    Write-Host "Total processed: " -NoNewline
    Write-Host $featureBranches.Count -ForegroundColor Cyan

    if ($Script:FailedBranches.Count -gt 0) {
        Write-Error "Failed branches:"
        foreach ($failed in $Script:FailedBranches) {
            Write-Host "  - $failed" -ForegroundColor Red
        }
    }

    # Push changes
    if (-not $NoPush -and $Script:MergedCount -gt 0) {
        Write-Status "Pushing changes to origin/main..."
        $ErrorActionPreference = "Continue"
        git push origin main 2>&1 | Out-Null
        $pushExitCode = $LASTEXITCODE
        $ErrorActionPreference = "Stop"

        if ($pushExitCode -eq 0) {
            Write-Success "Successfully pushed to origin/main"
        } else {
            Write-Error "Failed to push to origin/main"
            Write-Warning "Local changes are preserved. You can manually push or restore from backup."
            Invoke-Cleanup -Success $false
            exit 1
        }
    } else {
        if ($Script:MergedCount -gt 0) {
            Write-Warning "Changes not pushed (-NoPush flag). Run 'git push origin main' to push."
        }
    }

    # Clean up backup
    if ($Script:FailedCount -eq 0 -and $Script:MergedCount -gt 0) {
        Write-Status "All merges successful. Cleaning up backup branch..."
        git branch -D $Script:BackupBranch 2>&1 | Out-Null
        Write-Success "Backup branch deleted"
        $Script:BackupBranch = ""
    } else {
        if ($Script:BackupBranch) {
            Write-Warning "Backup branch '$Script:BackupBranch' retained for safety"
            Write-Status "To restore: git reset --hard $Script:BackupBranch"
        }
    }

    # Return to original branch
    if ($Script:OriginalBranch -ne "main") {
        Write-Status "Returning to original branch: $Script:OriginalBranch"
        git checkout $Script:OriginalBranch 2>&1 | Out-Null
    }

    Write-Highlight "=== Auto-Merge Complete ==="
    Write-Status "Full log saved to: $Script:LogFile"

    # Exit with appropriate code
    if ($Script:FailedCount -gt 0) {
        Invoke-Cleanup -Success $false
        exit 1
    } else {
        Invoke-Cleanup -Success $true
        exit 0
    }

} catch {
    Write-Error "Unexpected error: $_"
    Write-Error $_.ScriptStackTrace
    Invoke-Cleanup -Success $false
    exit 1
}
