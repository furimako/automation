
# automation
This is the automation tool with [Puppeteer](https://pptr.dev/).  
You can manipulate your SNS accounts automatically with the tool.

## How to Use the tool

### local (macOS)
1. install [MongoDB Community Edition (version 4.2)](https://www.mongodb.com/download-center/community)
1. install [Node.js (version 12)](https://nodejs.org/en/download/)
1. install automation
    ```bash
    git clone https://github.com/furimako/automation.git
    git clone https://github.com/furimako/node-utils.git
    cd automation
    npm install
    ```
1. create 'configs/smtp-config.json'
1. create 'configs/twitter-config.json'
1. start MongoDB
    ```bash
    bash scripts/local/mongod.sh
    ```
1. start script
    - follow
        ```bash
        node app.js follow [user ID] [numOfCounts] [keyword]
        ```
    - unfollow
        ```bash
        node app.js unfollow [user ID] [numOfCounts]
        ```
    - login
        ```bash
        node app.js login [user ID]
        ```

### production (ubuntu)
1. set up server with below commands
    ```bash
    # install MongoDB Community Edition (version 4.2)
    wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
    sudo apt-get install gnupg
    wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
    echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org

    # install Node.js (version 12)
    curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # install automation
    git clone https://github.com/furimako/automation.git
    git clone https://github.com/furimako/node-utils.git
    cd automation
    npm install

    # install dependencies for Puppeteer
    sudo apt install \
        gconf-service \
        libasound2 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgcc1 \
        libgconf-2-4 \
        libgdk-pixbuf2.0-0 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        ca-certificates \
        fonts-liberation \
        libappindicator1 \
        libnss3 \
        lsb-release \
        xdg-utils \
        wget
    ```
1. create 'configs/smtp-config.json'
1. create 'configs/twitter-config.json'
1. start MongoDB
    ```bash
    bash scripts/production/mongod.sh start
    ```
1. set-up crontab
    ```bash
    crontab configs/crontab.config
    ```

## VNC for GUI on Ubuntu
### set up VNC
```bash
# install the Xfce desktop environment on your server
sudo apt install xfce4 xfce4-goodies

# install the TightVNC servers
sudo apt install tightvncserver

# set up a secure password and create the initial configuration files
vncserver
```

### How to run
1. start VNC server
    ```bash
    vncserver
    ```
1. connect to the server from MacOS
    ```bash
    bash scripts/local/connect-vncserver.sh
    vnc://localhost:5901
    ```
1. stop VNC server
    ```bash
    vncserver -kill :1
    ```
