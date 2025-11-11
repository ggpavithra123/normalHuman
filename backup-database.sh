#!/bin/bash
# Database Backup Script for PostgreSQL
# This script creates a backup of your PostgreSQL database

# Get the database URL from environment variables
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env.local file not found!"
    exit 1
fi

# Read DATABASE_URL from .env.local
DATABASE_URL=$(grep "DATABASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d ' ' | tr -d '"')

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env.local!"
    exit 1
fi

# Parse the DATABASE_URL to extract connection details
# Format: postgresql://user:password@host:port/database
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+) ]]; then
    USERNAME="${BASH_REMATCH[1]}"
    PASSWORD="${BASH_REMATCH[2]}"
    HOST="${BASH_REMATCH[3]}"
    PORT="${BASH_REMATCH[4]}"
    DATABASE="${BASH_REMATCH[5]}"
else
    echo "❌ Error: Could not parse DATABASE_URL format!"
    exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp for backup filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/database_backup_$TIMESTAMP.sql"

echo "🔄 Creating database backup..."
echo "   Database: $DATABASE"
echo "   Host: $HOST"
echo "   Port: $PORT"
echo "   Backup file: $BACKUP_FILE"

# Set password environment variable for pg_dump
export PGPASSWORD="$PASSWORD"

# Run pg_dump command
if pg_dump -h "$HOST" -p "$PORT" -U "$USERNAME" -d "$DATABASE" -F p -f "$BACKUP_FILE" --no-owner --no-acl; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $FILE_SIZE"
else
    echo "❌ Error: Backup failed!"
    unset PGPASSWORD
    exit 1
fi

# Clear password from environment
unset PGPASSWORD

echo ""
echo "💡 Tip: To restore this backup, use:"
echo "   psql -h $HOST -p $PORT -U $USERNAME -d $DATABASE -f $BACKUP_FILE"



