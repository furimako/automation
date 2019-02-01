
# automation
This is the automation tool with [Puppeteer](https://pptr.dev/).

## How to Use the tool
### local (macOS)
1. create 'configs/mailgun-config.json'  
1. create 'configs/twitter-config.json'  
1. start script
    - follow
        > node app.js follow

### production (ubuntu 18.04.1)
1. create 'configs/mailgun-config.json'  
1. create 'configs/twitter-config.json'  
1. set-up crontab
    > crontab configs/crontab/crontab.config
