const Twitter = require('./twitter')
const logging = require('../logging')

module.exports = class Follow extends Twitter {
    constructor(numOfCounts) {
        super()
        this.numOfCounts = numOfCounts
    }
    
    async getTargetURLsWithKeyword(keyword = this.keyword()) {
        await this.page.goto(`https://twitter.com/search?f=users&vertical=default&q=${keyword}&src=typd`)
        
        const linkSelector = '.GridTimeline-items > .Grid > .Grid-cell .fullname'
        await this.page.waitForSelector(linkSelector)
        
        return this.page.evaluate((selector) => {
            const elementList = document.querySelectorAll(selector)
            return Array.from(elementList, element => element.href)
        }, linkSelector)
    }
    
    async clickFollowButtons(targetURLs) {
        const followButtonSelector = (i, j) => `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(1)`
        const counts = {}
        let counter = 0
        for (let userID = 0; userID < 18; userID += 1) {
            const targetURL = targetURLs[userID]
            counts[targetURL] = { success: 0, fail: 0 }
            try {
                await this.page.goto(`${targetURL}/followers`)
            } catch (err) {
                logging.error(`unexpected error has occurred when going to ${targetURL}/followers\n${err}`)
                continue
            }
            
            let skipFlag = false
            for (let i = 1; i <= 3; i += 1) {
                for (let j = 1; j <= 6; j += 1) {
                    try {
                        await this.page.waitForSelector(followButtonSelector(i, j))
                        await this.page.click(followButtonSelector(i, j))
                        counts[targetURL].success += 1
                        counter += 1
                        if (counter === this.numOfCounts) {
                            return counts
                        }
                    } catch (err) {
                        counts[targetURL].fail += 1
                        logging.info(`fail to follow\ntargetURL: ${targetURL}\ntarget: ${j + (i - 1) * 6}\n${err}`)
                        
                        if (err.name === 'TimeoutError') {
                            skipFlag = true
                            break
                        }
                        continue
                    }
                }
                
                if (skipFlag) {
                    break
                }
            }
        }
        return counts
    }
}
