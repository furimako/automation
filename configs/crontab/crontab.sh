
#!/bin/sh

#
# Ubuntu
#

# $1 = "tweet"
action=$1

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] confirm crontab list"
crontab -l

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] rotate log files"
cd ~/automation/logs
mv ${action}.log archives/${action}_$(date +'%Y%m%d%H%M%S').log

seconds=$(($RANDOM*60*60/32768))
echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] sleep ${seconds}s"
sleep ${seconds}

echo "$(date +'%Y-%m-%dT%H:%M:%S')+09:00 [info] start app (${action})"
cd ~/automation
npm run ${action}
