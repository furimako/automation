const Twitter = require('./twitter')
const logging = require('../logging')

const minimumNumOfFollows = 320

module.exports = class Unfollow extends Twitter {
    constructor(numOfCounts) {
        super()
        this.numOfCounts = numOfCounts
    }
    
    async getNumOfFollows() {
        const numOfFollowsSelector = '.ProfileCardStats-stat:nth-child(2) .ProfileCardStats-statValue'
        
        await this.page.goto('https://twitter.com')
        await this.page.waitForSelector(numOfFollowsSelector)
        return this.page.evaluate(selector => document.querySelector(selector).innerText,
            numOfFollowsSelector)
    }
    
    async clickUnfollowButtons() {
        const unfollowButtonSelector = (i, j) => `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(2)`
        
        const counts = []
        let counter = 0

        for (;;) {
            const numOfFollows = await this.getNumOfFollows()
            if (numOfFollows <= minimumNumOfFollows) {
                return counts
            }
            
            try {
                await this.page.goto('https://twitter.com/FullyHatter/following')
            } catch (err) {
                logging.error(`unexpected error has occurred when going to https://twitter.com/FullyHatter/following\n${err}`)
                return counts
            }
            
            for (let i = 1; i <= 3; i += 1) {
                for (let j = 1; j <= 6; j += 1) {
                    try {
                        await this.page.waitForSelector(unfollowButtonSelector(i, j))
                        await this.page.click(unfollowButtonSelector(i, j))
                        counts.push({
                            target: j + (i - 1) * 6,
                            status: 'unfollowed'
                        })
                        counter += 1
                        if (counter === this.numOfCounts) {
                            return counts
                        }
                    } catch (err) {
                        counts.push({
                            target: j + (i - 1) * 6,
                            status: 'failed'
                        })
                        logging.info(`fail to follow\ntarget: ${j + (i - 1) * 6}\n${err}`)
                        
                        if (err.name === 'TimeoutError') {
                            return counts
                        }
                        continue
                    }
                }
            }
        }
    }
}
