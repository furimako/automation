#!/bin/sh

#
# macOS
#

ssh -i ~/.ssh/LightsailDefaultKey-ap-northeast-1.pem -L 5901:127.0.0.1:5901 -C -N -l ubuntu automation.furimako.com
