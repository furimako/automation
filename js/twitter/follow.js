const fs = require('fs')
const Page = require('./page')
const logging = require('./../logging')

const param = JSON.parse(fs.readFileSync('./js/twitter/twitter.json', 'utf8'))

module.exports = function follow() {
    return new Promise(async (resolve) => {
        await logging.info(`numOfFollows: ${param.numOfFollows}`)
        const page = new PageForFollow()
        await page.init(process.env.NODE_ENV)
        
        // Login screen
        await page.login()
        await logging.info('login finished')
        
        // Get target URLs
        const keyword = await getKeyword()
        const targetURLs = await page.getTargetURLsWithKeyword(keyword)
        await logging.info('acquired all target URLs')
        await logging.info(`target URLs:\n${targetURLs.join('\n')}`)
        
        // Follow
        const result = {
            keyword,
            count: await page.executeFollow(targetURLs)
        }
        
        if (process.env.NODE_ENV === 'production') {
            await page.close()
        }
        resolve(result)
    })
}


class PageForFollow extends Page {
    async getTargetURLsWithKeyword(keyword) {
        await this.page.goto(`https://twitter.com/search?f=users&vertical=default&q=${keyword}&src=typd`)
        
        const linkSelector = '.GridTimeline-items > .Grid > .Grid-cell .fullname'
        await this.page.waitForSelector(linkSelector)
        
        return this.page.evaluate((selector) => {
            const elementList = document.querySelectorAll(selector)
            return Array.from(elementList, element => element.href)
        }, linkSelector)
    }
    
    executeFollow(targetURLs) {
        return new Promise(async (resolve, reject) => {
            const followButtonSelector = (i, j) => `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(1)`
            const result = {}
            
            let followCount = 0
            for (let userID = 1; userID <= 18; userID += 1) {
                result[targetURLs[userID]] = 0
                await this.page.goto(`${targetURLs[userID]}/followers`)
                
                for (let i = 1; i <= 3; i += 1) {
                    for (let j = 1; j <= 6; j += 1) {
                        await this.page.waitForSelector(followButtonSelector(i, j))
                        await this.page.evaluate((selector) => {
                            if (document.querySelectorAll(selector).length !== 1) {
                                // should not be here
                                reject(new Error('some change has been made in Twitter'))
                            }
                        }, followButtonSelector(i, j))
                        
                        try {
                            await this.page.click(followButtonSelector(i, j))
                            result[targetURLs[userID]] += 1
                            followCount += 1
                            await logging.info(`followed (userID: ${userID}, count: ${followCount})`)
                            
                            if (followCount === param.numOfFollows) {
                                resolve(result)
                                return
                            }
                        } catch (err) {
                            await logging.info('the account might be already followed')
                            continue
                        }
                    }
                }
            }
            reject(new Error('numOfFollows might be too large'))
        })
    }
}

function getKeyword() {
    return new Promise((resolve) => {
        const date = new Date()
        // Start Tweet on 2018/12/25
        resolve(param.keywords[date.getUTCDate() % param.keywords.length])
    })
}
