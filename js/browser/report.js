const { logging, JST } = require('node-utils')
const Base = require('./base')
const mongodbDriver = require('../mongodb_driver')
const UserList = require('../container/user_list')

module.exports = class Report extends Base {
    // fromDate (yyyymmdd), toDate (yyyymmdd)
    constructor(fromDate, toDate) {
        super()

        if (fromDate && toDate) {
            this.fromDate = new Date(`${fromDate.slice(0, 4)}-${fromDate.slice(4, 6)}-${fromDate.slice(6, 8)}T00:00+09:00`)
            this.toDate = new Date(`${toDate.slice(0, 4)}-${toDate.slice(4, 6)}-${toDate.slice(6, 8)}T00:00+09:00`)
        } else {
            const yesterday = new Date(new Date() - 1000 * 60 * 60 * 24)
            this.fromDate = new Date(`${JST.convertToDate(yesterday).replace('/', '-').replace('/', '-')}T00:00+09:00`)

            const today = new Date()
            this.toDate = new Date(`${JST.convertToDate(today).replace('/', '-').replace('/', '-')}T00:00+09:00`)
        }

        logging.info(`fromDate: ${this.fromDate})`)
        logging.info(`toDate: ${this.toDate})`)
    }
    
    async execute() {
        await this.launch()
        const jaStatus = await this.getStatus('furimako', false)
        logging.info(`jaStatus: ${JSON.stringify(jaStatus)})`)

        const enStatus = await this.getStatus('furimako_en', false)
        logging.info(`enStatus: ${JSON.stringify(enStatus)})`)

        const userNameObjList = await mongodbDriver.findUserNames({
            date: {
                $gt: this.fromDate,
                $lt: this.toDate
            },
            targetURL: { $exists: true }
        })
        logging.info(`got userNameObjList (userNameObjList.length: ${userNameObjList.length})`)
        const userList = new UserList(userNameObjList)

        let user = 'furimako'
        await this.login(user)
        await userList.update(this.page, user)
        logging.info(`updated userList (user: ${user})`)
        const jaText = await userList.getTextForReport(this, user)
        const jaStats = userList.getStatistics(user)

        await this.browser.close()
        await this.launch()
        user = 'furimako_en'
        await this.login(user)
        await userList.update(this.page, user)
        logging.info(`updated userList (user: ${user})`)
        const enText = await userList.getTextForReport(this, user)
        const enStats = userList.getStatistics(user)

        return {
            str: `${JST.convertToDatetime(new Date())}`
                + '\n'
                + `\n■ furimako (Following ${jaStatus.numOfFollows} / Followers ${jaStatus.numOfFollowers})`
                + `\nfollowed: ${jaStats.followed}, follow-back: ${jaStats.followBack}, ratio: ${Math.round((jaStats.followBack / jaStats.followed) * 100)}%`
                + '\n'
                + `${jaText}`
                + '\n'
                + `\n■ furimako_en (Following ${enStatus.numOfFollows} / Followers ${enStatus.numOfFollowers})`
                + `\nfollowed: ${enStats.followed}, follow-back: ${enStats.followBack}, ratio: ${Math.round((enStats.followBack / enStats.followed) * 100)}%`
                + '\n'
                + `${enText}`
        }
    }
}
