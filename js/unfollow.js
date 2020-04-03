const { logging } = require('node-utils')
const Base = require('./base')
const selectors = require('./selectors')

const minimumNumOfFollows = 70
const resultEnum = {
    SUCCEESS: 'SUCCEESS',
    SKIP_FOLLOWER: 'SKIP_FOLLOWER',
    SKIP_PROTECTED: 'SKIP_PROTECTED'
}

module.exports = class Unfollow extends Base {
    async execute() {
        await this.launch()
        const numOfFollowsBefore = await this.getNumOfFollows()
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        // start to click unfollow buttons
        await this.login(false)
        const result = await this._clickUnfollowButtons(numOfFollowsBefore)
        const count = {
            success: result.filter((v) => v.status === resultEnum.SUCCEESS).length,
            skipFollower: result.filter((v) => v.status === resultEnum.SKIP_FOLLOWER).length,
            skipProtected: result.filter((v) => v.status === resultEnum.SKIP_PROTECTED).length
        }
        
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
            + `\n(minimumNumOfFollows: ${minimumNumOfFollows})`
            + '\n'
            + `\nunfollowed: ${count.success}`
            + `\nskipped (follower: ${count.skipFollower}, protected: ${count.skipProtected})`
            + `\nnnumOfFollows (before): ${numOfFollowsBefore}`
            + `\nnnumOfFollows (after): ${numOfFollowsAfter}`
            + `\nnumOfFollowers: ${numOfFollowers}`
    }
    
    async _clickUnfollowButtons(numOfFollowsBefore) {
        logging.info(`minimumNumOfFollows: ${minimumNumOfFollows}`)
        logging.info(`numOfFollowsBefore: ${numOfFollowsBefore}`)
        logging.info(`target count: ${this.count}`)
        const counts = []
        if (!this.count || !numOfFollowsBefore || numOfFollowsBefore < 50) {
            return counts
        }
        
        let unfollowCount
        if (this.count + minimumNumOfFollows > numOfFollowsBefore) {
            // when too many unfollow count
            unfollowCount = numOfFollowsBefore - minimumNumOfFollows
        } else {
            unfollowCount = this.count
        }
        logging.info(`unfollowCount: ${unfollowCount}`)
        
        if (unfollowCount <= 0) {
            return counts
        }
        
        for (;;) {
            await this.page.goto(`https://twitter.com/${this.user}/following`)
            
            for (let targetUser = 1; targetUser <= 100; targetUser += 1) {
                logging.info(`start clicking unfollow button (targetUser: ${targetUser})`)
                if (unfollowCount <= counts.length) {
                    return counts
                }
                
                // get follower status
                await this.page.waitForSelector(selectors.accountStatus(targetUser))
                const accountStatus = await this.page.evaluate(
                    (selector) => document.querySelector(selector).innerText,
                    selectors.accountStatus(targetUser)
                )
                logging.info(`    L get account status (accountStatus: ${accountStatus})`)
                
                // get userType (for protected status check)
                await this.page.waitForSelector(selectors.protectedIcon(targetUser))
                const userType = await this.page.evaluate(
                    (selector) => document.querySelector(selector).innerText,
                    selectors.protectedIcon(targetUser)
                )
                logging.info(`    L get userType (userType: ${userType})`)
                
                // click unfollow button
                if (accountStatus.includes('フォローされています') || accountStatus.includes('Follows you')) {
                    counts.push({
                        target: targetUser,
                        status: resultEnum.SKIP_FOLLOWER
                    })
                    logging.info('    L skipped my follower')
                } else if (userType) {
                    counts.push({
                        target: targetUser,
                        status: resultEnum.SKIP_PROTECTED
                    })
                    logging.info('    L skipped protected account')
                } else {
                    await this.page.waitForSelector(selectors.followButton(targetUser))
                    await this.page.click(selectors.followButton(targetUser))
                    await this.page.waitForSelector(selectors.yesToConfirmation)
                    await this.page.click(selectors.yesToConfirmation)
                    
                    counts.push({
                        target: targetUser,
                        status: resultEnum.SUCCEESS
                    })
                    logging.info('    L succeeded clicking unfollow button')
                }
            }
            
            await this.browser.close()
            await this.login()
        }
    }
}
