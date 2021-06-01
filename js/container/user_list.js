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

    async update(report, user) {
        for (let i = 0; i < this.userNames.length; i += 1) {
            const userNameObj = this.userNames[i]
            if (user === userNameObj.user) {
                this.userNames[i].beingFollowedStatus = await _beingFollowedStatus(report, user, userNameObj.userName.replace('@', ''))
            }
        }
    }

    async getTextForReport(browser, user) {
        const keywords = this._getKeywords(user)
        logging.info(`got keywords (user: ${user})\n${JSON.stringify(keywords)}`)
        
        const userStatus = await browser.getStatus(user, false)
        const jaStats = this.getStatistics(user)
        let text = `■ ${user} (Following ${userStatus.numOfFollows} / Followers ${userStatus.numOfFollowers})`
            + `\nfollowed: ${jaStats.followed}, follow-back: ${jaStats.followBack}, ratio: ${Math.round((jaStats.followBack / jaStats.followed) * 100)}%, errorCount: ${jaStats.errorCount}`
        
        // summary
        text += '\n'
            + '\n◇ Summary'
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            const summary = this.getStatistics(user, keyword)
            logging.info(`keyword: ${keyword}, summary: ${JSON.stringify(summary)}`)
            text += `\nkeyword: ${keyword} (followed: ${summary.followed}, follow-back: ${summary.followBack}, ratio: ${Math.round((summary.followBack / summary.followed) * 100)}%, errorCount: ${summary.errorCount})`
        }

        // details
        text += '\n'
            + '\n◇ Details'
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            const summary = this.getStatistics(user, keyword)
            logging.info(`keyword: ${keyword}, summary: ${JSON.stringify(summary)}`)
            text += `\n< keyword: ${keyword} (followed: ${summary.followed}, follow-back: ${summary.followBack}, ratio: ${Math.round((summary.followBack / summary.followed) * 100)}%, errorCount: ${summary.errorCount}) >`

            const targetUsers = this._getTargetUsers(user, keyword)
            logging.info(`got targetUsers (user: ${user}, keyword: ${keyword})\n${JSON.stringify(targetUsers)}`)
            for (let j = 0; j < targetUsers.length; j += 1) {
                const targetUser = targetUsers[j]
                const status = await browser.getStatus(targetUser)
                const summaryByTarget = this.getStatistics(user, keyword, `https://twitter.com/${targetUser}`)
                text += `\n${status.userTitle} https://twitter.com/${targetUser} (followed: ${summaryByTarget.followed}, follow-back: ${summaryByTarget.followBack}, ratio: ${Math.round((summaryByTarget.followBack / summaryByTarget.followed) * 100)}%, errorCount: ${summaryByTarget.errorCount})`
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
            followed: userNamesTemp.filter(
                (u) => u.beingFollowedStatus === 'FOLLOWED' || u.beingFollowedStatus === 'NOT_FOLLOWED'
            ).length,
            followBack: userNamesTemp.filter((u) => u.beingFollowedStatus === 'FOLLOWED').length,
            errorCount: userNamesTemp.filter((u) => u.beingFollowedStatus === 'ERROR').length
        }
    }
}

async function _beingFollowedStatus(report, user, userName) {
    await report.page.goto(`https://twitter.com/${userName}`)
    
    let beingFollowedStatus
    try {
        await report.page.waitForSelector(selectors.userFollowedStatus, { timeout: 5000 })
        const userFollowedStatus = await report.page.evaluate(
            (selector) => document.querySelector(selector).innerHTML,
            selectors.userFollowedStatus
        )
        if (userFollowedStatus.includes('フォローされています') || userFollowedStatus.includes('Follows you')) {
            beingFollowedStatus = 'FOLLOWED'
        } else {
            beingFollowedStatus = 'NOT_FOLLOWED'
        }
    } catch (err) {
        logging.info(`failed to get status (beingFollowed)\n${err.stack}`)
        beingFollowedStatus = 'ERROR'

        // re-login
        await report.browser.close()
        await report.launch()
        await report.login(user)
    }
    logging.info(`beingFollowedStatus: ${beingFollowedStatus} (user: ${user}, userName: ${userName})`)
    return beingFollowedStatus
}
