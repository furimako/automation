
module.exports = {
    // Login Page
    loginName: 'input.js-username-field',
    loginPassword: 'input.js-password-field',
    loginButton: 'button[type="submit"]',
    
    // My Page (status)
    status: type => `a[href="/furimako/${type}"] > span:nth-child(1) > span`,
    
    // Search Page (account)
    accountsList: 'div.css-1dbjc4n > div > div.css-1dbjc4n.r-my5ep6.r-qklmqi.r-1adg3ll > div[role="button"] > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > a',
    
    // Follow or Follower List
    protectedIcon: i => `div.css-1dbjc4n > div:nth-child(${i}) > div.css-1dbjc4n.r-my5ep6.r-qklmqi.r-1adg3ll > div[role="button"] > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(1) > div:nth-child(2)`,
    followButton: i => `div.css-1dbjc4n > div:nth-child(${i}) > div.css-1dbjc4n.r-my5ep6.r-qklmqi.r-1adg3ll > div[role="button"] > div > div:nth-child(2) > div:nth-child(1) > div:nth-child(2) > div[role="button"]`,
    yesToConfirmation: 'div[role="button"].css-18t94o4.css-1dbjc4n.r-urgr8i.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-16y2uox.r-1w2pmg.r-1vuscfd.r-1dhvaqw.r-1fneopy.r-o7ynqc.r-6416eg.r-lrvibr'
}
