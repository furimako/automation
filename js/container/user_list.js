const { logging } = require('node-utils')
const selectors = require('../selectors')

module.exports = class UserList {
    constructor(userNameObjList) {
        // this.userNames = [
        //     {
        //         "_id" : ObjectId("xxxxxxxx"),
        //         "targetURL" : "https://twitter.com/abcdefg",
        //         "userName" : "@user_name",
        //         "date" : ISODate("2021-01-01T01:00:00.000Z"),
        //         "user" : "furimako",
        //         "keyword" : "keyword"
        //     },
        //       :
        // ]
        this.userNames = userNameObjList
    }

    async update(page, user) {
        for (let i = 0; i < this.userNames.length; i += 1) {
            const userNameObj = this.userNames[i]
            if (user === userNameObj.user) {
                this.userNames[i].beingFollowed = await beingFollowed(page, user, userNameObj.userName.replace('@', ''))
            }
        }
    }

    async getTextForReport(browser, user) {
        const keywords = this._getKeywords(user)
        logging.info(`got keywords (user: ${user})\n${JSON.stringify(keywords)}`)
        
        // summary
        let text = ''
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            const summary = this.getStatistics(user, keyword)
            logging.info(`keyword: ${keyword}, summary: ${JSON.stringify(summary)}`)
            text += `\n◇ keyword: ${keyword} (followed: ${summary.followed}, follow-back: ${summary.followBack}, ratio: ${Math.round((summary.followBack / summary.followed) * 100)}%)`

            const targetUsers = this._getTargetUsers(user, keyword)
            logging.info(`got targetUsers (user: ${user}, keyword: ${keyword})\n${JSON.stringify(targetUsers)}`)
            for (let j = 0; j < targetUsers.length; j += 1) {
                const targetUser = targetUsers[j]
                const status = await browser.getStatus(targetUser)
                const summaryByTarget = this.getStatistics(user, keyword, `https://twitter.com/${targetUser}`)
                text += `\n${status.userTitle} https://twitter.com/${targetUser} (followed: ${summaryByTarget.followed}, follow-back: ${summaryByTarget.followBack}, ratio: ${Math.round((summaryByTarget.followBack / summaryByTarget.followed) * 100)}%)`
                    + `\nFollowing ${status.numOfFollows} / Followers ${status.numOfFollowers}`
                    + `\n${status.userDescription}`
                    + '\n'
            }
        }

        // details
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            const summary = this.getStatistics(user, keyword)
            logging.info(`keyword: ${keyword}, summary: ${JSON.stringify(summary)}`)
            text += `\n◇ keyword: ${keyword} (followed: ${summary.followed}, follow-back: ${summary.followBack}, ratio: ${Math.round((summary.followBack / summary.followed) * 100)}%)`

            const targetUsers = this._getTargetUsers(user, keyword)
            logging.info(`got targetUsers (user: ${user}, keyword: ${keyword})\n${JSON.stringify(targetUsers)}`)
            for (let j = 0; j < targetUsers.length; j += 1) {
                const targetUser = targetUsers[j]
                const status = await browser.getStatus(targetUser)
                const summaryByTarget = this.getStatistics(user, keyword, `https://twitter.com/${targetUser}`)
                text += `\n${status.userTitle} https://twitter.com/${targetUser} (followed: ${summaryByTarget.followed}, follow-back: ${summaryByTarget.followBack}, ratio: ${Math.round((summaryByTarget.followBack / summaryByTarget.followed) * 100)}%)`
                    + `\nFollowing ${status.numOfFollows} / Followers ${status.numOfFollowers}`
                    + `\n${status.userDescription}`
                    + '\n'
            }
        }
        return text
    }

    _getKeywords(user) {
        const keywords = []
        this.userNames
            .filter((userNameObj) => userNameObj.user === user)
            .forEach((userNameObj) => {
                const { keyword } = userNameObj
                if (!keywords.includes(keyword)) {
                    keywords.push(keyword)
                }
            })
        return keywords
    }

    _getTargetUsers(user, keyword) {
        const targetUsers = []
        this.userNames
            .filter((u) => u.user === user && u.keyword === keyword)
            .forEach((u) => {
                const targetUser = u.targetURL.replace('https://twitter.com/', '')
                if (!targetUsers.includes(targetUser)) {
                    targetUsers.push(targetUser)
                }
            })
        return targetUsers
    }

    getStatistics(user, keyword = false, targetURL = false) {
        let userNamesTemp = this.userNames.filter((u) => u.user === user)

        if (keyword) {
            userNamesTemp = userNamesTemp.filter((u) => u.keyword === keyword)
        }
        if (targetURL) {
            userNamesTemp = userNamesTemp.filter((u) => u.targetURL === targetURL)
        }

        return {
            followed: userNamesTemp.length,
            followBack: userNamesTemp.filter((u) => u.beingFollowed).length
        }
    }
}

async function beingFollowed(page, user, userName) {
    await page.goto(`https://twitter.com/${userName}`)
    
    let isBeingFollowed
    let hasError = false
    try {
        await page.waitForSelector(selectors.userFollowedStatus, { timeout: 5000 })
        const userFollowedStatus = await page.evaluate(
            (selector) => document.querySelector(selector).innerText,
            selectors.userFollowedStatus
        )
        isBeingFollowed = userFollowedStatus.includes('フォローされています') || userFollowedStatus.includes('Follows you')
    } catch (err) {
        logging.info(`failed to get status (beingFollowed), it is maybe due to deleted account\n${err.stack}`)
        isBeingFollowed = false
        hasError = true
    }
    logging.info(`isBeingFollowed: ${isBeingFollowed} (user: ${user}, userName: ${userName}${(hasError) ? ', hasError' : ''})`)
    return isBeingFollowed
}
