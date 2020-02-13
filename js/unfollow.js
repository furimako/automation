const { logging } = require('node-utils')
const Base = require('./base')
const selectors = require('./selectors')

const minimumNumOfFollows = 70

module.exports = class Unfollow extends Base {
    async execute() {
        const numOfFollowsBefore = await this.operate(async () => {
            await this.login()
            return this.getNumOfFollows()
        })
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        // start to click unfollow buttons
        const result = await this._clickUnfollowButtons(numOfFollowsBefore)
        
        const unfollowedCount = result.filter((v) => v.status === 'unfollowed').length
        const skippedCount = result.filter((v) => v.status === 'skipped').length
        
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
            + `\n(minimumNumOfFollows: ${minimumNumOfFollows})`
            + '\n'
            + `\nunfollowed: ${unfollowedCount}`
            + `\nskipped: ${skippedCount}`
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
        
        logging.info(`start clicking unfollow button (unfollowCount: ${unfollowCount})`)
        
        if (unfollowCount <= 0) {
            return counts
        }
        
        for (;;) {
            await this.operate(async () => {
                await this.page.goto(`https://twitter.com/${this.user}/following`)
            })
            
            for (let targetUser = 1; targetUser <= 100; targetUser += 1) {
                if (unfollowCount <= counts.length) {
                    return counts
                }
                
                // get userType
                const userType = await this.operate(async () => {
                    await this.page.waitForSelector(selectors.protectedIcon(targetUser))
                    return this.page.evaluate(
                        (selector) => document.querySelector(selector).innerHTML,
                        selectors.protectedIcon(targetUser)
                    )
                })
                
                // click unfollow button
                if (!userType) {
                    await this.operate(async () => {
                        await this.page.waitForSelector(selectors.followButton(targetUser))
                        await this.page.click(selectors.followButton(targetUser))
                        await this.page.waitForSelector(selectors.yesToConfirmation)
                        await this.page.click(selectors.yesToConfirmation)
                    })
                    counts.push({
                        target: targetUser,
                        status: 'unfollowed'
                    })
                    logging.info(`succeeded clicking unfollow button (target: ${targetUser}, userType: ${userType})`)
                } else {
                    counts.push({
                        target: targetUser,
                        status: 'skipped'
                    })
                    logging.info(`skipped clicking unfollow button (target: ${targetUser}, userType: ${userType})`)
                }
            }
            
            await this.operate(async () => {
                await this.browser.close()
                await this.login()
            })
        }
    }
}
