/* eslint-disable prefer-destructuring */
const nodeUtils = require('node-utils')
const Follow = require('./js/browser/follow')
const Unfollow = require('./js/browser/unfollow')
const Report = require('./js/browser/report')
const Base = require('./js/browser/base')
const smtpConfig = require('./configs/smtp-config')

const { logging } = nodeUtils
const mailer = nodeUtils.createMailer(
    smtpConfig,
    {
        title: 'Automation',
        defaultFrom: '"Automation" <automation@furimako.com>',
        defaultTo: 'furimako@gmail.com'
    }
)

const env = process.env.NODE_ENV
const command = process.argv[2]

let user
let count
let fromDate
let toDate
if (command === 'report') {
    fromDate = process.argv[3]
    toDate = process.argv[4]
} else {
    user = process.argv[3]
    count = parseInt(process.argv[4], 10)
}
const keyword = process.argv[5]
const quick = process.argv[6]

;(async () => {
    logging.info('start app')
    logging.info(`env: ${env}`)
    logging.info(`command (arg1): ${command}`)
    logging.info((user) ? `user (arg2): ${user}` : `fromDate (arg2): ${fromDate}`)
    logging.info((count) ? `count (arg3): ${count}` : `toDate (arg3): ${toDate}`)
    logging.info(`keyword (arg4): ${keyword}`)
    logging.info(`quick (arg5): ${quick}`)
    
    let browser
    switch (command) {
    case 'follow':
        browser = new Follow(user, count, keyword, quick)
        break
    case 'unfollow':
        browser = new Unfollow(user, count)
        break
    case 'report':
        // fromDate (yyyymmdd), toDate (yyyymmdd)
        browser = new Report(fromDate, toDate)
        break
    case 'login':
        browser = new Base(user, count)
        break
    default:
        // should not be here
        logging.error('command should be wrong')
        process.exit(1)
        break
    }
    
    try {
        const result = await browser.execute()
        logging.info(`finished execution and the result is shown below (hasError: ${result.hasError})\n${result.str}`)
        if (env === 'production' && result.hasError) {
            await mailer.send({
                subject: `${command} failed (user: ${user})`,
                text: result.str
            })
        }
        await browser.close()
    } catch (err) {
        const errorMessage = `failed to execute in app.js\n${err.stack}`
        logging.error(errorMessage)
        await browser.close()
        if (env === 'production') {
            await mailer.send({
                subject: `${command} failed`,
                text: errorMessage
            })
        }
    }
    logging.info('finished app')
})()
