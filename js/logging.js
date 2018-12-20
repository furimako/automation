const mailer = require('./mailer')

const title = 'automation'

module.exports = {
    info: msg => console.log(`[INFO] ${msg}`),
    error: (msg, mail = true) => {
        console.error(`[ERROR] ${msg}`)
        if (mail) {
            mailer.send(
                `[${title}] get ERROR`,
                `${msg}`
            )
        }
    }
}
