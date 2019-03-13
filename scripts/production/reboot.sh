#!/bin/sh

#
# Ubuntu
#

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start reboot.sh"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] confirm crontab list"
crontab -l

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] rotate log files"
cd ~/automation/logs
mv app.log archives/app_$(date +'%Y%m%d%H%M%S').log

sudo apt update
sudo apt -y dist-upgrade
sudo shutdown -r now
