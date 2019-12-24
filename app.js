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
const numOfRetry = 3

execute()

async function execute() {
    logging.info('start app')
    logging.info(`env: ${env}`)
    logging.info(`command: ${command}`)
    logging.info(`count: ${count}`)
    logging.info(`keyword: ${keyword}`)
    
    let browser
    for (let i = 1; i <= numOfRetry; i += 1) {
        switch (command) {
        case 'follow':
            browser = new Follow(count, keyword)
            break
        case 'unfollow':
            browser = new Unfollow(count)
            break
        default:
            // should not be here
            logging.error('command should be wrong')
            process.exit(1)
            break
        }
    
        let result
        try {
            result = await browser.execute(numOfRetry)
            logging.info(`finished execution and the result is shown below\n${result}`)
            mailer.send(`${command} finished`, result)
            
            await browser.close()
            logging.info('finished closing app')
            break
        } catch (err) {
            logging.error(`unexpected error has occurred\n${err.stack}`)
            mailer.send(`${command} failed (${i})`, `unexpected error has occurred\n${err.stack}`)
        }
    }
    logging.info('finished app')
}
