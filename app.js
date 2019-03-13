const logging = require('./js/logging')
const mailer = require('./js/mailer')
const Follow = require('./js/twitter/follow')

const env = process.env.NODE_ENV
const command = process.argv[2]
const numOfFollows = process.argv[3]
const keywordStr = process.argv[4]
const keyword = parseInt(keywordStr, 10)

execute()

async function execute() {
    // command: tweet / follow
    logging.info(`start app (env: ${env}, command: ${command})`)

    if (command === 'follow') {
        logging.info('start follow')
        const follow = new Follow(numOfFollows)
        logging.info(`numOfFollows: ${follow.numOfFollows}`)
        logging.info(`keyword: ${keyword}`)
        
        let totalCount
        let resultStr
        try {
            logging.info('start init')
            await follow.init()
            
            logging.info('start login')
            await follow.login()
            
            logging.info('start getTargetURLsWithKeyword')
            const targetURLs = await follow.getTargetURLsWithKeyword(keyword)
            logging.info(`targetURLs are shown below\n${targetURLs.join('\n')}`)
            
            logging.info('start clickFollowButtons')
            const result = await follow.clickFollowButtons(targetURLs)
            totalCount = Object.values(result).map(v => v.success).reduce((total, v) => total + v)
            resultStr = Object.keys(result).map(key => `URL: ${key}, follow: ${result[key].success}, fail: ${result[key].fail}`).join('\n')
            logging.info(`total follow count: ${totalCount}`)
            logging.info(`result is shown below\n${resultStr}`)
            
            if (env === 'production') {
                await follow.close()
            }
        } catch (err) {
            logging.error(`unexpected error has occurred in execute\n${err}`)
            if (follow.browser) {
                await follow.close()
            }
        }
        
        mailer.send(
            `${command} finished (env: ${env})`,
            `keyword: ${keyword}\ntotal follow count: ${totalCount}\n\n${resultStr}`
        )
    } else {
        // should not be here
        logging.error('command should be wrong')
        process.exit(1)
    }
}
