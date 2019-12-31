const { logging } = require('node-utils')
const Base = require('./base')
const selectors = require('./selectors')

const minimumNumOfFollows = 70
const numOfRetry = 3

module.exports = class Unfollow extends Base {
    constructor(count) {
        super()
        this.count = count
    }
    
    async execute() {
        let numOfFollowsBefore
        for (let i = 1; i <= numOfRetry; i += 1) {
            try {
                await this.login()
                numOfFollowsBefore = await this.getNumOfFollows()
                if (!numOfFollowsBefore) {
                    return 'fail to get numOfFollowsBefore'
                }
                break
            } catch (err) {
                logging.info(`failed to execute in unfollow.js (${i}/${numOfRetry})\n${err.stack}`)
                if (i === numOfRetry) {
                    throw err
                }
            }
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
            for (let i = 1; i <= numOfRetry; i += 1) {
                try {
                    if (i !== 1) {
                        await this.browser.close()
                        await this.login()
                    }
                    await this.page.goto('https://twitter.com/furimako/following')
                    break
                } catch (err) {
                    logging.error(`fail to goto (${i}/${numOfRetry})\n${err.stack}`)
                    if (i === numOfRetry) {
                        return counts
                    }
                }
            }
            
            for (let targetUser = 1; targetUser <= 100; targetUser += 1) {
                if (unfollowCount <= counts.length) {
                    return counts
                }
                
                // get userType
                let userType
                for (let i = 1; i <= numOfRetry; i += 1) {
                    try {
                        await this.page.waitForSelector(
                            selectors.protectedIcon(i),
                            { timeout: 5000 }
                        )
                        userType = await this.page.evaluate(
                            (selector) => document.querySelector(selector).innerHTML,
                            selectors.protectedIcon(i)
                        )
                        break
                    } catch (err) {
                        logging.error(`failed to get userType (${i}/${numOfRetry})\n${err.stack}`)
                        if (i === numOfRetry) {
                            return counts
                        }
                    }
                }
                
                // click unfollow button
                if (!userType) {
                    for (let i = 1; i <= numOfRetry; i += 1) {
                        try {
                            await this.page.waitForSelector(selectors.followButton(targetUser))
                            await this.page.click(selectors.followButton(targetUser))
                            await this.page.waitForSelector(selectors.yesToConfirmation)
                            await this.page.click(selectors.yesToConfirmation)
                            break
                        } catch (err) {
                            logging.error(`fail to click unfollow button (target: ${targetUser} ${i}/${numOfRetry})\n${err.stack}`)
                            if (i === numOfRetry) {
                                return counts
                            }
                        }
                    }
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
            for (let i = 1; i <= numOfRetry; i += 1) {
                try {
                    await this.browser.close()
                    await this.login()
                    break
                } catch (err) {
                    logging.error(`fail to relogin (${i}/${numOfRetry})\n${err.stack}`)
                    if (i === numOfRetry) {
                        return counts
                    }
                }
            }
        }
    }
}
