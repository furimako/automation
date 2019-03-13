#!/bin/sh

#
# Ubuntu
#

numOfFollows=$1
keyword=$2

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start follow.sh"

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] confirm crontab list"
crontab -l

seconds=$(($RANDOM*60*60/32768))
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] sleep ${seconds}s"
sleep ${seconds}

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app (follow)"
cd ~/automation
NODE_ENV=production node app.js follow ${numOfFollows} ${keyword}
