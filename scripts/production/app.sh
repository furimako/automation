#!/bin/sh

#
# Ubuntu
#

# command = follow or unfollow
command=$1
count=$2
keyword=$3
account=$4

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app.sh (command: ${command}, count: ${count}, keyword: ${keyword}, account: ${account})"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] confirm crontab list"
crontab -l

# 1s x 60 x 15 = 15min
seconds=$(($RANDOM*60*15/32768))
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] sleep ${seconds}s"
sleep ${seconds}

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app (command: ${command}, count: ${count}, keyword: ${keyword}, account: ${account})"
cd ~/automation
NODE_ENV=production node app.js ${command} ${count} ${keyword} ${account}
