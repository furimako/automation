const { logging } = require('node-utils')

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

    async getTextForReport(browser, user) {
        logging.info(`starting getTextForReport (user: ${user})`)

        const targetUserStatusList = {}
        const targetUsersAll = this._getTargetUsers(user)
        for (let i = 0; i < targetUsersAll.length; i += 1) {
            const targetUser = targetUsersAll[i]
            targetUserStatusList[targetUser] = await browser.getStatus(targetUser)
        }
        
        const userStatus = await browser.getStatus(user, false)
        const keywords = this._getKeywords(user)
        const followCountTotal = this._getFollowCount(user)
        let text = `■ ${user} (Following ${userStatus.numOfFollows} / Followers ${userStatus.numOfFollowers})`
            + `\followCountTotal: ${followCountTotal}`
        
        // summary
        text += '\n'
            + '\n◇ Summary'
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            logging.info(`getting summary by keyword "${keyword}"`)

            const followCountByKeyword = this._getFollowCount(user, keyword)
            text += `\nkeyword: ${keyword} (followCountByKeyword: ${followCountByKeyword})`
        }

        // details
        text += '\n'
            + '\n◇ Details'
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            logging.info(`getting details by keyword "${keyword}"`)
            
            const followCountByKeyword = this._getFollowCount(user, keyword)
            text += `\n< keyword: ${keyword} (followCountByKeyword: ${followCountByKeyword}) >`

            const targetUsersByKeyword = this._getTargetUsers(user, keyword)
            for (let j = 0; j < targetUsersByKeyword.length; j += 1) {
                const targetUser = targetUsersByKeyword[j]
                const targetStatus = targetUserStatusList[targetUser]
                logging.info(`getting details by keyword "${keyword}" & targetUser "${targetStatus.userTitle}"`)

                const followCountByTarget = this._getFollowCount(user, keyword, `https://twitter.com/${targetUser}`)
                text += `\n${targetStatus.userTitle} https://twitter.com/${targetUser} (followCountByTarget: ${followCountByTarget})`
                    + `\nFollowing ${targetStatus.numOfFollows} / Followers ${targetStatus.numOfFollowers}`
                    + `\n${targetStatus.userDescription}`
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
        logging.info(`    L got ${keywords.length} keyword(s) (user: ${user})\n${JSON.stringify(keywords)}`)
        return keywords
    }

    _getTargetUsers(user, keyword = false) {
        const targetUsers = []

        let userNamesTemp = this.userNames.filter((u) => u.user === user)
        if (keyword) {
            userNamesTemp = userNamesTemp.filter((u) => u.keyword === keyword)
        }

        userNamesTemp.forEach((u) => {
            const targetUser = u.targetURL.replace('https://twitter.com/', '')
            if (!targetUsers.includes(targetUser)) {
                targetUsers.push(targetUser)
            }
        })
        logging.info(`    L got ${targetUsers.length} targetUser(s) (user: ${user}, keyword: ${keyword})\n${JSON.stringify(targetUsers)}`)
        return targetUsers
    }

    _getFollowCount(user, keyword = false, targetURL = false) {
        let userNamesTemp = this.userNames.filter((u) => u.user === user)
        if (keyword) {
            userNamesTemp = userNamesTemp.filter((u) => u.keyword === keyword)
        }
        if (targetURL) {
            userNamesTemp = userNamesTemp.filter((u) => u.targetURL === targetURL)
        }
        const followCount = userNamesTemp.length
        logging.info(`    L followCount: ${followCount} (user: ${user}, keyword: ${keyword}, targetURL: ${targetURL})`)
        return followCount
    }
}
