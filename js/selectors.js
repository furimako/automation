function followerListBase(i) {
    return `section > div > div > ${(i) ? `div:nth-child(${i})` : 'div'} > div > div > div > div:nth-child(2)`
}

module.exports = {
    // Search Page (ユーザー)
    accountsList: `${followerListBase()} > div:nth-child(1) > div:nth-child(1) > a`,
    
    // Login Page
    loginName: 'input[name="session[username_or_email]"]',
    loginPassword: 'input[name="session[password]"]',
    loginButton: 'div[role="button"][data-testid="LoginForm_Login_Button"]',
    
    // User Page
    userCount: (user, type) => `a[href="/${user}/${type}"] > span:nth-child(1) > span`,
    userTitle: 'main > div > div > div > div > div > div:nth-child(2) > div > div > div:nth-child(1) > div > div > div > div > div > div > span:nth-child(1) > span',
    userDescription: 'main > div > div > div > div > div > div:nth-child(2) > div > div > div:nth-child(1) > div > div:nth-child(3) > div > div > span',
    
    // Confirmation
    yesToConfirmation: 'div[role="button"].css-18t94o4.css-1dbjc4n.r-urgr8i.r-42olwf.r-sdzlij.r-1phboty.r-rs99b7.r-16y2uox.r-1w2pmg.r-1vuscfd.r-1dhvaqw.r-1fneopy.r-o7ynqc.r-6416eg.r-lrvibr',
    
    // Follow & Follower List
    userName: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(2) > div > span`,
    accountStatus: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(2)`,
    protectedIcon: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(1) > div:nth-child(2)`,
    followButton: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(2) > div`,
    accountDescription: (i) => `${followerListBase(i)} > div:nth-child(2)`
}
