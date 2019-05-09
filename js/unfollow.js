const Base = require('./base')
const logging = require('./utils/logging')
const selectors = require('./selectors')

const minimumNumOfFollows = 70

module.exports = class Unfollow extends Base {
    constructor(count) {
        super()
        this.count = count
    }
    
    async execute() {
        const numOfFollowsBefore = await this.getNumOfFollows()
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        const result = await this.clickUnfollowButtons(numOfFollowsBefore)
        const unfollowedCount = result.filter(v => v.status === 'unfollowed').length
        const skippedCount = result.filter(v => v.status === 'skipped').length
        
        await this.browser.close()
        await this.init()
        const numOfFollowsAfter = await this.getNumOfFollows()
        const numOfFollowers = await this.getNumOfFollowers()

        return `target count: ${this.count}`
            + `\n(minimumNumOfFollows: ${minimumNumOfFollows})`
            + '\n'
            + `\nunfollowed: ${unfollowedCount}`
            + `\nskipped: ${skippedCount}`
            + `\nnnumOfFollows (before): ${numOfFollowsBefore}`
            + `\nnnumOfFollows (after): ${numOfFollowsAfter}`
            + `\nnumOfFollowers: ${numOfFollowers}`
    }
    
    async clickUnfollowButtons(numOfFollowsBefore) {
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
        
        if (unfollowCount <= 0) {
            return counts
        }
        
        try {
            await this.page.goto('https://twitter.com/FullyHatter/following')
        } catch (err) {
            logging.error(`unexpected error has occurred when going to https://twitter.com/FullyHatter/following\n${err}`)
            return counts
        }
        
        let i = 0
        for (;;) {
            i += 1
            if (unfollowCount <= counts.length) {
                return counts
            }
            
            // get userType
            let userType
            try {
                await this.page.waitForSelector(
                    selectors.protectedIcon(i),
                    { timeout: 5000 }
                )
                userType = await this.page.evaluate(
                    selector => document.querySelector(selector).innerHTML,
                    selectors.protectedIcon(i)
                )
            } catch (err) {
                logging.error(`unexpected error has occurred in clickFollowButtons\n${err}`)
                return counts
            }

            // click unfollow button
            try {
                if (!userType) {
                    await this.page.waitForSelector(selectors.followButton(i))
                    await this.page.click(selectors.followButton(i))
                    await this.page.waitForSelector(selectors.yesToConfirmation)
                    await this.page.click(selectors.yesToConfirmation)
                    counts.push({
                        target: i,
                        status: 'unfollowed'
                    })
                } else {
                    counts.push({
                        target: i,
                        status: 'skipped'
                    })
                }
            } catch (err) {
                logging.error(`fail to unfollow\ntarget: ${i}\n${err}`)
                return counts
            }
        }
    }
}
