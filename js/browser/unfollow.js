const { logging } = require('node-utils')
const Base = require('./base')
const selectors = require('../selectors')

const minimumNumOfFollows = 1200
const skipCount = 400
const resultEnum = {
    SUCCEESS: 'SUCCEESS',
    SKIP_FOLLOWER: 'SKIP_FOLLOWER'
}

module.exports = class Unfollow extends Base {
    constructor(user, count) {
        super(user, count, 80000)
    }
    
    async execute() {
        await this.launch(this.browserHight)
        const statusBefore = await this.getStatus(this.user, false)
        const numOfFollowsBefore = statusBefore.numOfFollows
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        // start to click unfollow buttons
        await this.login()
        const result = await this._clickUnfollowButtons(numOfFollowsBefore)
        const count = {
            success: result.filter((v) => v.status === resultEnum.SUCCEESS).length,
            skipFollower: result.filter((v) => v.status === resultEnum.SKIP_FOLLOWER).length
        }
        
        let numOfFollowsAfter
        let numOfFollowers
        try {
            await this.browser.close()
            await this.launch()
            const statusAfter = await this.getStatus(this.user, false)
            numOfFollowsAfter = statusAfter.numOfFollows
            numOfFollowers = statusAfter.numOfFollowers
        } catch (err) {
            logging.error(`failed to get numOfFollowsAfter or numOfFollowers\n${err.stack}`)
        }

        return {
            str: `target count: ${this.count}`
                + `\n(minimumNumOfFollows: ${minimumNumOfFollows})`
                + `\n(skipCount: ${skipCount})`
                + '\n'
                + `\nunfollowed: ${count.success}`
                + `\nskipped (follower: ${count.skipFollower})`
                + `\nnumOfFollows (before): ${numOfFollowsBefore}`
                + `\nnumOfFollows (after): ${numOfFollowsAfter}`
                + `\nnumOfFollowers: ${numOfFollowers}`,
            hasError: this.count !== result.length
        }
    }
    
    async _clickUnfollowButtons(numOfFollowsBefore) {
        logging.info(`minimumNumOfFollows: ${minimumNumOfFollows}`)
        logging.info(`skipCount: ${skipCount}`)
        logging.info(`numOfFollowsBefore: ${numOfFollowsBefore}`)
        logging.info(`target count: ${this.count}`)
        const counts = []
        if (!this.count || !numOfFollowsBefore || numOfFollowsBefore < minimumNumOfFollows) {
            return counts
        }
        
        const unfollowCount = this.count
        logging.info(`unfollowCount: ${unfollowCount}`)
        if (unfollowCount <= 0) {
            return counts
        }
        
        try {
            await this.page.goto(`https://twitter.com/${this.user}/following`)
            
            for (let userNum = skipCount; userNum < skipCount + unfollowCount; userNum += 1) {
                logging.info(`start clicking unfollow button (userNum: ${userNum})`)
                
                // skip my follower
                await this.page.waitForSelector(
                    selectors.accountStatus(userNum),
                    { timeout: 120000 }
                )
                const accountStatus = await this.page.evaluate(
                    (selector) => document.querySelector(selector).innerText,
                    selectors.accountStatus(userNum)
                )
                logging.info(`    L get account status (accountStatus: ${accountStatus})`)
                
                if (accountStatus.includes('フォローされています') || accountStatus.includes('Follows you')) {
                    counts.push({
                        target: userNum,
                        status: resultEnum.SKIP_FOLLOWER
                    })
                    logging.info('    L skipped my follower')
                    continue
                } else if (!accountStatus) {
                    logging.info(`    L accountStatus not found (accountStatus: ${accountStatus})`)
                    return counts
                }

                // click unfollow button
                // wait 1 ~ 5s
                const randMS = Math.floor(1000 + Math.random() * 4 * 1000)
                logging.info(`    L wait for ${randMS}ms`)
                await this.page.waitFor(randMS)

                await this.page.waitForSelector(selectors.followButton(userNum))
                await this.page.click(selectors.followButton(userNum))
                await this.page.waitForSelector(selectors.yesToConfirmation)
                await this.page.click(selectors.yesToConfirmation)
                
                counts.push({
                    target: userNum,
                    status: resultEnum.SUCCEESS
                })
                logging.info('    L succeeded clicking unfollow button')
            }
            return counts
        } catch (e) {
            logging.info(`    L got error\n${e}`)
            return counts
        }
    }
}
