const logging = require('./js/logging')
const tweet = require('./js/twitter/tweet')
const follow = require('./js/twitter/follow')

// command: tweet / follow
const command = process.argv[2]

if (command === 'tweet') {
    logging.info('starting tweet')
    tweet()
    process.exit(0)
}

if (command === 'follow') {
    logging.info('starting follow')
    follow()
    process.exit(0)
}

// should not be here
logging.err('command should be wrong')
process.exit(1)
