#!/bin/bash

# Comprehensive auto-merge script for merging all feature branches to main
# Automatically resolves conflicts by accepting the new version (theirs)
# Usage: ./auto-merge-all.sh [--dry-run] [--no-push]

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
NO_PUSH=false
BACKUP_BRANCH=""
ORIGINAL_BRANCH=""
LOG_FILE="merge-log-$(date +%Y%m%d-%H%M%S).txt"

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-push)
            NO_PUSH=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--no-push]"
            echo "  --dry-run  : Show what would be merged without making changes"
            echo "  --no-push  : Merge locally but don't push to remote"
            exit 0
            ;;
        *)
            ;;
    esac
done

# Function to print colored output
print_status() {
    local msg="[INFO] $1"
    echo -e "${BLUE}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

print_success() {
    local msg="[SUCCESS] $1"
    echo -e "${GREEN}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

print_warning() {
    local msg="[WARNING] $1"
    echo -e "${YELLOW}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

print_error() {
    local msg="[ERROR] $1"
    echo -e "${RED}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

print_highlight() {
    local msg="$1"
    echo -e "${MAGENTA}${msg}${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

# Cleanup function to restore state on error
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        print_error "Script failed with exit code $exit_code"

        # Abort any ongoing merge
        if git merge HEAD &>/dev/null; then
            : # No merge in progress
        else
            print_warning "Aborting merge..."
            git merge --abort 2>/dev/null || true
        fi

        # Return to original branch if possible
        if [ -n "$ORIGINAL_BRANCH" ] && [ "$ORIGINAL_BRANCH" != "main" ]; then
            print_status "Returning to original branch: $ORIGINAL_BRANCH"
            git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
        fi

        if [ -n "$BACKUP_BRANCH" ]; then
            print_warning "Backup branch '$BACKUP_BRANCH' is available if you need to restore"
        fi
    fi
}

trap cleanup EXIT

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

print_highlight "=== Auto-Merge Script Starting ==="
print_status "Log file: $LOG_FILE"
if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No changes will be made"
fi

# Get current branch
ORIGINAL_BRANCH=$(git branch --show-current)
print_status "Current branch: $ORIGINAL_BRANCH"

# Switch to main branch
print_status "Switching to main branch..."
git checkout main

# Pull latest changes
print_status "Pulling latest changes from origin/main..."
git pull origin main

# Fetch all remote branches
print_status "Fetching all remote branches..."
git fetch --all --prune

# Get all remote branches excluding main and HEAD
ALL_REMOTE_BRANCHES=$(git branch -r | grep -v 'origin/main$' | grep -v 'origin/HEAD' | sed 's/^[[:space:]]*origin\///' | sort -u)

# Filter for feature branches
FILTERED_BRANCHES=()
while IFS= read -r branch; do
    # Skip empty lines
    [ -z "$branch" ] && continue

    # Include branches that match feature patterns
    if [[ $branch =~ ^(feat|fix|chore|test|refactor|perf|docs|style|build|ci|t[0-9]+) ]] || [[ $branch =~ ^[0-9]+-.*$ ]]; then
        FILTERED_BRANCHES+=("$branch")
    fi
done <<< "$ALL_REMOTE_BRANCHES"

if [ ${#FILTERED_BRANCHES[@]} -eq 0 ]; then
    print_warning "No feature branches found to merge"
    exit 0
fi

print_status "Found ${#FILTERED_BRANCHES[@]} feature branches to process:"
printf '%s\n' "${FILTERED_BRANCHES[@]}" | nl

# Exit if dry run
if [ "$DRY_RUN" = true ]; then
    print_highlight "=== Dry Run Complete ==="
    exit 0
fi

# Counters
MERGED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0
CONFLICT_RESOLVED_COUNT=0
declare -a FAILED_BRANCHES=()

# Create a backup branch before starting
BACKUP_BRANCH="backup-main-$(date +%Y%m%d-%H%M%S)"
print_status "Creating backup branch: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# Function to check if branch is already merged
is_branch_merged() {
    local branch=$1
    git merge-base --is-ancestor "origin/$branch" HEAD 2>/dev/null
}

# Function to merge a branch with conflict resolution
merge_branch() {
    local branch=$1
    print_highlight "--- Processing branch: $branch ---"

    # Check if branch exists remotely
    if ! git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
        print_warning "Branch $branch does not exist remotely, skipping..."
        ((SKIPPED_COUNT++))
        return 2
    fi

    # Check if branch is already merged
    if is_branch_merged "$branch"; then
        print_warning "Branch $branch is already merged into main, skipping..."
        ((SKIPPED_COUNT++))
        return 2
    fi

    # Fetch the latest changes for the branch
    print_status "Fetching origin/$branch..."
    git fetch origin "$branch"

    # Get commit info for logging
    local branch_commit=$(git rev-parse "origin/$branch")
    local branch_message=$(git log -1 --pretty=format:"%s" "origin/$branch")
    print_status "Branch HEAD: $branch_commit"
    print_status "Latest commit: $branch_message"

    # Attempt to merge
    print_status "Attempting merge..."
    if git merge --no-ff "origin/$branch" -m "Auto-merge: $branch

Merged from origin/$branch
Commit: $branch_commit
Message: $branch_message"; then
        print_success "✓ Successfully merged $branch (no conflicts)"
        ((MERGED_COUNT++))
        return 0
    else
        # Check if there are conflicts
        if git ls-files --unmerged | grep -q .; then
            print_warning "⚠ Conflicts detected, resolving automatically..."

            local conflicted_files=$(git diff --name-only --diff-filter=U)
            local conflict_count=$(echo "$conflicted_files" | wc -l)
            print_status "Resolving $conflict_count conflicted file(s)..."

            # List all conflicted files
            echo "$conflicted_files" | while IFS= read -r file; do
                print_status "  - $file"
            done

            # Resolve conflicts by accepting the new version (theirs)
            while IFS= read -r file; do
                if [ -n "$file" ]; then
                    print_status "Accepting new version of: $file"
                    git checkout --theirs "$file"
                    git add "$file"
                fi
            done <<< "$conflicted_files"

            # Verify all conflicts are resolved
            if git ls-files --unmerged | grep -q .; then
                print_error "Failed to resolve all conflicts for $branch"
                git merge --abort
                ((FAILED_COUNT++))
                FAILED_BRANCHES+=("$branch (unresolved conflicts)")
                return 1
            fi

            # Commit the merge with conflict resolution note
            if git commit --no-edit -m "Auto-merge: $branch (conflicts auto-resolved)

Merged from origin/$branch with automatic conflict resolution.
Conflicts resolved by accepting incoming changes (theirs strategy).
Number of conflicted files: $conflict_count

Commit: $branch_commit
Message: $branch_message"; then
                print_success "✓ Successfully merged $branch with conflict resolution"
                ((MERGED_COUNT++))
                ((CONFLICT_RESOLVED_COUNT++))
                return 0
            else
                print_error "Failed to commit merge for $branch"
                git merge --abort 2>/dev/null || true
                ((FAILED_COUNT++))
                FAILED_BRANCHES+=("$branch (commit failed)")
                return 1
            fi
        else
            print_error "Merge failed for $branch (unknown reason)"
            git merge --abort 2>/dev/null || true
            ((FAILED_COUNT++))
            FAILED_BRANCHES+=("$branch (merge failed)")
            return 1
        fi
    fi
}

# Process each branch
print_highlight "=== Starting Merge Process ==="
for branch in "${FILTERED_BRANCHES[@]}"; do
    merge_branch "$branch"
    echo ""
done

# Print summary
print_highlight "=== Merge Summary ==="
echo -e "${GREEN}Merged successfully:${NC} $MERGED_COUNT"
echo -e "${YELLOW}  (with conflicts resolved):${NC} $CONFLICT_RESOLVED_COUNT"
echo -e "${RED}Failed to merge:${NC} $FAILED_COUNT"
echo -e "${BLUE}Skipped (already merged):${NC} $SKIPPED_COUNT"
echo -e "${BLUE}Total processed:${NC} ${#FILTERED_BRANCHES[@]}"

if [ ${#FAILED_BRANCHES[@]} -gt 0 ]; then
    print_error "Failed branches:"
    printf '  - %s\n' "${FAILED_BRANCHES[@]}"
fi

# Push changes to remote if requested
if [ "$NO_PUSH" = false ] && [ $MERGED_COUNT -gt 0 ]; then
    print_status "Pushing changes to origin/main..."
    if git push origin main; then
        print_success "Successfully pushed to origin/main"
    else
        print_error "Failed to push to origin/main"
        print_warning "Local changes are preserved. You can manually push or restore from backup."
        exit 1
    fi
else
    if [ $MERGED_COUNT -gt 0 ]; then
        print_warning "Changes not pushed (--no-push flag). Run 'git push origin main' to push."
    fi
fi

# Clean up backup branch if everything succeeded
if [ $FAILED_COUNT -eq 0 ] && [ $MERGED_COUNT -gt 0 ]; then
    print_status "All merges successful. Cleaning up backup branch..."
    git branch -D "$BACKUP_BRANCH"
    print_success "Backup branch deleted"
    BACKUP_BRANCH=""
else
    if [ -n "$BACKUP_BRANCH" ]; then
        print_warning "Backup branch '$BACKUP_BRANCH' retained for safety"
        print_status "To restore: git reset --hard $BACKUP_BRANCH"
    fi
fi

# Return to original branch
if [ "$ORIGINAL_BRANCH" != "main" ]; then
    print_status "Returning to original branch: $ORIGINAL_BRANCH"
    git checkout "$ORIGINAL_BRANCH"
fi

print_highlight "=== Auto-Merge Complete ==="
print_status "Full log saved to: $LOG_FILE"

# Exit with appropriate code
if [ $FAILED_COUNT -gt 0 ]; then
    exit 1
else
    exit 0
fi
