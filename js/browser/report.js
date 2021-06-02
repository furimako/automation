const { logging, JST } = require('node-utils')
const Base = require('./base')
const mongodbDriver = require('../mongodb_driver')
const UserList = require('../container/user_list')

module.exports = class Report extends Base {
    // fromDate (yyyymmdd), toDate (yyyymmdd)
    constructor(fromDate, toDate) {
        super()

        if (!fromDate && !toDate) {
            // no args -> 7 days ago ~ now
            const sevenDaysAgo = new Date(new Date() - 1000 * 60 * 60 * 24 * 7)
            this.fromDate = new Date(`${JST.convertToDate(sevenDaysAgo).replace('/', '-').replace('/', '-')}T00:00+09:00`)
            this.toDate = false
        } else if (fromDate && !toDate) {
            // fromDate -> fromDate ~ now
            this.fromDate = new Date(`${fromDate.slice(0, 4)}-${fromDate.slice(4, 6)}-${fromDate.slice(6, 8)}T00:00+09:00`)
            this.toDate = false
        } else if (fromDate && toDate) {
            // fromDate & toDate -> fromDate ~ toDate
            this.fromDate = new Date(`${fromDate.slice(0, 4)}-${fromDate.slice(4, 6)}-${fromDate.slice(6, 8)}T00:00+09:00`)
            this.toDate = new Date(`${toDate.slice(0, 4)}-${toDate.slice(4, 6)}-${toDate.slice(6, 8)}T00:00+09:00`)
        }
        logging.info(`fromDate: ${this.fromDate})`)
        logging.info(`toDate: ${this.toDate})`)
    }
    
    async execute() {
        // initialize userList
        const dateFilter = { $gt: this.fromDate }
        if (this.toDate) {
            dateFilter.$lt = this.toDate
        }
        const userNameObjList = await mongodbDriver.findUserNames({
            date: dateFilter,
            targetURL: { $exists: true }
        })
        const userList = new UserList(this, userNameObjList)

        // create targetUserStatusList
        await this.launch()
        const targetUserStatusList = {}
        const targetUsersAll = userList.getTargetUsers()
        for (let i = 0; i < targetUsersAll.length; i += 1) {
            const targetUser = targetUsersAll[i]
            targetUserStatusList[targetUser] = await this.getStatus(targetUser)
        }
        userList.setTargetUserStatusList(targetUserStatusList)

        // create text for report
        const jaText = await userList.getTextForReport('furimako')
        const fromDateStr = JST.convertToDate(this.fromDate)
        const enText = await userList.getTextForReport('furimako_en')
        const toDateStr = JST.convertToDate(this.toDate)

        return {
            str: {
                ja: `${JST.convertToDatetime(new Date())}`
                    + `\n${fromDateStr} ~ ${toDateStr}`
                    + '\n'
                    + `\n${jaText}`,
                en: `${JST.convertToDatetime(new Date())}`
                    + `\n${fromDateStr} ~ ${toDateStr}`
                    + '\n'
                    + `\n${enText}`
            },
            fromDateStr,
            toDateStr
        }
    }
 }
