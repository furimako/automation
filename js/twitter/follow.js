const Twitter = require('./twitter')
const logging = require('../logging')

module.exports = class Follow extends Twitter {
    constructor(env) {
        super(env)
        this.numOfFollows = 50
        this.keywords = [
            '生きる',
            '死ぬ',
            '幸せ',
            '思想',
            '哲学',
            '読書',
            '映画',
            '学生',
            'プログラミング',
            '理系',
            '数学',
            '物理'
        ]
    }
    
    keyword(index = this.index()) {
        return this.keywords[index]
    }
    
    index() {
        const baseDate = new Date('2019-02-08T00:00:00+09:00')
        const diffDate = Math.floor((new Date() - baseDate) / (1000 * 60 * 60 * 24))
        return diffDate % this.keywords.length
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
            await this.page.goto(`${targetURL}/followers`)
            
            for (let i = 1; i <= 3; i += 1) {
                for (let j = 1; j <= 6; j += 1) {
                    try {
                        await this.page.waitForSelector(followButtonSelector(i, j))
                        await this.page.evaluate((selector) => {
                            if (document.querySelectorAll(selector).length !== 1) {
                                // should not be here
                                throw new Error('some change has been made in Twitter')
                            }
                        }, followButtonSelector(i, j))
                        
                        await this.page.click(followButtonSelector(i, j))
                        counts[targetURL].success += 1
                        counter += 1
                        if (counter === this.numOfFollows) {
                            return counts
                        }
                    } catch (err) {
                        counts[targetURL].fail += 1
                        logging.info(`fail to follow\n${err}`)
                        continue
                    }
                }
            }
        }
        return counts
    }
}
