const fs = require('fs')
const puppeteer = require('puppeteer')
const logging = require('./utils/logging')
const mailer = require('./utils/mailer')
const selectors = require('./selectors')

const env = process.env.NODE_ENV
const config = JSON.parse(fs.readFileSync('./configs/twitter-config.json', 'utf8'))

module.exports = class Base {
    async init() {
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            slowMo: 20
        })
        this.page = await this.browser.newPage()
        await this.page.setViewport({ width: 1366, height: 10000 })

        // login
        await this.page.goto('https://twitter.com/login')
        
        await this.page.waitForSelector(selectors.loginName)
        await this.page.type(selectors.loginName, config.address)
        
        await this.page.waitForSelector(selectors.loginPassword)
        await this.page.type(selectors.loginPassword, config.password)
        
        await this.page.waitForSelector(selectors.loginButton)
        await this.page.click(selectors.loginButton)
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
        return this.getStatus('following')
    }
    
    async getNumOfFollowers() {
        return this.getStatus('followers')
    }
    
    async getStatus(type) {
        try {
            await this.page.goto('https://twitter.com/FullyHatter')
            
            await this.page.waitForSelector(selectors.status(type))
            const numOfFollows = await this.page.evaluate(
                selector => document.querySelector(selector).innerText,
                selectors.status(type)
            )
            return parseInt(numOfFollows.replace(',', ''), 10)
        } catch (err) {
            logging.error(`unexpected error has occurred in getStatus\ntype: ${type}\n${err}`)
            return false
        }
    }
}
