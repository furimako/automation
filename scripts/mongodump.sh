
#!/bin/sh

#
# Ubuntu
#

sudo mongodump --out ~/automation/logs/dumps/$(date +%Y%m%d-%H%M%S)/
