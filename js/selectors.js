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
    yesToConfirmation: '#layers > div:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(2)',
    
    // Follow & Follower List
    userName: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(2) > div > span`,
    accountStatus: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(2)`,
    protectedIcon: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(1) > a > div > div:nth-child(1) > div:nth-child(2)`,
    followButton: (i) => `${followerListBase(i)} > div:nth-child(1) > div:nth-child(2) > div`,
    accountDescription: (i) => `${followerListBase(i)} > div:nth-child(2)`
}
