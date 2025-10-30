#!/bin/sh
set -e

# Generate runtime configuration file
cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {
  API_URL: "${VITE_API_URL:-http://localhost:3000/api}",
  WS_URL: "${VITE_WS_URL:-http://localhost:3000}",
  APP_NAME: "${APP_NAME:-Chat App}",
  VERSION: "${VERSION:-1.0.0}"
};
EOF

echo "Runtime configuration generated:"
cat /usr/share/nginx/html/config.js

# Execute the CMD
exec "$@"
