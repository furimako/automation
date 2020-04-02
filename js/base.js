const puppeteer = require('puppeteer')
const { logging } = require('node-utils')
const selectors = require('./selectors')
const config = require('../configs/twitter-config.js')

const numOfRetry = 2

module.exports = class Base {
    constructor(user, count) {
        this.user = user
        this.count = count
    }

    async operate(operator, withLogin = true) {
        for (let i = 1; i <= numOfRetry; i += 1) {
            try {
                if (i !== 1) {
                    if (this.browser) {
                        await this.browser.close()
                    }
                    if (withLogin) {
                        await this.login()
                    }
                }
                const result = await operator()
                return result
            } catch (err) {
                logging.error(`failed to operate (${i}/${numOfRetry})\n${err.stack}`)
            }
        }
        throw new Error('failed to operate')
    }
    
    async launch() {
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            slowMo: 20
        })
        this.page = await this.browser.newPage()
        await this.page.setViewport({ width: 1366, height: 10000 })
        await this.page.setDefaultTimeout(5000)
    }
    
    async login(withLaunch = true) {
        logging.info('start to login')
        
        if (withLaunch) {
            await this.launch()
        }
        await this.page.goto('https://twitter.com/login')
        
        try {
            await this.page.waitForSelector(selectors.loginName1)
            await this.page.type(selectors.loginName1, this.user)
            
            await this.page.waitForSelector(selectors.loginPassword1)
            await this.page.type(selectors.loginPassword1, config[this.user].password)
            
            await this.page.waitForSelector(selectors.loginButton1)
            await this.page.click(selectors.loginButton1)
            logging.info('finished login (style 1)')
        } catch (err) {
            await this.page.waitForSelector(selectors.loginName2)
            await this.page.type(selectors.loginName2, this.user)
            
            await this.page.waitForSelector(selectors.loginPassword2)
            await this.page.type(selectors.loginPassword2, config[this.user].password)
            
            await this.page.waitForSelector(selectors.loginButton2)
            await this.page.click(selectors.loginButton2)
            logging.info('finished login (style 2)')
        }
        
        // debugger for Twitter GUI testing
        debugger  // eslint-disable-line
        
        // verification
        try {
            await this.page.waitForSelector(selectors.loginName2)
            await this.page.type(selectors.loginName2, config[this.user].mail)
            
            await this.page.waitForSelector(selectors.loginPassword2)
            await this.page.type(selectors.loginPassword2, config[this.user].password)
            
            await this.page.waitForSelector(selectors.loginButton2)
            await this.page.click(selectors.loginButton2)
            logging.info('finished verification (style 2)')
        } catch (err) {
            logging.info('no need to verify')
        }
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
        return this.getStatus('following')
    }
    
    async getNumOfFollowers() {
        return this.getStatus('followers')
    }
    
    async getStatus(type) {
        await this.page.goto(`https://twitter.com/${this.user}`)
                
        await this.page.waitForSelector(selectors.status(this.user, type))
        const numOfFollows = await this.page.evaluate(
            (selector) => document.querySelector(selector).innerText,
            selectors.status(this.user, type)
        )
        return parseInt(numOfFollows.replace(',', ''), 10)
    }
}
