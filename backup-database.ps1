# Database Backup Script for PostgreSQL
# This script creates a backup of your PostgreSQL database

# Get the database URL from environment variables
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env.local file not found!"
    exit 1
}

# Read DATABASE_URL from .env.local
$databaseUrl = Get-Content $envFile | Select-String "DATABASE_URL" | ForEach-Object { ($_ -split "=")[1].Trim() }

if (-not $databaseUrl) {
    Write-Host "❌ Error: DATABASE_URL not found in .env.local!"
    exit 1
}

# Parse the DATABASE_URL to extract connection details
# Format: postgresql://user:password@host:port/database
if ($databaseUrl -match "postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
    $username = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    $database = $matches[5]
} else {
    Write-Host "❌ Error: Could not parse DATABASE_URL format!"
    exit 1
}

# Create backups directory if it doesn't exist
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Generate timestamp for backup filename
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupDir/database_backup_$timestamp.sql"

Write-Host "🔄 Creating database backup..."
Write-Host "   Database: $database"
Write-Host "   Host: $host"
Write-Host "   Port: $port"
Write-Host "   Backup file: $backupFile"

# Set password environment variable for pg_dump
$env:PGPASSWORD = $password

# Run pg_dump command
try {
    pg_dump -h $host -p $port -U $username -d $database -F p -f $backupFile --no-owner --no-acl
    
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "✅ Backup created successfully!"
        Write-Host "   File: $backupFile"
        Write-Host "   Size: $([math]::Round($fileSize, 2)) MB"
    } else {
        Write-Host "❌ Error: Backup failed!"
        exit 1
    }
} catch {
    Write-Host "❌ Error: pg_dump command not found!"
    Write-Host "   Please install PostgreSQL client tools (pg_dump)"
    Write-Host "   Download from: https://www.postgresql.org/download/"
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "`n💡 Tip: To restore this backup, use:"
Write-Host "   psql -h $host -p $port -U $username -d $database -f $backupFile"



