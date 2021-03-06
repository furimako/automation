const { logging } = require('node-utils')

module.exports = class UserList {
    constructor(browser, userNameObjList) {
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
        this.browser = browser
        this.userNames = userNameObjList
    }

    async getTextForReport(user) {
        logging.info(`starting getTextForReport (user: ${user})`)

        const userStatus = await this.browser.getStatus(user, false)
        const keywords = this._getKeywords(user)
        const followCountTotal = this._getFollowCount(user)
        let text = `${user}`
            + `\nFollowing ${userStatus.numOfFollows} / Followers ${userStatus.numOfFollowers}`
            + `\nfollowCountTotal: ${followCountTotal}`
        
        // summary
        text += '\n'
            + '\n■ Summary'
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            logging.info(`getting summary by keyword "${keyword}"`)

            const followCountByKeyword = this._getFollowCount(user, keyword)
            text += `\nkeyword: ${keyword} (followCount: ${followCountByKeyword})`
        }

        // details
        text += '\n'
            + '\n■ Details'
        for (let i = 0; i < keywords.length; i += 1) {
            const keyword = keywords[i]
            text += `\n◇ keyword: ${keyword}`

            logging.info(`getting details by keyword "${keyword}"`)
            const targetUsersByKeyword = this.getTargetUsers(user, keyword)
            for (let j = 0; j < targetUsersByKeyword.length; j += 1) {
                const targetUser = targetUsersByKeyword[j]
                const targetStatus = this.targetUserStatusList[targetUser]
                logging.info(`getting details by keyword "${keyword}" & targetUser "${targetStatus.userTitle}"`)

                const followCountByTarget = this._getFollowCount(user, keyword, `https://twitter.com/${targetUser}`)
                const description = (targetStatus.userDescription) ? targetStatus.userDescription.replace(/\r?\n/g, '') : ''
                text += `\n${targetStatus.userTitle} (followCount: ${followCountByTarget})`
                    + `\nhttps://twitter.com/${targetUser}`
                    + `\nFollowing ${targetStatus.numOfFollows} / Followers ${targetStatus.numOfFollowers}`
                    + `\n${description}`
                    + '\n'
            }
        }
        return text
    }

    getTargetUsers(user = false, keyword = false) {
        const targetUsers = []

        let userNamesTemp = this.userNames
        if (user) {
            userNamesTemp = userNamesTemp.filter((u) => u.user === user)
        }
        if (keyword) {
            userNamesTemp = userNamesTemp.filter((u) => u.keyword === keyword)
        }

        userNamesTemp.forEach((u) => {
            const targetUser = u.targetURL.replace('https://twitter.com/', '')
            if (!targetUsers.includes(targetUser)) {
                targetUsers.push(targetUser)
            }
        })

        // logging
        let loggingText = `    L got ${targetUsers.length} targetUser(s) (user: ${user}`
        if (keyword) {
            loggingText += `, keyword: ${keyword}`
        }
        loggingText += `)\n${JSON.stringify(targetUsers)}`
        logging.info(loggingText)

        return targetUsers
    }

    setTargetUserStatusList(targetUserStatusList) {
        this.targetUserStatusList = targetUserStatusList
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

    _getFollowCount(user, keyword = false, targetURL = false) {
        let userNamesTemp = this.userNames.filter((u) => u.user === user)
        if (keyword) {
            userNamesTemp = userNamesTemp.filter((u) => u.keyword === keyword)
        }
        if (targetURL) {
            userNamesTemp = userNamesTemp.filter((u) => u.targetURL === targetURL)
        }
        const followCount = userNamesTemp.length

        // logging
        let loggingText = `    L followCount: ${followCount} (user: ${user}`
        if (keyword) {
            loggingText += `, keyword: ${keyword}`
        }
        if (targetURL) {
            loggingText += `, targetURL: ${targetURL}`
        }
        loggingText += ')'
        logging.info(loggingText)

        return followCount
    }
}
