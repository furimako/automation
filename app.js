const logging = require('./js/logging')
const mailer = require('./js/mailer')
const Follow = require('./js/twitter/follow')

const title = 'automation'

execute()

async function execute() {
    // command: tweet / follow
    const command = await process.argv[2]
    await logging.info(`starting app (env: ${process.env.NODE_ENV}, command: ${command})`)

    if (command === 'follow') {
        await logging.info('starting follow')
        
        const follow = new Follow()
        const keyword = follow.keyword()
        await logging.info(`numOfFollows: ${follow.numOfFollows}`)
        await logging.info(`keyword: ${keyword}`)
        
        // execute
        const result = await follow.execute(process.env.NODE_ENV, keyword)
        const countsStr = Object.keys(result.counts).map(key => `URL: ${key}, follow: ${result.counts[key].success}, fail: ${result.counts[key].fail}`).join('\n')
        await logging.info(`targetURLs are shown below\n${result.targetURLs.join('\n')}`)
        await logging.info(`result is shown below\n${countsStr}`)
        
        mailer.send(
            `[${title}] ${command} finished (env: ${process.env.NODE_ENV})`,
            `keyword: ${keyword}\n${countsStr}`
        )
    } else {
        // should not be here
        await logging.error('command should be wrong')
        process.exit(1)
    }
}
