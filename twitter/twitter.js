const fs = require('fs')
const puppeteer = require('puppeteer')
const PASSWORD = JSON.parse(fs.readFileSync('./twitter/password.json', 'utf8'))

async function test() {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10
    })
    const page = await browser.newPage()
    await page.goto('https://twitter.com/login')
    await page.type('input.js-username-field', PASSWORD.address)
    await page.type('input.js-password-field', PASSWORD.password)
    await page.click('button[type="submit"]')
    await page.goto('https://twitter.com/FullyHatter/following')
    // await browser.close()
}

test()
