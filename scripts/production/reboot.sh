#!/bin/sh

#
# Ubuntu
#

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] START reboot.sh"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] confirm crontab list"
crontab -l

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] backup MongoDB"
bash ~/automation/scripts/production/mongodump.sh

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] rotate log files"
cd ~/automation/logs
mv app.log archives/app_$(date +'%Y%m%d%H%M%S').log

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] apt update"
sudo apt-get update

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] apt -y dist-upgrade"
sudo apt-get -y dist-upgrade

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] stop MongoDB"
bash ~/automation/scripts/production/mongod.sh stop

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] start reboot"
sudo shutdown -r now
