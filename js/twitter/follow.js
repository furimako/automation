const fs = require('fs')
const puppeteer = require('puppeteer')
const logging = require('./../logging')

const config = JSON.parse(fs.readFileSync('./configs/twitter-config.json', 'utf8'))
const param = JSON.parse(fs.readFileSync('./js/twitter/twitter.json', 'utf8'))

module.exports = function follow() {
    return new Promise(async (resolve) => {
        await logging.info('the process started')
        await logging.info(`numOfFollows: ${param.numOfFollows}`)
        
        const browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'production',
            slowMo: 10
        })
        const page = await browser.newPage()
        
        // Login screen
        await login(page)
        await logging.info('login finished')
        
        // Get target URLs
        const targetURLs = await getTargetURLs(page)
        await logging.info('acquired all target URLs')
        await logging.info(`target URLs:\n${targetURLs.join('\n')}`)
        
        // Follow
        const result = await executeFollow(page, targetURLs)
        await logging.info('follow finished')
        
        if (process.env.NODE_ENV === 'production') {
            await browser.close()
        }
        resolve(result)
    })
}


async function login(page) {
    await page.goto('https://twitter.com/login')
    await page.type('input.js-username-field', config.address)
    await page.type('input.js-password-field', config.password)
    await page.click('button[type="submit"]')
}


async function getTargetURLs(page) {
    await page.goto(`https://twitter.com/search?f=users&vertical=default&q=${param.keyword}&src=typd`)
    
    const linkSelector = '.GridTimeline-items > .Grid > .Grid-cell .fullname'
    await page.waitForSelector(linkSelector)
    
    return page.evaluate((selector) => {
        const elementList = document.querySelectorAll(selector)
        return Array.from(elementList, element => element.href)
    }, linkSelector)
}


function executeFollow(page, targetURLs) {
    return new Promise(async (resolve, reject) => {
        const followButtonSelector = (i, j) => `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(1)`
        const result = {}
        
        let followCount = 0
        for (let userID = 1; userID <= 18; userID += 1) {
            result[targetURLs[userID]] = 0
            await page.goto(`${targetURLs[userID]}/followers`)
            
            for (let i = 1; i <= 3; i += 1) {
                for (let j = 1; j <= 6; j += 1) {
                    await page.waitForSelector(followButtonSelector(i, j))
                    await page.evaluate((selector) => {
                        if (document.querySelectorAll(selector).length !== 1) {
                            // should not be here
                            reject(new Error('some change has been made in Twitter'))
                        }
                    }, followButtonSelector(i, j))
                    
                    await page.waitFor(followButtonSelector(i, j))
                    try {
                        await page.click(followButtonSelector(i, j))
                    } catch (err) {
                        await logging.info('the account might be already followed')
                        continue
                    }
                    
                    result[targetURLs[userID]] += 1
                    followCount += 1
                    if (followCount === param.numOfFollows) {
                        resolve(result)
                        return
                    }
                }
            }
        }
        reject(new Error('numOfFollows might be too large'))
    })
}
