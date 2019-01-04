const dateString = require('./date_string')
const mailer = require('./mailer')

const title = 'automation'

module.exports = {
    info: async msg => console.log(`[${dateString.now()}][INFO] ${msg}`),
    error: async (msg, mail = true) => {
        console.error(`[${dateString.now()}][ERROR] ${msg}`)
        if (mail) {
            mailer.send(
                `[${title}] get ERROR`,
                `${msg}`
            )
        }
    }
}
