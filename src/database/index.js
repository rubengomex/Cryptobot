const mongoose = require('mongoose')
const config = require('configuration')
const url = config.get('MONGO_URL')
const dbName = config.get('MONGO_DATABASE_NAME')
const db = `${url}/${dbName}`

mongoose.Promise = global.Promise

module.exports = {
    connect() {
        return new Promise((resolve, reject) => {
            mongoose.connect(db, {
                useMongoClient: true,
                promiseLibrary: global.Promise
            })

            const conn = mongoose.connection
            conn.on('error', () => {
                console.log(err)
                reject(err)
            })

            conn.on('open', () => {
                console.log(`Connected to ${db}`)
                resolve()
            })
        })
    },
    model: key => mongoose.model(key)
}
