
# automation
This is the automation tool with [Puppeteer](https://pptr.dev/).  
You can manipulate your SNS accounts automatically with the tool.

## How to Use the tool

### Local (macOS)
1. install [MongoDB Community Edition (version 4.2)](https://www.mongodb.com/download-center/community)
1. install [Node.js (version 14)](https://nodejs.org/en/download/)
1. install automation
    ```bash
    git clone https://github.com/furimako/node-utils.git
    cd node-utils
    npm install
    cd ..
    git clone https://github.com/furimako/automation.git
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
    - report
        ```bash
        node app.js report
        ```
    - login
        ```bash
        node inspect app.js login [user ID]
        ```

### production (Ubuntu 20.04)
1. set up server with below commands
    ```bash
    sudo apt update
    sudo apt -y dist-upgrade

    # install MongoDB Community Edition (version 4.2)
    wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
    sudo apt-get install gnupg
    wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
    echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org

    # install Node.js (version 14)
    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # install automation
    git clone https://github.com/furimako/node-utils.git
    cd node-utils
    npm install
    cd ..
    git clone https://github.com/furimako/automation.git
    cd automation
    npm install

    # install dependencies for Puppeteer
    sudo apt install \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
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
        lsb-release \
        wget \
        xdg-utils
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
