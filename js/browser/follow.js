const { logging } = require('node-utils')
const Base = require('./base')
const mongodbDriver = require('../mongodb_driver')
const selectors = require('../selectors')
const tabooWords = require('../taboo_words')

const resultEnum = {
    SUCCEESS: 'SUCCEESS',
    SKIP_FOLLOWED: 'SKIP_FOLLOWED',
    SKIP_PROTECTED: 'SKIP_PROTECTED',
    SKIP_NASTY: 'SKIP_NASTY',
    ERROR: 'ERROR'
}

module.exports = class Follow extends Base {
    constructor(user, count, keyword) {
        super(user, count)
        this.keyword = keyword
    }
    
    async execute() {
        await this.launch()
        const targetURLs = await this._getTargetURLsWithKeyword(this.keyword)
        logging.info(`targetURLs are shown below\n${targetURLs.join('\n')}`)
        
        const numOfFollowsBefore = await this.getNumOfFollows()
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        // start to click follow buttons
        logging.info(`start clickFollowButtons (numOfFollowsBefore: ${numOfFollowsBefore})`)
        await this.login(false)
        const results = await this._clickFollowButtons(targetURLs)
        
        if (results.filter((v) => v.result === resultEnum.SUCCEESS).length !== 0) {
            await mongodbDriver.insertUserNames(
                results.filter((v) => v.result === resultEnum.SUCCEESS)
                    .map((v) => ({
                        userName: v.userName,
                        date: new Date(),
                        user: this.user,
                        targetURL: v.targetURL,
                        keyword: this.keyword
                    }))
            )
        }
        
        /*
        resultsSummary = {
            targetURL1: {
                SUCCEESS: num,
                SKIP_FOLLOWED: num,
                SKIP_PROTECTED: num,
                SKIP_NASTY: num,
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
                    [resultEnum.SUCCEESS]: 0,
                    [resultEnum.SKIP_FOLLOWED]: 0,
                    [resultEnum.SKIP_PROTECTED]: 0,
                    [resultEnum.SKIP_NASTY]: 0,
                    [resultEnum.ERROR]: 0
                }
            }
            resultsSummary[v.targetURL][v.result] += 1
        })
        
        const resultStr = Object.keys(resultsSummary)
            .map((key) => `URL: ${key}`
                + `\nSUCCEESS: ${resultsSummary[key][resultEnum.SUCCEESS]}`
                + `\nSKIP (FOLLOWED: ${resultsSummary[key][resultEnum.SKIP_FOLLOWED]} / PROTECTED: ${resultsSummary[key][resultEnum.SKIP_PROTECTED]} / NASTY: ${resultsSummary[key][resultEnum.SKIP_NASTY]})`
                + `\nERROR: ${resultsSummary[key][resultEnum.ERROR]}`
                + '\n')
            .join('\n')
        
        let numOfFollowsAfter
        let numOfFollowers
        try {
            await this.browser.close()
            await this.launch()
            numOfFollowsAfter = await this.getNumOfFollows()
            numOfFollowers = await this.getNumOfFollowers()
        } catch (err) {
            logging.error(`failed to get numOfFollowsAfter or numOfFollowers\n${err.stack}`)
        }
        
        return `target count: ${this.count}`
            + `\nkeyword: ${this.keyword}`
            + '\n'
            + `\nfollowed: ${results.filter((v) => v.result === resultEnum.SUCCEESS).length}`
            + `\nnumOfFollows (before): ${numOfFollowsBefore}`
            + `\nnumOfFollows (after): ${numOfFollowsAfter}`
            + `\nnumOfFollowers: ${numOfFollowers}`
            + '\n'
            + `\n${resultStr}`
    }
    
    async _getTargetURLsWithKeyword() {
        await this.page.goto(`https://twitter.com/search?q=${this.keyword}&src=typd&f=user&vertical=default${(this.user === 'furimako') ? '&lang=ja' : ''}`)
        await this.page.waitForSelector(selectors.accountsList)
        logging.info('go to keyword page')
        
        return this.page.evaluate((selector) => {
            const elementList = document.querySelectorAll(selector)
            return Array.from(elementList, (element) => element.href)
        }, selectors.accountsList)
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
        
        const userNames = await mongodbDriver.findUserNames()
        
        let counter = 0
        let errorCount = 0
        for (let userID = 0; userID < targetURLs.length; userID += 1) {
            const targetURL = targetURLs[userID]
            await this.page.goto(`${targetURL}/followers`)
            
            for (let targetUser = 1; targetUser <= 100; targetUser += 1) {
                logging.info(`start to click (targetURL: ${targetURL}, ${targetUser})`)
                let userName
                try {
                    await this.page.waitForSelector(selectors.userName(targetUser))
                    userName = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerText,
                        selectors.userName(targetUser)
                    )
                    logging.info(`    L userName: ${userName}`)
                    
                    // userName check (ME)
                    if (userName === `@${this.user}`) {
                        logging.info('    L this account is me')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.SKIP_PROTECTED
                        })
                        continue
                    }
                    
                    // userName check (DB)
                    if (userNames.map((v) => v.userName).includes(userName)) {
                        logging.info('    L this account exists in DB')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.SKIP_FOLLOWED
                        })
                        continue
                    }
                    
                    // Protected status check
                    await this.page.waitForSelector(selectors.protectedIcon(targetUser))
                    const userType = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerHTML,
                        selectors.protectedIcon(targetUser)
                    )
                    if (userType) {
                        logging.info('    L this account is protected')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.SKIP_PROTECTED
                        })
                        continue
                    }
                    
                    // Taboo word check
                    try {
                        await this.page.waitForSelector(
                            selectors.accountDescription(targetUser),
                            { timeout: 5000 }
                        )
                        const accountDescription = await this.page.evaluate(
                            (selector) => document.querySelector(selector).innerText,
                            selectors.accountDescription(targetUser)
                        )
                        logging.info(`    L accountDescription: ${accountDescription}`)
                        let inappropriateAccount = false
                        tabooWords.forEach((word) => {
                            if (accountDescription.toLowerCase().includes(word)) {
                                logging.info(`    L this account contains taboo word (tabooWord: ${word})`)
                                inappropriateAccount = true
                            }
                        })
                        if (inappropriateAccount) {
                            results.push({
                                targetURL,
                                userName,
                                result: resultEnum.SKIP_NASTY
                            })
                            continue
                        }
                        logging.info('    L this account is appropriate')
                    } catch (err) {
                        logging.info('    L failed to get description (this account is not appropriate)')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.SKIP_NASTY
                        })
                        continue
                    }
                    
                    // Follow Button check
                    await this.page.waitForSelector(selectors.followButton(targetUser))
                    const buttonTypeBefore = await this.page.evaluate(
                        (selector) => document.querySelector(selector).innerText,
                        selectors.followButton(targetUser)
                    )
                    logging.info(`    L buttonTypeBefore: ${buttonTypeBefore}`)
                    if (!['Follow', 'フォロー'].includes(buttonTypeBefore)) {
                        logging.info(`    L this account is already followed (buttonTypeBefore: ${buttonTypeBefore})`)
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.SKIP_FOLLOWED
                        })
                        continue
                    }
                    
                    logging.info('    L all condition is fine')
                    
                    // wait 1 ~ 5s
                    const randMS = Math.floor(1000 + Math.random() * 4 * 1000)
                    logging.info(`    L wait for ${randMS}ms`)
                    await this.page.waitFor(randMS)
                    
                    // click follow button
                    await this.page.waitForSelector(selectors.followButton(targetUser))
                    await this.page.click(selectors.followButton(targetUser))
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
                            result: resultEnum.SUCCEESS
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
                
                await this.browser.close()
                await this.login()
                break
            }
        }
        return results
    }
}
