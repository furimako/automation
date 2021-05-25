const { MongoClient } = require('mongodb')
const { logging } = require('node-utils')

const url = 'mongodb://localhost:27017'
const dbName = 'automation'

module.exports = {
    async _query(collectionName, executor) {
        const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true })
        await client.connect()
        const collection = client.db(dbName).collection(collectionName)
        const r = await executor(collection)
        await client.close()
        return r
    },
    
    async insertUserName(userNameObj) {
        const r = await this._query(
            'userNames',
            async (collection) => collection.insertOne(userNameObj)
        )
        logging.info(`inserted 1 document (collection: userNames, userNameObj: ${JSON.stringify(userNameObj)}, insertedId: ${r.insertedId})`)
        return r
    },
    
    async findUserNames(filterObj = {}) {
        const userNames = await this._query(
            'userNames',
            async (collection) => collection.find(filterObj).toArray() || []
        )
        logging.info(`get ${userNames.length} userName(s)`)
        return userNames
    }
}
