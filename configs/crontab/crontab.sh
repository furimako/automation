
#!/bin/sh

# 
# Ubuntu 18.04.1
# 

# $1 = "tweet" / "follow"
action=$1

echo "[$(date +"%Y/%m/%d %H:%M:%S")] [info] confirm crontab list"
crontab -l

echo "[$(date +"%Y/%m/%d %H:%M:%S")] [info] rotate log files"
cd ~/automation/logs
mv ${action}.log archives/${action}_`date +%Y%m%d%H%M%S`.log

echo "[$(date +"%Y/%m/%d %H:%M:%S")] [info] start app (${action})"
cd ~/automation
npm run ${action}
