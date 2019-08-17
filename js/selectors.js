
function followerListBase(i) {
    return `#react-root > div > div > div > main > div > div:nth-child(2) > div > div > div > div:nth-child(2) > section > div > div > div > div:nth-child(${i}) > div > div > div > div:nth-child(2) > div:nth-child(1)`
}

module.exports = {
    // Login Page
    loginName: 'input.js-username-field',
    loginPassword: 'input.js-password-field',
    loginButton: 'button[type="submit"]',
    
    // My Page (status)
    status: type => `a[href="/furimako/${type}"] > span:nth-child(1) > span`,
    
    // Confirmation
    yesToConfirmation: 'div[role="button"].css-18t94o4.css-1dbjc4n.r-urgr8i.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-16y2uox.r-1w2pmg.r-1vuscfd.r-1dhvaqw.r-1fneopy.r-o7ynqc.r-6416eg.r-lrvibr',
    
    // User List
    accountsList: '#react-root > div > div > div > main > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div > section > div > div > div > div > div > div > div > div > div > div > a',
    
    // Follower List
    userName: i => `${followerListBase(i)} > div:nth-child(1) > a > div > div:nth-child(2) > div > span`,
    protectedIcon: i => `${followerListBase(i)} > div:nth-child(1) > a > div > div:nth-child(1) > div:nth-child(2)`,
    followButton: i => `${followerListBase(i)} > div:nth-child(2) > div`
}
