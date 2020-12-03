#!/bin/sh

#
# Ubuntu
#

# command = follow, unfollow, login
command=$1
account=$2
count=$3
keyword=$4

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app-now.sh (command: ${command}, account: ${account}, count: ${count}, keyword: ${keyword})"
NODE_ENV=production node app.js ${command} ${account} ${count} ${keyword}
