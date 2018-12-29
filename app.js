const logging = require('./js/logging')
const mailer = require('./js/mailer')
const follow = require('./js/twitter/follow')

const title = 'automation'

execute()

async function execute() {
    // command: tweet / follow
    const command = await process.argv[2]
    await logging.info(`starting app (env: ${process.env.NODE_ENV}, command: ${command})`)

    let result
    let resultStr
    switch (command) {
    case 'follow':
        await logging.info('starting follow')
        result = await follow()
        resultStr = `keyword: ${result.keyword}\n`
        resultStr += Object.keys(result.count).map(key => `URL: ${key}, follow: ${result.count[key]}`).join('\n')
        await logging.info('finished follow')
        await logging.info(`result is shown below\n${resultStr}`)
        
        mailer.send(
            `[${title}][${command}] finished`,
            `env: ${process.env.NODE_ENV}\n${resultStr}`
        )
        break
        
    default:
        // should not be here
        await logging.err('command should be wrong')
        process.exit(1)
    }
}
