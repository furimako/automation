const fs = require('fs')
const { logging } = require('node-utils')

const mailgunConfig = JSON.parse(fs.readFileSync('./configs/mailgun-config.json', 'utf8'))
const title = 'Automation'
const from = '"Automation" <admin@automation.furimako.com>'
const mailer = require('node-utils').createMailer(mailgunConfig, title, from)

const Follow = require('./js/follow')
const Unfollow = require('./js/unfollow')

const env = process.env.NODE_ENV
const command = process.argv[2]
const count = parseInt(process.argv[3], 10)
const keyword = process.argv[4]
const user = process.argv[5] || 'furimako'

;(async () => {
    logging.info('start app')
    logging.info(`env: ${env}`)
    logging.info(`command: ${command}`)
    logging.info(`count: ${count}`)
    logging.info(`keyword: ${keyword}`)
    logging.info(`user: ${user}`)
    
    let browser
    switch (command) {
    case 'follow':
        browser = new Follow(user, count, keyword)
        break
    case 'unfollow':
        browser = new Unfollow(user, count)
        break
    default:
        // should not be here
        logging.error('command should be wrong')
        process.exit(1)
        break
    }
    
    try {
        const result = await browser.execute()
        logging.info(`finished execution and the result is shown below\n${result}`)
        mailer.send(`${command} finished (user: ${user})`, result)
        await browser.close()
    } catch (err) {
        const errorMessage = `failed to execute in app.js\n${err.stack}`
        logging.error(errorMessage)
        mailer.send(`${command} failed`, errorMessage)
    }
    logging.info('finished app')
})()
