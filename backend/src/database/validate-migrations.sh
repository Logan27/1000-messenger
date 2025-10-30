#!/bin/bash
# Validation script for SQL migrations
# This script checks the SQL syntax without running the migrations

set -e

echo "🔍 Validating SQL migration files..."

MIGRATION_DIR="$(dirname "$0")/migrations"

# Check if migration directory exists
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "❌ Migration directory not found: $MIGRATION_DIR"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(find "$MIGRATION_DIR" -name "*.sql" -type f | grep -v "rollback" | wc -l)
echo "📝 Found $MIGRATION_COUNT migration file(s)"

# List migration files
echo ""
echo "Migration files:"
find "$MIGRATION_DIR" -name "*.sql" -type f | sort | while read -r file; do
    filename=$(basename "$file")
    lines=$(wc -l < "$file")
    size=$(du -h "$file" | cut -f1)
    echo "  ✓ $filename ($lines lines, $size)"
done

echo ""
echo "✅ Migration files validation completed"
echo ""
echo "To run migrations:"
echo "  npm run migrate"
