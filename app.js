const logging = require('./js/logging')
const mailer = require('./js/mailer')
const Follow = require('./js/twitter/follow')

const title = 'automation'

execute()

async function execute() {
    // command: tweet / follow
    const env = process.env.NODE_ENV
    const command = await process.argv[2]
    await logging.info(`starting app (env: ${env}, command: ${command})`)

    if (command === 'follow') {
        await logging.info('starting follow')

        const follow = new Follow(env)
        const keyword = follow.keyword()
        await logging.info(`numOfFollows: ${follow.numOfFollows}`)
        await logging.info(`keyword: ${keyword}`)
        await follow.init()
        await logging.info('finished init')
        
        await follow.login()
        await logging.info('finished login')
        
        const targetURLs = await follow.getTargetURLsWithKeyword(keyword)
        await logging.info('finished getting targetURLs')
        await logging.info(`targetURLs are shown below\n${targetURLs.join('\n')}`)
        
        const result = await follow.clickFollowButtons(targetURLs)
        const totalCount = Object.values(result).map(v => v.success).reduce((total, v) => total + v)
        const resultStr = Object.keys(result).map(key => `URL: ${key}, follow: ${result[key].success}, fail: ${result[key].fail}`).join('\n')
        await logging.info('finished clicking follow buttons')
        await logging.info(`total count: ${totalCount}`)
        await logging.info(`details are shown below\n${resultStr}`)
        
        if (env === 'production') {
            await follow.close()
        }
        
        mailer.send(
            `[${title}] ${command} finished (env: ${env})`,
            `keyword: ${keyword}\n${resultStr}`
        )
    } else {
        // should not be here
        await logging.error('command should be wrong')
        process.exit(1)
    }
}
