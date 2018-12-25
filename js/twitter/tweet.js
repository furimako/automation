const fs = require('fs')
const Page = require('./page')
const logging = require('./../logging')

const param = JSON.parse(fs.readFileSync('./js/twitter/twitter.json', 'utf8'))

module.exports = async function tweet() {
    return new Promise(async (resolve) => {
        const page = new PageForTweet()
        await page.init(process.env.NODE_ENV)
        
        // Login screen
        await page.login()
        await logging.info('login finished')
        
        // tweet
        const result = await page.tweet()
        
        // close browser
        if (process.env.NODE_ENV === 'production') {
            await page.close()
        }
        resolve(result)
    })
}


class PageForTweet extends Page {
    async tweet() {
        return new Promise(async (resolve, reject) => {
            const tweetButtonSelector = '#global-new-tweet-button'
            await this.page.waitForSelector(tweetButtonSelector)
            await this.page.click(tweetButtonSelector)
            
            const tweetBoxSelector = '#Tweetstorm-tweet-box-0 [name=tweet]'
            await this.page.waitForSelector(tweetBoxSelector)
            await this.page.evaluate((selector) => {
                if (document.querySelectorAll(selector).length !== 1) {
                    // should not be here
                    reject(new Error('some change has been made in Twitter'))
                }
            }, tweetBoxSelector)
            const tweetText = await getTweetText()
            await this.page.type(tweetBoxSelector, tweetText)
            
            const executeButtonSelector = '#Tweetstorm-tweet-box-0 .SendTweetsButton'
            await this.page.evaluate((selector) => {
                if (document.querySelectorAll(selector).length !== 1) {
                    // should not be here
                    Error('some change has been made in Twitter')
                }
            }, executeButtonSelector)
            await this.page.click(executeButtonSelector)
            
            resolve(tweetText)
        })
    }
}

function getTweetText() {
    return new Promise((resolve) => {
        const date = new Date()
        // Start Tweet on 2018/12/25
        resolve(param.tweet[(date.getUTCDate() - 3) % param.tweet.length])
    })
}
