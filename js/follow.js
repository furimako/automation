const { logging } = require('node-utils')
const Base = require('./base')
const mongodbDriver = require('./mongodb_driver')
const selectors = require('./selectors')

const resultEnum = {
    FOLLOW_SUCCEEDED: 'FOLLOW_SUCCEEDED',
    ALREADY_FOLLOWED: 'ALREADY_FOLLOWED',
    PROTECTED: 'PROTECTED',
    ERROR: 'ERROR'
}

module.exports = class Follow extends Base {
    constructor(user, count, keyword) {
        super(user, count)
        this.keyword = keyword
    }
    
    async execute() {
        const targetURLs = await this.operate(async () => {
            await this.launch()
            return this._getTargetURLsWithKeyword(this.keyword)
        }, false)
        logging.info(`targetURLs are shown below\n${targetURLs.join('\n')}`)
        
        const numOfFollowsBefore = await this.operate(async () => {
            await this.login(false)
            return this.getNumOfFollows()
        })
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        // start to click follow buttons
        logging.info(`start clickFollowButtons (numOfFollowsBefore: ${numOfFollowsBefore})`)
        const results = await this._clickFollowButtons(targetURLs)
        
        if (results.filter((v) => v.result === resultEnum.FOLLOW_SUCCEEDED).length !== 0) {
            await mongodbDriver.insertUserNames(
                results.filter((v) => v.result === resultEnum.FOLLOW_SUCCEEDED)
                    .map((v) => ({ userName: v.userName, date: new Date(), user: this.user }))
            )
        }
        
        /*
        resultsSummary = {
            targetURL1: {
                FOLLOW_SUCCEEDED: num,
                ALREADY_FOLLOWED: num,
                PROTECTED: num,
                ERROR: num
            }
            :
        }
        */
        const targetURLsAfter = []
        const resultsSummary = {}
        results.forEach((v) => {
            if (!targetURLsAfter.includes(v.targetURL)) {
                targetURLsAfter.push(v.targetURL)
                resultsSummary[v.targetURL] = {
                    [resultEnum.FOLLOW_SUCCEEDED]: 0,
                    [resultEnum.ALREADY_FOLLOWED]: 0,
                    [resultEnum.PROTECTED]: 0,
                    [resultEnum.ERROR]: 0
                }
            }
            resultsSummary[v.targetURL][v.result] += 1
        })
        
        const resultStr = Object.keys(resultsSummary)
            .map((key) => `URL: ${key}`
                + `, FOLLOW_SUCCEEDED: ${resultsSummary[key][resultEnum.FOLLOW_SUCCEEDED]}`
                + `, ALREADY_FOLLOWED: ${resultsSummary[key][resultEnum.ALREADY_FOLLOWED]}`
                + `, PROTECTED: ${resultsSummary[key][resultEnum.PROTECTED]}`
                + `, ERROR: ${resultsSummary[key][resultEnum.ERROR]}`)
            .join('\n')
        
        let numOfFollowsAfter
        let numOfFollowers
        try {
            await this.browser.close()
            await this.login()
            numOfFollowsAfter = await this.getNumOfFollows()
            numOfFollowers = await this.getNumOfFollowers()
        } catch (err) {
            logging.error(`failed to get numOfFollowsAfter or numOfFollowers\n${err.stack}`)
        }
        
        return `target count: ${this.count}`
            + `\nkeyword: ${this.keyword}`
            + '\n'
            + `\nfollowed: ${results.filter((v) => v.result === resultEnum.FOLLOW_SUCCEEDED).length}`
            + `\nnumOfFollows (before): ${numOfFollowsBefore}`
            + `\nnumOfFollows (after): ${numOfFollowsAfter}`
            + `\nnumOfFollowers: ${numOfFollowers}`
            + '\n'
            + `\n${resultStr}`
    }
    
    async _getTargetURLsWithKeyword() {
        let accountsList
        try {
            await this.page.goto(`https://twitter.com/search?f=users&vertical=default&q=${this.keyword}&src=typd`)
            await this.page.waitForSelector(selectors.accountsList1)
            accountsList = selectors.accountsList1
            logging.info('go to keyword page (style 1)')
        } catch (err) {
            await this.page.goto(`https://twitter.com/search?q=${this.keyword}&src=typd&f=user&vertical=default${(this.user === 'furimako') ? '&lang=ja' : ''}`)
            await this.page.waitForSelector(selectors.accountsList2)
            accountsList = selectors.accountsList2
            logging.info('go to keyword page (style 2)')
        }
        return this.page.evaluate((selector) => {
            const elementList = document.querySelectorAll(selector)
            return Array.from(elementList, (element) => element.href)
        }, accountsList)
    }
    
    
    /*
    results = [
        { targetURL: targetURL1, userName: userName1, result: result1 },
        { targetURL: targetURL1, userName: userName2, result: result2 },
        :
    ]
    */
    async _clickFollowButtons(targetURLs) {
        const results = []
        if (!this.count) {
            return results
        }
        
        const userNames = await this.operate(async () => mongodbDriver.findUserNames())
        
        let counter = 0
        let errorCount = 0
        for (let userID = 0; userID < targetURLs.length; userID += 1) {
            const targetURL = targetURLs[userID]
            await this.operate(async () => this.page.goto(`${targetURL}/followers`))
            
            for (let targetUser = 1; targetUser <= 100; targetUser += 1) {
                logging.info(`start to click (targetURL: ${targetURL}, ${targetUser})`)
                let userName
                try {
                    await this.page.waitForSelector(selectors.userName(targetUser))
                    userName = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerText,
                        selectors.userName(targetUser)
                    )
                    logging.info(`userName: ${userName}`)
                    
                    if (userName === `@${this.user}`) {
                        // when the account is me
                        logging.info('    L this account is me')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.PROTECTED
                        })
                        continue
                    }
                    
                    if (userNames.map((v) => v.userName).includes(userName)) {
                        // when the account exists in DB
                        logging.info('    L this account exists in DB')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.ALREADY_FOLLOWED
                        })
                        continue
                    }
                    
                    await this.page.waitForSelector(selectors.protectedIcon(targetUser))
                    const userType = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerHTML,
                        selectors.protectedIcon(targetUser)
                    )
                    if (userType) {
                        // when the account is protected
                        logging.info('    L this account is protected')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.PROTECTED
                        })
                        continue
                    }
                    
                    await this.page.waitForSelector(selectors.followButton(targetUser))
                    const buttonTypeBefore = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerText,
                        selectors.followButton(targetUser)
                    )
                    logging.info(`buttonTypeBefore: ${buttonTypeBefore}`)
                    if (!['Follow', 'フォロー'].includes(buttonTypeBefore)) {
                        // when the account is already followed
                        logging.info(`    L this account is already followed (buttonTypeBefore: ${buttonTypeBefore})`)
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.ALREADY_FOLLOWED
                        })
                        continue
                    }
                    
                    // click follow button
                    logging.info('    L all condition is fine')
                    await this.page.click(selectors.followButton(targetUser))
                    
                    await this.page.waitForSelector(selectors.followButton(targetUser))
                    const buttonTypeAfter = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerText,
                        selectors.followButton(targetUser)
                    )
                    
                    if (['Following', 'フォロー中'].includes(buttonTypeAfter)) {
                        // when follow succeeded
                        logging.info(`    L follow succeeded (buttonTypeAfter: ${buttonTypeAfter})`)
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.FOLLOW_SUCCEEDED
                        })
                        counter += 1
                        if (counter >= this.count) {
                            return results
                        }
                        continue
                    }
                    
                    // when follow failed (buttonTypeAfter !== 'Following' OR 'フォロー中')
                    logging.info(`    L failed to follow (buttonTypeAfter: ${buttonTypeAfter})`)
                } catch (err) {
                    // when follow failed (unexpected error)
                    logging.info(`    L failed to follow (unexpected error)\n${err.stack}`)
                }
                
                // when follow failed
                errorCount += 1
                logging.info(`    L errorCount: ${errorCount}`)
                results.push({
                    targetURL,
                    userName,
                    result: resultEnum.ERROR
                })
                
                if (errorCount >= 5) {
                    return results
                }
                
                await this.operate(async () => {
                    await this.browser.close()
                    await this.login()
                })
                break
            }
        }
        return results
    }
}
