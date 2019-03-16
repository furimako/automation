const logging = require('./js/utils/logging')
const Follow = require('./js/follow')
const Unfollow = require('./js/unfollow')
const Verify = require('./js/verify')

const env = process.env.NODE_ENV
const command = process.argv[2]
const count = parseInt(process.argv[3], 10)
const keyword = process.argv[4]

execute()

async function execute() {
    logging.info('start app')
    logging.info(`env: ${env}`)
    logging.info(`command: ${command}`)
    logging.info(`count: ${count}`)
    logging.info(`keyword: ${keyword}`)
    
    let browser
    switch (command) {
    case 'follow':
        browser = new Follow(count, keyword)
        break
    case 'unfollow':
        browser = new Unfollow(count)
        break
    case 'verify':
        browser = new Verify()
        break
    default:
        // should not be here
        logging.error('command should be wrong')
        process.exit(1)
        break
    }
    
    let result
    try {
        await browser.init()
        logging.info('finished initialization')
        
        result = await browser.execute()
        logging.info('finished execution')
        logging.info(`the result is shown below\n${result}`)
    } catch (err) {
        logging.error(`unexpected error has occurred in execute\n${err}`)
    }
    await browser.close(command, result)
    logging.info('finished app')
}
