const fs = require('fs')
const Base = require('./base')

const config = JSON.parse(fs.readFileSync('./configs/twitter-config.json', 'utf8'))

module.exports = class Verify extends Base {
    async execute() {
        await this.page.type('input#challenge_response', config.phoneNumber)
        await this.page.click('input#email_challenge_submit')
        return 'success'
    }
}
