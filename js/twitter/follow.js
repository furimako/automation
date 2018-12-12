const fs = require('fs')
const puppeteer = require('puppeteer')
const logging = require('./../logging')
const CONFIG = JSON.parse( fs.readFileSync('./config/twitter-config.json', 'utf8') )
const PARAM = JSON.parse( fs.readFileSync('./js/twitter/twitter.json', 'utf8') )

module.exports = async function follow() {
    await logging.info('the process started')
    await logging.info(`NUM_OF_USERS: ${PARAM.numOfUsers}`)
    await logging.info(`NUM_OF_FOLLOWS_PER_USER: ${PARAM.numOfFollowsPerUser}`)
    const browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        slowMo: 10
    })
    const page = await browser.newPage()
    
    // Login screen
    await page.goto('https://twitter.com/login')
    await page.type('input.js-username-field', CONFIG.address)
    await page.type('input.js-password-field', CONFIG.password)
    await page.click('button[type="submit"]')
    await logging.info('login finished')
    
    // Get target URLs
    await page.goto('https://twitter.com/search?f=users&vertical=default&q=' + PARAM.keyword + '&src=typd')
    const LINK_SELECTOR = '.GridTimeline-items > .Grid > .Grid-cell .fullname'
    await page.waitForSelector(LINK_SELECTOR)
    const targetURLs = await page.evaluate(selector => {
        const elementList = document.querySelectorAll(selector)
        return Array.from(elementList, element => element.href)
    }, LINK_SELECTOR)
    await logging.info('acquired all target URLs')
    await logging.info(`target URLs:\n${targetURLs.join('\n')}`)
    
    // Follow
    if (targetURLs.length < PARAM.numOfUsers) {
        // should not be here
        process.exit(1)
    }
    const followButtonSelector = (i, j) => {
        return `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(1)`
    }
    for (let userID = 1; userID <= PARAM.numOfUsers; userID++) {
        await page.goto(targetURLs[userID] + '/followers')
        let followCount = 0
        let completeFlag = false
        for (let i = 1; i <= 3; i++) {
            for (let j = 1; j <= 6; j++) {
                followCount++
                if (followCount > PARAM.numOfFollowsPerUser) {
                    completeFlag = true
                    break
                }
                await page.waitForSelector( followButtonSelector(i, j) )
                await page.evaluate(selector => {
                    if (document.querySelectorAll(selector).length !== 1) {
                        // should not be here
                        process.exit(1)
                    }
                    return
                }, followButtonSelector(i, j))
                
                await page.waitFor( followButtonSelector(i, j) )
                await page.click( followButtonSelector(i, j) )
                await logging.info(`followed (user ID: ${userID}, follow count: ${followCount})`)
            }
            if (completeFlag) {
                break
            }
        }
    }
    
    await logging.info('the process finished')
    if (process.env.NODE_ENV === 'production') {
        await browser.close()
    }
    return
}
