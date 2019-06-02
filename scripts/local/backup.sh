
#!/bin/sh

#
# macOS
#

local_path="/Users/furimako/Documents/Dropbox/makoto/others/backups/automation/$(date +%Y%m%d)"
mkdir $local_path

sudo scp -i /Users/furimako/.ssh/LightsailDefaultPrivateKey-ap-northeast-1.pem -r ubuntu@automation.furimako.com:~/automation/logs/* $local_path

echo "created backup (path: ${local_path})"
