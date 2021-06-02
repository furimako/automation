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
    logging.info(`command: ${command}`)
    
    let browser
    switch (command) {
    case 'follow':
        logging.info(`user: ${user}, count: ${count}, keyword: ${keyword}, quick: ${quick}`)
        if (!user || !count || !keyword) {
            logging.error('wrong args')
            process.exit(1)
        }
        browser = new Follow(user, count, keyword, quick)
        break
    case 'unfollow':
        logging.info(`user: ${user}, count: ${count}`)
        if (!user || !count) {
            logging.error('wrong args')
            process.exit(1)
        }
        browser = new Unfollow(user, count)
        break
    case 'report':
        // fromDate (yyyymmdd), toDate (yyyymmdd)
        logging.info(`fromDate: ${fromDate}, toDate: ${toDate}`)
        browser = new Report(fromDate, toDate)
        break
    case 'login':
        logging.info(`user: ${user}`)
        if (!user) {
            logging.error('wrong args')
            process.exit(1)
        }
        browser = new Base(user)
        break
    default:
        // should not be here
        logging.error(`command should be wrong (command: ${command})`)
        process.exit(1)
    }
    
    try {
        const result = await browser.execute()
        logging.info(`finished execution and the result is shown below (hasError: ${result.hasError})\n${JSON.stringify(result.str)}`)
        if (env === 'production' && result.hasError) {
            await mailer.send({
                subject: `${command} failed (user: ${user})`,
                text: result.str
            })
        }
        if (env === 'production' && command === 'report') {
            await mailer.send({
                subject: `furimako ${command} (${result.fromDateStr}~${result.toDateStr})`,
                text: result.str.ja
            })
            await mailer.send({
                subject: `furimako_en ${command} (${result.fromDateStr}~${result.toDateStr})`,
                text: result.str.en
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
