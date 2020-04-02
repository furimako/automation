const nodeUtils = require('node-utils')
const Follow = require('./js/follow')
const Unfollow = require('./js/unfollow')
const smtpConfig = require('./configs/smtp-config')

const { logging } = nodeUtils
const mailer = nodeUtils.createMailer(
    smtpConfig,
    {
        title: 'Automation',
        defaultFrom: '"Automation" <automation@furimako.com>'
    }
)

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
        await mailer.send({
            subject: `${command} finished (user: ${user})`,
            text: result
        })
        await browser.close()
    } catch (err) {
        const errorMessage = `failed to execute in app.js\n${err.stack}`
        logging.error(errorMessage)
        await mailer.send({
            subject: `${command} failed`,
            text: errorMessage
        })
    }
    logging.info('finished app')
})()
