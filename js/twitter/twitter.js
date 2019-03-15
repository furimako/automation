const fs = require('fs')
const puppeteer = require('puppeteer')

const config = JSON.parse(fs.readFileSync('./configs/twitter-config.json', 'utf8'))

module.exports = class Twitter {
    async init() {
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            slowMo: 50
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
