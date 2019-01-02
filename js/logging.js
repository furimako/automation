const dateString = require('./date_string')
const mailer = require('./mailer')

const title = 'automation'

module.exports = {
    info: msg => console.log(`[${dateString.now()}][INFO] ${msg}`),
    error: (msg, mail = true) => {
        console.error(`[${dateString.now()}][ERROR] ${msg}`)
        if (mail) {
            mailer.send(
                `[${title}] get ERROR`,
                `${msg}`
            )
        }
    }
}
