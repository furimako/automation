const Base = require('./base')
const logging = require('./utils/logging')
const selectors = require('./selectors')

module.exports = class Follow extends Base {
    constructor(count, keyword) {
        super()
        this.count = count
        this.keyword = keyword
    }
    
    async execute() {
        await this.login()
        const numOfFollowsBefore = await this.getNumOfFollows()
        
        const targetURLs = await this.getTargetURLsWithKeyword(this.keyword)
        logging.info(`targetURLs are shown below\n${targetURLs.join('\n')}`)
        
        logging.info('start clickFollowButtons')
        const result = await this.clickFollowButtons(targetURLs)
        const totalCount = Object.values(result)
            .map(v => v.success)
            .reduce((total, v) => total + v)
        const resultStr = Object.keys(result)
            .map(key => `URL: ${key}, follow: ${result[key].success}, skip: ${result[key].skip}, fail: ${result[key].fail}`)
            .join('\n')
        
        await this.relogin()
        const numOfFollowsAfter = await this.getNumOfFollows()
        const numOfFollowers = await this.getNumOfFollowers()
        
        return `target count: ${this.count}`
            + `\nkeyword: ${this.keyword}`
            + '\n'
            + `\nfollowed: ${totalCount}`
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
    
    async clickFollowButtons(targetURLs) {
        const counts = {}
        if (!this.count) {
            return counts
        }
        
        let counter = 0
        for (let userID = 0; userID < targetURLs.length; userID += 1) {
            const targetURL = targetURLs[userID]
            counts[targetURL] = { success: 0, skip: 0, fail: 0 }
            await this.page.goto(`${targetURL}/followers`)
            
            let timeoutCount = 0
            for (let i = 1; i <= 100; i += 1) {
                logging.info(`following ${i}, targetURL: ${targetURL}`)
                
                // check status of the target
                let userType
                let buttonType
                try {
                    // check userType
                    await this.page.waitForSelector(selectors.protectedIcon(i), { timeout: 5000 })
                    userType = await this.page.evaluate(
                        selector => document.querySelector(selector).innerHTML,
                        selectors.protectedIcon(i)
                    )
                    
                    // check buttonType
                    await this.page.waitForSelector(selectors.followButton(i), { timeout: 5000 })
                    buttonType = await this.page.evaluate(
                        selector => document.querySelector(selector).innerText,
                        selectors.followButton(i)
                    )
                    
                    // click follow button
                    if (!userType && ['Follow', 'フォロー'].includes(buttonType)) {
                        logging.info('status: OK')
                        await this.page.click(selectors.followButton(i))
                        counts[targetURL].success += 1
                        counter += 1
                    } else if (userType) {
                        logging.info('status: protected')
                        counts[targetURL].skip += 1
                    } else if (!['Follow', 'フォロー'].includes(buttonType)) {
                        logging.info('already followed')
                        counts[targetURL].skip += 1
                    } else {
                        throw new Error('should not be here')
                    }
                    
                    if (counter >= this.count) {
                        return counts
                    }
                } catch (err) {
                    counts[targetURL].fail += 1
                    logging.info(`fail to follow\ntargetURL: ${targetURL}\ntarget: ${i}\n${err}`)
                    
                    if (err.name === 'TimeoutError') {
                        await this.relogin()
                        await this.page.goto(`${targetURL}/followers`)
                        timeoutCount += 1
                    }
                    
                    if (counts[targetURL].fail >= 10 || timeoutCount >= 2) {
                        break
                    }
                }
            }
        }
        return counts
    }
}
