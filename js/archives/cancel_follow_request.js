const puppeteer = require('puppeteer')

execute()

async function execute() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 20
    })
    const page = await browser.newPage()
    await page.goto('https://requestcheck.followmanager.net/')
    
    await page.waitForSelector('#login .uk-button')
    await page.click('#login .uk-button')

    await page.waitForSelector('input#username_or_email')
    await page.type('input#username_or_email', 'furimako@gmail.com')

    await page.waitForSelector('input#password')
    await page.type('input#password', '09080202')

    await page.waitForSelector('input#allow')
    await page.click('input#allow')
    await page.waitFor(5000)
    
    for (let pageNo = 2; pageNo <= 2; pageNo += 1) {
        for (let i = 1; i <= 3; i += 1) {
            await page.goto(`https://requestcheck.followmanager.net/user/protects/?mode=detail&page=${pageNo}`)
            try {
                await page.waitForSelector(
                    `.uk-grid > .uk-width-medium-1-2:nth-child(${i}) .uk-text-bold a`,
                    { timeout: 5000 }
                )
            } catch (err) {
                console.log(`got error\n${err}`)
                continue
            }
            
            const userURL1 = await page.evaluate(
                selector => document.querySelector(selector).href,
                `.uk-grid > .uk-width-medium-1-2:nth-child(${i}) .uk-text-bold a`
            )
            await page.goto(userURL1)

            await page.waitForSelector('a.fn.url.alternate-context')
            const userURL2 = await page.evaluate(
                selector => document.querySelector(selector).href,
                'a.fn.url.alternate-context'
            )
            await page.goto(userURL2)
            
            await page.waitForSelector('.ProfileNav-list .user-actions-follow-button > .EdgeButton:nth-child(6)')
            try {
                await page.click('.ProfileNav-list .user-actions-follow-button > .EdgeButton:nth-child(6)')
            } catch (err) {
                console.log(err)
            }
        }
    }
}
