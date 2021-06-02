const puppeteer = require('puppeteer')
const { logging } = require('node-utils')
const selectors = require('../selectors')
const config = require('../../configs/twitter-config')

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
    constructor(user, count, browserHight = 768) {
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
        
        await this.page.setViewport({ width: 1366, height: (browserHight) || 768 })
        await this.page.setDefaultTimeout(30000)
        logging.info(`launched a browser (browserHight: ${browserHight})`)
    }
    
    async login(user) {
        logging.info(`start to login (user: ${user})`)
        
        let loginUser
        if (user) {
            loginUser = user
        } else {
            loginUser = this.user
        }
        
        await this.page.goto('https://twitter.com/login')
        
        await this.page.waitForSelector(selectors.loginName)
        await this.page.type(selectors.loginName, loginUser)
            
        await this.page.waitForSelector(selectors.loginPassword)
        await this.page.type(selectors.loginPassword, config[loginUser].password)
            
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
    
    async execute() {
        await this.launch(this.browserHight)
        await this.login()
    }

    async getStatus(user, full = true) {
        await this.page.goto(`https://twitter.com/${user}`)
        
        let numOfFollowsStr = '-1'
        let numOfFollowersStr = '-1'
        let userTitle
        let userDescription
        try {
            await this.page.waitForSelector(selectors.userCount(user, 'following'))
            numOfFollowsStr = await this.page.evaluate(
                (selector) => document.querySelector(selector).innerText,
                selectors.userCount(user, 'following')
            )
            await this.page.waitForSelector(selectors.userCount(user, 'followers'))
            numOfFollowersStr = await this.page.evaluate(
                (selector) => document.querySelector(selector).innerText,
                selectors.userCount(user, 'followers')
            )
            if (full) {
                await this.page.waitForSelector(selectors.userTitle)
                userTitle = await this.page.evaluate(
                    (selector) => document.querySelector(selector).innerText,
                    selectors.userTitle
                )
                await this.page.waitForSelector(selectors.userDescription)
                userDescription = await this.page.evaluate(
                    (selector) => document.querySelector(selector).innerText,
                    selectors.userDescription
                )
            }
        } catch (err) {
            logging.error(`failed to getStatus\n${err.stack}`)
        }

        const status = {
            numOfFollows: _toNumber(numOfFollowsStr),
            numOfFollowers: _toNumber(numOfFollowersStr),
            userTitle,
            userDescription
        }
        logging.info(`getStatus (user: ${user}, full: ${full}, status: ${JSON.stringify(status)}`)
        return status
    }
}

function _toNumber(countStr) {
    if (!countStr) {
        return 0
    }

    if (countStr.includes('万')) {
        return parseFloat(countStr.replace(',', '').replace('万', '')) * 10000
    }
    if (countStr.includes('K')) {
        return parseFloat(countStr.replace(',', '').replace('K', '')) * 1000
    }
    if (countStr.includes('M')) {
        return parseFloat(countStr.replace(',', '').replace('M', '')) * 1000000
    }
    return parseFloat(countStr.replace(',', ''))
}
