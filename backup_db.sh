#!/bin/bash

# Run this script every day at 3:00 AM via crontab
# To set it up, run: crontab -e
# And add this line: 0 3 * * * ~/whenly/backup_db.sh >> ~/whenly/backup_log.txt 2>&1

cd ~/whenly || exit 1

# Backup the database
make backup
