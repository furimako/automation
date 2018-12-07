const fs = require('fs')
const puppeteer = require('puppeteer')
const PASSWORD = JSON.parse( fs.readFileSync('./twitter/password.json', 'utf8') )
const KEYWORD = JSON.parse( fs.readFileSync('./twitter/keyword.json', 'utf8') )
const NUM_OF_USERS = 2  // 1 ~ 18
const NUM_OF_FOLLOWS_PER_USER = 2  // 1*1 ~ 18*18

async function follow() {
    await console.log('--- the process started ---')
    await console.log(`NUM_OF_USERS: ${NUM_OF_USERS}`)
    await console.log(`NUM_OF_FOLLOWS_PER_USER: ${NUM_OF_FOLLOWS_PER_USER}`)
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10
    })
    const page = await browser.newPage()
    
    // Login screen
    await page.goto('https://twitter.com/login')
    await page.type('input.js-username-field', PASSWORD.address)
    await page.type('input.js-password-field', PASSWORD.password)
    await page.click('button[type="submit"]')
    await console.log('[Login] finished')
    
    // Get target URLs
    await page.goto('https://twitter.com/search?f=users&vertical=default&q=' + KEYWORD[0] + '&src=typd')
    const LINK_SELECTOR = '.GridTimeline-items > .Grid > .Grid-cell .fullname'
    await page.waitForSelector(LINK_SELECTOR)
    const targetURLs = await page.evaluate(selector => {
        const elementList = document.querySelectorAll(selector)
        return Array.from(elementList, element => element.href)
    }, LINK_SELECTOR)
    await console.log('[Get target URL] finished')
    await console.log(`target URLs:\n${targetURLs.join('\n')}`)
    
    // Follow
    if (targetURLs.length < NUM_OF_USERS) {
        // should not be here
        process.exit(1)
    }
    const followButtonSelector = (i, j) => {
        return `.GridTimeline-items > .Grid:nth-child(${i}) > .Grid-cell:nth-child(${j}) .EdgeButton:nth-child(1)`
    }
    for (let userID = 1; userID <= NUM_OF_USERS; userID++) {
        await page.goto(targetURLs[userID] + '/followers')
        let followCount = 0
        let completeFlag = false
        for (let i = 1; i <= 3; i++) {
            for (let j = 1; j <= 6; j++) {
                followCount++
                if (followCount > NUM_OF_FOLLOWS_PER_USER) {
                    await console.log(`[follow] finished (user ID: ${userID})`)
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
                await console.log(`follow (user ID: ${userID}, follow count: ${followCount})`)
            }
            if (completeFlag) {
                break
            }
        }
    }
    
    await console.log('--- the process finished ---')
    // await browser.close()
    return
}

follow()
