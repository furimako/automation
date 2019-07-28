
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
    accountsList: '#react-root > div > div > div > main > div > div.css-1dbjc4n.r-aqfbo4.r-1niwhzg.r-16y2uox > div > div.css-1dbjc4n.r-14lw9ot.r-1tlfku8.r-1ljd8xs.r-13l2t4g.r-1phboty.r-1jgb5lz.r-1ye8kvj.r-13qz1uu.r-184en5c > div > div > div:nth-child(2) > div > section > div > div > div > div > div > div > div > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wtj0ep > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a',
    userName: i => `#react-root > div > div > div > main > div > div.css-1dbjc4n.r-aqfbo4.r-1niwhzg.r-16y2uox > div > div > div > div > div:nth-child(2) > section > div > div > div > div:nth-child(${i}) > div > div > div > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo > div.css-1dbjc4n.r-1awozwy.r-18u37iz.r-1wtj0ep > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > div.css-1dbjc4n.r-18u37iz.r-1wbh5a2 > div.css-901oao.css-bfa6kz.r-1re7ezh.r-18u37iz.r-1qd0xha.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-qvutc0 > span`,
    protectedIcon: i => `#react-root > div > div > div > main > div > div.css-1dbjc4n.r-aqfbo4.r-1niwhzg.r-16y2uox > div > div > div > div > div:nth-child(2) > section > div > div > div > div:nth-child(${i}) > div > div > div > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo > div > div.css-1dbjc4n.r-1wbh5a2.r-dnmrzs > a > div > div.css-1dbjc4n.r-18u37iz.r-dnmrzs > div.css-901oao.r-hkyrab.r-18u37iz.r-1q142lx.r-gwet1z.r-a023e6.r-16dba41.r-ad9z0x.r-bcqeeo.r-qvutc0`,
    followButton: i => `#react-root > div > div > div > main > div > div.css-1dbjc4n.r-aqfbo4.r-1niwhzg.r-16y2uox > div > div > div > div > div:nth-child(2) > section > div > div > div > div:nth-child(${i}) > div > div > div > div.css-1dbjc4n.r-1iusvr4.r-46vdb2.r-1777fci.r-5f2r5o.r-bcqeeo > div > div.css-1dbjc4n.r-k200y.r-1n0xq6e > div`
}
