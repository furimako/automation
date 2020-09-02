const puppeteer = require('puppeteer')
const { logging } = require('node-utils')
const selectors = require('../selectors')
const config = require('../../configs/twitter-config.js')

module.exports = class Base {
    /*
    browserHight: number of accounts on 1 screen
        10000: 203
        20000: 368
        30000: 574
        40000: 824
        50000: 897
        60000: 1041
        80000: 1570
    */
    constructor(user, count, browserHight = 10000) {
        this.user = user
        this.count = count
        this.browserHight = browserHight
    }
    
    async launch(browserHight) {
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            slowMo: 20
        })
        this.page = await this.browser.newPage()
        
        if (browserHight) {
            await this.page.setViewport({ width: 1366, height: browserHight })
        } else {
            await this.page.setViewport({ width: 1366 })
        }
        await this.page.setDefaultTimeout(20000)
        logging.info(`launched a browser (browserHight: ${browserHight})`)
    }
    
    async login() {
        logging.info('start to login')
        
        await this.page.goto('https://twitter.com/login')
        
        await this.page.waitForSelector(selectors.loginName)
        await this.page.type(selectors.loginName, this.user)
            
        await this.page.waitForSelector(selectors.loginPassword)
        await this.page.type(selectors.loginPassword, config[this.user].password)
            
        await this.page.waitForSelector(selectors.loginButton)
        await this.page.click(selectors.loginButton)
        logging.info('finished login')
        
        // debugger for Twitter GUI testing
        debugger  // eslint-disable-line
    }
    
    async close() {
        if (process.env.NODE_ENV === 'production' && this.browser) {
            await this.browser.close()
            logging.info('the browser was closed')
        }
    }
    
    static async execute() {
        // should override it
        throw new Error('should override execute function')
    }
    
    async getNumOfFollows() {
        return this._getStatus('following')
    }
    
    async getNumOfFollowers() {
        return this._getStatus('followers')
    }
    
    async _getStatus(type) {
        await this.page.goto(`https://twitter.com/${this.user}`)
        
        await this.page.waitForSelector(selectors.status(this.user, type))
        const numOfFollows = await this.page.evaluate(
            (selector) => document.querySelector(selector).innerText,
            selectors.status(this.user, type)
        )
        return parseInt(numOfFollows.replace(',', ''), 10)
    }
}
