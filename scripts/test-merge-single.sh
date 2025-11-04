#!/bin/bash

# Test script for merging a single branch to main
# This is a simplified version for testing

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

# Test with a single branch - let's use the first feature branch we found
TEST_BRANCH="001-messenger-app"

print_status "Testing merge with branch: $TEST_BRANCH"

# Check if branch exists
if ! git ls-remote --exit-code origin "refs/heads/$TEST_BRANCH" >/dev/null 2>&1; then
    print_error "Branch $TEST_BRANCH does not exist remotely"
    exit 1
fi

# Check if branch is already merged
if git merge-base --is-ancestor "origin/$TEST_BRANCH" main 2>/dev/null; then
    print_warning "Branch $TEST_BRANCH is already merged into main"
    exit 0
fi

# Fetch the latest changes for the branch
git fetch origin "$TEST_BRANCH"

# Attempt to merge
print_status "Attempting to merge $TEST_BRANCH..."
if git merge --no-ff "origin/$TEST_BRANCH" -m "Test auto-merge branch $TEST_BRANCH"; then
    print_success "Successfully merged $TEST_BRANCH without conflicts"
else
    print_warning "Conflicts detected in $TEST_BRANCH, resolving automatically..."
    
    # Check if there are conflicts
    if git ls-files --unmerged | grep -q .; then
        print_status "Resolving conflicts by accepting the new version..."
        
        # Resolve conflicts by accepting the new version (the incoming branch)
        for file in $(git diff --name-only --diff-filter=U); do
            print_status "Resolving conflicts in $file"
            # Accept the new version (theirs in this context since we're merging into main)
            git checkout --theirs "$file"
            git add "$file"
        done
        
        # Commit the merge with conflict resolution
        if git commit -m "Test auto-merge branch $TEST_BRANCH (conflicts resolved)"; then
            print_success "Successfully merged $TEST_BRANCH with conflict resolution"
        else
            print_error "Failed to commit merge for $TEST_BRANCH after conflict resolution"
            git merge --abort 2>/dev/null || true
            exit 1
        fi
    else
        print_error "Merge failed for $TEST_BRANCH but no conflicts found"
        git merge --abort 2>/dev/null || true
        exit 1
    fi
fi

print_success "Test completed successfully!"

# Ask if we should push the changes
read -p "Do you want to push the test merge to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    print_success "Test merge pushed to remote"
else
    print_status "Test merge not pushed. You can manually push or reset if needed"
    print_warning "To reset: git reset --hard HEAD~1"
fi

# Return to original branch
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_status "Returning to original branch: $CURRENT_BRANCH"
    git checkout "$CURRENT_BRANCH"
fi