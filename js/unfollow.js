const Base = require('./base')
const logging = require('./utils/logging')

const minimumNumOfFollows = 90

module.exports = class Unfollow extends Base {
    constructor(count) {
        super()
        this.count = count
    }
    
    async execute() {
        logging.info(`minimumNumOfFollows: ${minimumNumOfFollows}`)
        
        const numOfFollowsBefore = await this.getNumOfFollows()
        logging.info(`numOfFollowsBefore: ${numOfFollowsBefore}`)
        
        if (!numOfFollowsBefore) {
            return 'fail to get numOfFollowsBefore'
        }
        
        const result = await this.clickUnfollowButtons(numOfFollowsBefore)
        const clickCount = result.length
        const unfollowedCount = result.filter(v => v.status === 'unfollowed').length
        logging.info(`clickCount: ${clickCount}`)
        logging.info(`unfollowedCount: ${unfollowedCount}`)
        
        const numOfFollowsAfter = await this.getNumOfFollows()
        logging.info(`numOfFollowsAfter: ${numOfFollowsAfter}`)
        
        return `follow count (before): ${numOfFollowsBefore}`
            + `\nfollow count (after): ${numOfFollowsAfter}`
            + '\n'
            + `\ncount (target): ${this.count}`
            + `\ncount (unfollow/click): ${unfollowedCount}/${clickCount}`
            + `\n(minimumNumOfFollows: ${minimumNumOfFollows})`
    }
    
    async clickUnfollowButtons(numOfFollowsBefore) {
        let unfollowCount
        if (this.count + minimumNumOfFollows > numOfFollowsBefore) {
            // when too many unfollow count
            unfollowCount = numOfFollowsBefore - minimumNumOfFollows
        } else {
            unfollowCount = this.count
        }
        
        const counts = []
        if (unfollowCount <= 0) {
            return counts
        }
        
        try {
            await this.page.goto('https://twitter.com/FullyHatter/following')
        } catch (err) {
            logging.error(`unexpected error has occurred when going to https://twitter.com/FullyHatter/following\n${err}`)
            return counts
        }
        
        const unfollowButtonSelector = (i, j) => `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(2)`
        let i = 0
        for (;;) {
            i += 1
            for (let j = 1; j <= 6; j += 1) {
                if (unfollowCount <= counts.filter(v => v.status === 'unfollowed').length) {
                    return counts
                }
                
                if (counts.filter(v => v.status === 'failed').length >= 3) {
                    return counts
                }
                
                try {
                    await this.page.waitForSelector(unfollowButtonSelector(i, j))
                    await this.page.click(unfollowButtonSelector(i, j))
                    counts.push({
                        target: j + (i - 1) * 6,
                        status: 'unfollowed'
                    })
                } catch (err) {
                    counts.push({
                        target: j + (i - 1) * 6,
                        status: 'failed'
                    })
                    logging.error(`fail to unfollow\ntarget: ${j + (i - 1) * 6}\n${err}`)
                    continue
                }
            }
        }
    }
}
