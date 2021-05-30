#!/bin/sh

#
# Ubuntu
#

# command = follow, unfollow, report, login
command=$1
account=$2
count=$3
keyword=$4

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] start app.sh (command: ${command}, account: ${account}, count: ${count}, keyword: ${keyword})"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] confirm crontab list"
crontab -l

# 1s x 60 x 15 = 15min
seconds=$(($RANDOM*60*15/32768))
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] sleep ${seconds}s"
sleep ${seconds}

cd ~/automation
NODE_ENV=production node app.js ${command} ${account} ${count} ${keyword}
