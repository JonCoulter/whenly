#!/bin/bash

# Run this script every day at 3:00 AM via crontab
# To set it up, run: crontab -e
# And add this line: 0 3 * * * ~/whenly/prune_backups.sh >> ~/whenly/backup_log.txt 2>&1

# Delete backup files older than 3 days in backups/
find ~/whenly/backups -type f -name '*.sql' -mtime +3 -exec rm -v {} \;
