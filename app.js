const { logging } = require('node-utils')
const Follow = require('./js/follow')
const Unfollow = require('./js/unfollow')

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
    default:
        // should not be here
        logging.error('command should be wrong')
        process.exit(1)
        break
    }
    
    let result
    try {
        result = await browser.execute()
        logging.info('finished execution')
        logging.info(`the result is shown below\n${result}`)
        
        await browser.close(command, result)
        logging.info('finished closing app')
    } catch (err) {
        logging.error(`unexpected error has occurred in app.js\n${err}`)
    }
    logging.info('finished app')
}
