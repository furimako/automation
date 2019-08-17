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
    constructor(count, keyword) {
        super()
        this.count = count
        this.keyword = keyword
    }
    
    async execute() {
        await this.login()
        const numOfFollowsBefore = await this.getNumOfFollows()
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        const targetURLs = await this.getTargetURLsWithKeyword(this.keyword)
        logging.info(`targetURLs are shown below\n${targetURLs.join('\n')}`)
        
        logging.info('start clickFollowButtons')
        const results = await this.clickFollowButtons(targetURLs)
        if (results.filter(v => v.result === resultEnum.FOLLOW_SUCCEEDED).length !== 0) {
            mongodbDriver.insertUserNames(
                results.filter(v => v.result === resultEnum.FOLLOW_SUCCEEDED)
                    .map(v => ({ userName: v.userName, date: new Date() }))
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
            .map(key => `URL: ${key}`
                + `, FOLLOW_SUCCEEDED: ${resultsSummary[key][resultEnum.FOLLOW_SUCCEEDED]}`
                + `, ALREADY_FOLLOWED: ${resultsSummary[key][resultEnum.ALREADY_FOLLOWED]}`
                + `, PROTECTED: ${resultsSummary[key][resultEnum.PROTECTED]}`
                + `, ERROR: ${resultsSummary[key][resultEnum.ERROR]}`)
            .join('\n')
        
        await this.relogin()
        const numOfFollowsAfter = await this.getNumOfFollows()
        const numOfFollowers = await this.getNumOfFollowers()
        
        return `target count: ${this.count}`
            + `\nkeyword: ${this.keyword}`
            + '\n'
            + `\nfollowed: ${results.filter(v => v.result === resultEnum.FOLLOW_SUCCEEDED).length}`
            + `\nnumOfFollows (before): ${numOfFollowsBefore}`
            + `\nnumOfFollows (after): ${numOfFollowsAfter}`
            + `\nnumOfFollowers: ${numOfFollowers}`
            + '\n'
            + `\n${resultStr}`
    }
    
    async getTargetURLsWithKeyword() {
        await this.page.goto(`https://twitter.com/search?q=${this.keyword}&src=typed_query&f=user`)
        await this.page.waitForSelector(selectors.accountsList)
        return this.page.evaluate((selector) => {
            const elementList = document.querySelectorAll(selector)
            return Array.from(elementList, element => element.href)
        }, selectors.accountsList)
    }
    
    
    /*
    results = [
        { targetURL: targetURL1, userName: userName1, result: result1 },
        { targetURL: targetURL1, userName: userName2, result: result2 },
        :
    ]
    */
    async clickFollowButtons(targetURLs) {
        const results = []
        if (!this.count) {
            return results
        }
        const userNames = await mongodbDriver.findUserNames()
        
        let counter = 0
        for (let userID = 0; userID < targetURLs.length; userID += 1) {
            const targetURL = targetURLs[userID]
            await this.page.goto(`${targetURL}/followers`)
            
            let errorCount = 0
            for (let i = 1; i <= 100; i += 1) {
                let userName
                try {
                    await this.page.waitForSelector(selectors.userName(i), { timeout: 5000 })
                    userName = await this.page.evaluate(
                        selector => document.querySelector(selector).innerText,
                        selectors.userName(i)
                    )
                    logging.info(`targetURL: ${targetURL}, following ${userName} (${i})`)
                    
                    // when the account is me
                    if (userName === '@furimako') {
                        logging.info('    L this account is me')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.PROTECTED
                        })
                        continue
                    }
                    
                    // when the account exists in DB
                    if (userNames.map(v => v.userName).includes(userName)) {
                        logging.info('    L this account exists in DB')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.ALREADY_FOLLOWED
                        })
                        continue
                    }
                    
                    // when the account is protected
                    await this.page.waitForSelector(selectors.protectedIcon(i), { timeout: 5000 })
                    const userType = await this.page.evaluate(
                        selector => document.querySelector(selector).innerHTML,
                        selectors.protectedIcon(i)
                    )
                    if (userType) {
                        logging.info('    L this account is protected')
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.PROTECTED
                        })
                        continue
                    }
                    
                    // when the account is already followed
                    await this.page.waitForSelector(selectors.followButton(i), { timeout: 5000 })
                    const buttonTypeBefore = await this.page.evaluate(
                        selector => document.querySelector(selector).innerText,
                        selectors.followButton(i)
                    )
                    if (!['Follow', 'フォロー'].includes(buttonTypeBefore)) {
                        logging.info(`    L this account is already followed (buttonTypeBefore: ${buttonTypeBefore})`)
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.ALREADY_FOLLOWED
                        })
                        continue
                    }
                    
                    // click follow button
                    logging.info('    L clicking the follow button')
                    await this.page.click(selectors.followButton(i))
                    
                    await this.page.waitForSelector(selectors.followButton(i), { timeout: 5000 })
                    const buttonTypeAfter = await this.page.evaluate(
                        selector => document.querySelector(selector).innerText,
                        selectors.followButton(i)
                    )
                    if (['Following', 'フォロー中'].includes(buttonTypeAfter)) {
                        logging.info(`    L follow succeeded (buttonTypeAfter: ${buttonTypeAfter})`)
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.FOLLOW_SUCCEEDED
                        })
                        counter += 1
                    } else {
                        logging.info(`    L failed to follow (buttonTypeAfter: ${buttonTypeAfter})`)
                        errorCount += 1
                        results.push({
                            targetURL,
                            userName,
                            result: resultEnum.ERROR
                        })
                    }
                    
                    if (counter >= this.count) {
                        return results
                    }
                } catch (err) {
                    logging.info(`    L failed to follow\ntargetURL: ${targetURL}\ntarget: ${i}\n${err}`)
                    errorCount += 1
                    results.push({
                        targetURL,
                        userName,
                        result: resultEnum.ERROR
                    })
                }
                
                if (errorCount === 1) {
                    await this.relogin()
                    await this.page.goto(`${targetURL}/followers`)
                }
                
                if (errorCount >= 2) {
                    return results
                }
            }
        }
        return results
    }
}
