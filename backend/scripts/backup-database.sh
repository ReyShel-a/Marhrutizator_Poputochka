#!/bin/bash

# Database backup script for Rideshare Village
# Add to crontab: 0 2 * * * /var/www/rideshare-backend/scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/var/backups/rideshare"
DB_NAME="rideshare"
DB_USER="rideshare"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rideshare_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting database backup..."
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
echo "Backup created: ${BACKUP_FILE}.gz"

# Remove old backups
find "$BACKUP_DIR" -name "rideshare_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Old backups removed (older than $RETENTION_DAYS days)"

# Optional: Upload to cloud storage (uncomment and configure)
# aws s3 cp "${BACKUP_FILE}.gz" s3://your-bucket/backups/
# rclone copy "${BACKUP_FILE}.gz" remote:backups/

echo "Backup completed successfully"
