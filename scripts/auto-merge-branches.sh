#!/bin/bash

# Auto-merge script for merging all feature branches to main
# This script will automatically resolve conflicts by accepting the new version

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-head > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Switch to main branch
print_status "Switching to main branch..."
git checkout main
git pull origin main

# Get all remote branches excluding main and HEAD
FEATURE_BRANCHES=$(git branch -r --merged | grep -v 'origin/main' | grep -v 'origin/HEAD' | sed 's/origin\///' | grep -v '^[[:space:]]*$')

# Also get unmerged branches
UNMERGED_BRANCHES=$(git branch -r --no-merged | grep -v 'origin/main' | grep -v 'origin/HEAD' | sed 's/origin\///' | grep -v '^[[:space:]]*$')

# Combine all branches
ALL_BRANCHES="$FEATURE_BRANCHES $UNMERGED_BRANCHES"

# Filter for feature branches (branches starting with feat-, fix-, chore-, or containing specific patterns)
FILTERED_BRANCHES=""
for branch in $ALL_BRANCHES; do
    if [[ $branch =~ ^(feat|fix|chore|test|t[0-9]+) ]] || [[ $branch =~ ^[0-9]+ ]]; then
        FILTERED_BRANCHES="$FILTERED_BRANCHES $branch"
    fi
done

# Remove leading space
FILTERED_BRANCHES=$(echo "$FILTERED_BRANCHES" | sed 's/^ *//')

if [ -z "$FILTERED_BRANCHES" ]; then
    print_warning "No feature branches found to merge"
    exit 0
fi

print_status "Found feature branches to merge:"
echo "$FILTERED_BRANCHES" | tr ' ' '\n' | nl

# Counter for merged branches
MERGED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# Create a backup branch before starting
BACKUP_BRANCH="backup-main-$(date +%Y%m%d-%H%M%S)"
print_status "Creating backup branch: $BACKUP_BRANCH"
git branch "$BACKUP_BRANCH"

# Function to merge a branch with conflict resolution
merge_branch() {
    local branch=$1
    print_status "Merging branch: $branch"
    
    # Fetch the latest changes for the branch
    git fetch origin "$branch"
    
    # Create a temporary branch for merging
    local temp_branch="temp-merge-$branch"
    git checkout -b "$temp_branch" "origin/$branch"
    
    # Switch back to main
    git checkout main
    
    # Attempt to merge
    if git merge --no-ff "$temp_branch" -m "Auto-merge branch $branch"; then
        print_success "Successfully merged $branch"
        ((MERGED_COUNT++))
        
        # Delete the temporary branch
        git branch -D "$temp_branch"
        
        return 0
    else
        print_warning "Conflicts detected in $branch, resolving automatically..."
        
        # Check if there are conflicts
        if git ls-files --unmerged | grep -q .; then
            print_status "Resolving conflicts by accepting the new version..."
            
            # Resolve conflicts by accepting the new version (the incoming branch)
            for file in $(git diff --name-only --diff-filter=U); do
                print_status "Resolving conflicts in $file"
                # Accept the new version (ours in this context since we're merging into main)
                git checkout --theirs "$file"
                git add "$file"
            done
            
            # Commit the merge with conflict resolution
            if git commit -m "Auto-merge branch $branch (conflicts resolved)"; then
                print_success "Successfully merged $branch with conflict resolution"
                ((MERGED_COUNT++))
                
                # Delete the temporary branch
                git branch -D "$temp_branch"
                
                return 0
            else
                print_error "Failed to commit merge for $branch after conflict resolution"
                ((FAILED_COUNT++))
                
                # Abort the merge and clean up
                git merge --abort 2>/dev/null || true
                git branch -D "$temp_branch" 2>/dev/null || true
                
                return 1
            fi
        else
            print_error "Merge failed for $branch but no conflicts found"
            ((FAILED_COUNT++))
            
            # Abort the merge and clean up
            git merge --abort 2>/dev/null || true
            git branch -D "$temp_branch" 2>/dev/null || true
            
            return 1
        fi
    fi
}

# Merge each branch
for branch in $FILTERED_BRANCHES; do
    print_status "Processing branch: $branch"
    
    # Skip if branch doesn't exist remotely
    if ! git ls-remote --exit-code origin "refs/heads/$branch" >/dev/null 2>&1; then
        print_warning "Branch $branch does not exist remotely, skipping..."
        ((SKIPPED_COUNT++))
        continue
    fi
    
    # Skip if branch is already merged
    if git merge-base --is-ancestor "origin/$branch" main 2>/dev/null; then
        print_warning "Branch $branch is already merged into main, skipping..."
        ((SKIPPED_COUNT++))
        continue
    fi
    
    if merge_branch "$branch"; then
        print_success "✓ $branch merged successfully"
    else
        print_error "✗ Failed to merge $branch"
    fi
    
    echo "----------------------------------------"
done

# Push changes to remote
print_status "Pushing changes to remote..."
git push origin main

# Print summary
print_status "Merge Summary:"
echo "  Merged successfully: $MERGED_COUNT"
echo "  Failed to merge: $FAILED_COUNT"
echo "  Skipped: $SKIPPED_COUNT"

if [ $FAILED_COUNT -gt 0 ]; then
    print_error "Some branches failed to merge. Check the logs above for details."
    exit 1
else
    print_success "All feature branches have been merged successfully!"
    
    # Offer to clean up the backup branch
    read -p "Do you want to delete the backup branch '$BACKUP_BRANCH'? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git branch -D "$BACKUP_BRANCH"
        print_success "Backup branch deleted"
    else
        print_status "Backup branch '$BACKUP_BRANCH' retained for safety"
    fi
fi

# Return to original branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_status "Returning to original branch: $CURRENT_BRANCH"
    git checkout "$CURRENT_BRANCH"
fi