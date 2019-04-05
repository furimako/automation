const fs = require('fs')
const puppeteer = require('puppeteer')
const logging = require('./utils/logging')
const mailer = require('./utils/mailer')

const env = process.env.NODE_ENV
const config = JSON.parse(fs.readFileSync('./configs/twitter-config.json', 'utf8'))

module.exports = class Base {
    async init() {
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            slowMo: 20
        })
        this.page = await this.browser.newPage()

        // login
        await this.page.goto('https://twitter.com/login')
        await this.page.type('input.js-username-field', config.address)
        await this.page.type('input.js-password-field', config.password)
        await this.page.click('button[type="submit"]')
    }
    
    async close(command, text) {
        if (process.env.NODE_ENV === 'production' && this.browser) {
            await this.browser.close()
            logging.info('the browser was closed')
        }
        
        mailer.send(
            `${command} finished (env: ${env})`,
            text
        )
    }
    
    static async execute() {
        // should override it
        throw new Error('should override execute function')
    }
    
    async getNumOfFollows() {
        const numOfFollowsSelector = '.ProfileCardStats-stat:nth-child(2) .ProfileCardStats-statValue'
        
        try {
            await this.page.goto('https://twitter.com')
            await this.page.waitForSelector(numOfFollowsSelector)
            const numOfFollows = await this.page.evaluate(
                selector => document.querySelector(selector).innerText,
                numOfFollowsSelector
            )
            return parseInt(numOfFollows.replace(',', ''), 10)
        } catch (err) {
            logging.error(`unexpected error has occurred in getNumOfFollows\n${err}`)
            return false
        }
    }
}
