#!/bin/bash

# Run this script every day at 3:00 AM via crontab
# To set it up, run: crontab -e
# And add this line: 0 3 * * * /home/jc803/whenly/backup_db.sh >> /home/jc803/whenly/backup_log.txt 2>&1

cd /home/jc803/whenly || exit 1

# Backup the database
make backup
