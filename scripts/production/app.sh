#!/bin/sh

#
# Ubuntu
#

# command = follow or unfollow
command=$1
count=$2
keyword=$3

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app.sh (command: ${command})"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] confirm crontab list"
crontab -l

# 1s x 60 x 10 = 10min
seconds=$(($RANDOM*60*10/32768))
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] sleep ${seconds}s"
sleep ${seconds}

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app (command: ${command})"
cd ~/automation
NODE_ENV=production node app.js ${command} ${count} ${keyword}
