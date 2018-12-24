const logging = require('./js/logging')
const mailer = require('./js/mailer')
const tweet = require('./js/twitter/tweet')
const follow = require('./js/twitter/follow')

const title = 'automation'

execute()

async function execute() {
    // command: tweet / follow
    const command = await process.argv[2]
    await logging.info(`starting app (env: ${process.env.NODE_ENV}, command: ${command})`)

    let result
    switch (command) {
    case 'tweet':
        await logging.info('starting tweet')
        await tweet()
        break
        
    case 'follow':
        await logging.info('starting follow')
        result = await follow()
        result = Object.keys(result).map(key => `URL: ${key}, follow: ${result[key]}`).join('\n')
        await logging.info('follow finished')
        await logging.info(`result is shown below\n${result}`)
        
        mailer.send(
            `[${title}][${command}] finished`,
            `env: ${process.env.NODE_ENV}\n${result}`
        )
        break
        
    default:
        // should not be here
        await logging.err('command should be wrong')
        process.exit(1)
    }
}
