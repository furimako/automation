
#!/bin/sh

# 
# Ubuntu 18.04.1
# 

# get Git repository
git clone https://github.com/FullyHatter/automation.git
git config --global user.name "FullyHatter"
git config --global user.email "furimako@gmail.com"
git config --global push.default simple

# set Timezone
sudo timedatectl set-timezone Asia/Tokyo

# install Node.js (version 10)
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

# install npm packages
cd automation
npm install
