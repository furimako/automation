#!/bin/sh

#
# Ubuntu
#

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] START reboot.sh"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] confirm crontab list"
crontab -l

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] backup MongoDB"
bash ~/automation/scripts/production/mongodump.sh

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] rotate log files"
cd ~/automation/logs
mv app.log archives/app_$(date +'%Y%m%d%H%M%S').log

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] apt update"
sudo apt update
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] apt -y dist-upgrade"
sudo apt -y dist-upgrade
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start reboot"
sudo shutdown -r now
