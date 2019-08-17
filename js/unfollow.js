const { logging } = require('node-utils')
const Base = require('./base')
const selectors = require('./selectors')

const minimumNumOfFollows = 70

module.exports = class Unfollow extends Base {
    constructor(count) {
        super()
        this.count = count
    }
    
    async execute() {
        await this.login()
        const numOfFollowsBefore = await this.getNumOfFollows()
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        const result = await this.clickUnfollowButtons(numOfFollowsBefore)
        const unfollowedCount = result.filter(v => v.status === 'unfollowed').length
        const skippedCount = result.filter(v => v.status === 'skipped').length
        
        await this.relogin()
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
        
        logging.info(`start clicking unfollow button (unfollowCount: ${unfollowCount})`)
        
        if (unfollowCount <= 0) {
            return counts
        }
        
        for (;;) {
            try {
                await this.page.goto('https://twitter.com/furimako/following')
            } catch (err) {
                logging.error(`unexpected error has occurred in clickUnfollowButtons (goto)\n${err}`)
                return counts
            }

            for (let i = 1; i <= 100; i += 1) {
                if (unfollowCount <= counts.length) {
                    return counts
                }
                
                // get userType
                let userType
                try {
                    await this.page.waitForSelector(selectors.protectedIcon(i), { timeout: 5000 })
                    userType = await this.page.evaluate(
                        selector => document.querySelector(selector).innerHTML,
                        selectors.protectedIcon(i)
                    )
                } catch (err) {
                    logging.error(`unexpected error has occurred in clickUnfollowButtons (get userType)\n${err}`)
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
                        logging.info(`succeeded clicking unfollow button (target: ${i}, userType: ${userType})`)
                    } else {
                        counts.push({
                            target: i,
                            status: 'skipped'
                        })
                        logging.info(`skipped clicking unfollow button (target: ${i}, userType: ${userType})`)
                    }
                } catch (err) {
                    logging.error(`fail to unfollow\ntarget: ${i}\n${err}`)
                    return counts
                }
            }
            
            try {
                await this.relogin()
            } catch (err) {
                logging.error(`unexpected error has occurred in clickUnfollowButtons (relogin)\n${err}`)
                return counts
            }
        }
    }
}
