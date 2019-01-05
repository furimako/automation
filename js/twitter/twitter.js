const fs = require('fs')
const puppeteer = require('puppeteer')

const config = JSON.parse(fs.readFileSync('./configs/twitter-config.json', 'utf8'))

module.exports = class Twitter {
    constructor(env) {
        this.env = env
    }
    
    async init() {
        this.browser = await puppeteer.launch({
            headless: this.env === 'production',
            slowMo: 10
        })
        this.page = await this.browser.newPage()
    }

    async login() {
        await this.page.goto('https://twitter.com/login')
        await this.page.type('input.js-username-field', config.address)
        await this.page.type('input.js-password-field', config.password)
        await this.page.click('button[type="submit"]')
    }
    
    async close() {
        await this.browser.close()
    }
}
