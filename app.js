const logging = require('./js/logging')
const mailer = require('./js/mailer')
const Follow = require('./js/twitter/follow')
const Unfollow = require('./js/twitter/unfollow')

const env = process.env.NODE_ENV
const command = process.argv[2]
const numOfCountsStr = process.argv[3]
const numOfCounts = parseInt(numOfCountsStr, 10)
const keyword = process.argv[4]

execute()

async function execute() {
    // command: tweet / follow
    logging.info(`start app (env: ${env}, command: ${command})`)

    if (command === 'follow') {
        logging.info('start follow')
        const follow = new Follow(numOfCounts)
        logging.info(`numOfCounts: ${numOfCounts}`)
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
            `keyword: ${keyword}\nnumOfCounts: ${numOfCounts}\ntotal follow count: ${totalCount}\n\n${resultStr}`
        )
        return
    }
    
    if (command === 'unfollow') {
        logging.info('start unfollow')
        const unfollow = new Unfollow(numOfCounts)
        logging.info(`numOfCounts: ${numOfCounts}`)
        logging.info(`minimumNumOfFollows: ${unfollow.minimumNumOfFollows}`)
        
        let totalCount
        let successCount
        let numOfFollowsBefore
        let numOfFollowsAfter
        try {
            logging.info('start init')
            await unfollow.init()
            
            logging.info('start login')
            await unfollow.login()
            
            logging.info('get numOfFollowsBefore')
            numOfFollowsBefore = await unfollow.getNumOfFollows()
            logging.info(`numOfFollowsBefore: ${numOfFollowsBefore}`)
            
            logging.info('start clickUnfollowButtons')
            const result = await unfollow.clickUnfollowButtons()
            totalCount = result.length
            successCount = result.filter(v => v.status === 'unfollowed').length
            logging.info(`total count: ${totalCount}`)
            logging.info(`success count: ${successCount}`)
            
            logging.info('get numOfFollowsAfter')
            numOfFollowsAfter = await unfollow.getNumOfFollows()
            logging.info(`numOfFollowsAfter: ${numOfFollowsAfter}`)
            
            if (env === 'production') {
                await unfollow.close()
            }
        } catch (err) {
            logging.error(`unexpected error has occurred in execute\n${err}`)
            if (unfollow.browser) {
                await unfollow.close()
            }
        }
        
        mailer.send(
            `${command} finished (env: ${env})`,
            `(minimumNumOfFollows: ${unfollow.minimumNumOfFollows})`
                + `\nnumOfCounts: ${numOfCounts}`
                + `\ntotal count: ${totalCount}`
                + `\nsuccess count: ${successCount}`
                + `\nbefore: ${numOfFollowsBefore}`
                + `\nafter: ${numOfFollowsAfter}`
        )
        return
    }
    
    // should not be here
    logging.error('command should be wrong')
    process.exit(1)
}
