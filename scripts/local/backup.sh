
#!/bin/sh

#
# macOS
#

local_path="/Users/furimako/Documents/Dropbox/makoto/5-others/backups/automation/$(date +%Y%m%d)"
mkdir $local_path

sudo scp -i /Users/furimako/.ssh/id_rsa -r furimako@automation.furimako.com:~/automation/logs/* $local_path

echo "created backup (path: ${local_path})"
