#!/bin/sh

#
# Ubuntu
#

# command = follow, unfollow, report, login
command=$1
account=$2
count=$3
keyword=$4
quick=$5

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [INFO] start app-now.sh (command: ${command}, account: ${account}, count: ${count}, keyword: ${keyword}, quick: ${quick})"
NODE_ENV=production node app.js ${command} ${account} ${count} "${keyword}" ${quick}
