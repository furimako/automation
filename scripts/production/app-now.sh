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
NODE_ENV=production node app.js ${command} ${count} ${keyword} ${account}
