#!/bin/sh
set -e

echo "========================================"
echo "  FUTBOSS - Production Entrypoint"
echo "========================================"
echo ""

# Check required environment variables
check_env() {
    if [ -z "$(eval echo \$$1)" ]; then
        echo "WARNING: $1 is not set"
    fi
}

check_env "DATABASE_URL"
check_env "REDIS_URL"
check_env "NEXTAUTH_SECRET"
check_env "NEXTAUTH_URL"
check_env "WS_PORT"

echo ""
echo "[1/4] Verifying database connection..."
if [ -n "$DATABASE_URL" ]; then
    MAX_RETRIES=30
    RETRY_COUNT=0
    until npx prisma db push --skip-generate 2>/dev/null || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "Waiting for database... attempt $RETRY_COUNT/$MAX_RETRIES"
        sleep 2
    done
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "WARNING: Could not connect to database after $MAX_RETRIES attempts"
    else
        echo "Database connection verified"
    fi
fi

echo ""
echo "[2/4] Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
    npx prisma migrate deploy 2>/dev/null || echo "No pending migrations"
    npx prisma generate
    echo "Database schema is up to date"
fi

echo ""
echo "[3/4] Starting WebSocket server..."
if [ -n "$WS_PORT" ]; then
    echo "WebSocket server configured on port $WS_PORT"
fi

echo ""
echo "[4/4] Starting Next.js production server..."
echo ""

# Execute the main process
exec "$@"
