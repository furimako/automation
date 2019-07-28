const { MongoClient } = require('mongodb')
const assert = require('assert')
const logging = require('./utils/logging')

const url = 'mongodb://localhost:27017'
const dbName = 'automation'

module.exports = {
    async _query(collectionName, executor) {
        const client = new MongoClient(url, { useNewUrlParser: true })
        await client.connect()
        const collection = client.db(dbName).collection(collectionName)
        const r = await executor(collection)
        await client.close()
        return r
    },
    
    async insertUserNames(userNames) {
        try {
            const r = await this._query(
                'userNames',
                async collection => collection.insertMany(userNames)
            )
            assert.equal(userNames.length, r.insertedCount)
            logging.info(`inserted ${userNames.length} document(s) (collection: userNames)`)
        } catch (err) {
            logging.error(`failed to insert (mongodb_driver.js)\n${err.stack}`)
        }
    },
    
    async findUserNames() {
        try {
            const userNames = await this._query(
                'userNames',
                async collection => collection.find().toArray() || []
            )
            logging.info(`get ${userNames.length} userName(s)`)
            return userNames
        } catch (err) {
            logging.error(`failed to getUserNames (mongodb_driver.js)\n${err.stack}`)
            return []
        }
    }
}
