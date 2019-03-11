
# automation
This is the automation tool with [Puppeteer](https://pptr.dev/).

## How to Use the tool

### local (macOS)
1. install Node.js (version 10)
1. install automation
    ```bash
    git clone https://github.com/FullyHatter/automation.git
    cd automation
    npm install
    ```
1. create 'configs/mailgun-config.json'  
1. create 'configs/twitter-config.json'  
1. start script
    - follow
        ```bash
        node app.js follow
        ```

### production (ubuntu)
1. set up server with below commands
    ```bash
    sudo timedatectl set-timezone Asia/Tokyo
    sudo apt update
    sudo apt -y dist-upgrade

    # install Node.js (version 10)
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # install automation
    git clone https://github.com/FullyHatter/automation.git
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
1. create 'configs/mailgun-config.json'  
1. create 'configs/twitter-config.json'  
1. set-up crontab
    ```bash
    crontab configs/crontab/crontab.config
    ```
