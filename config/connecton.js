const MongoClient = require('mongodb').MongoClient
const collection = require('./collection')

const state = {
    db: null
}

module.exports.connect = function (done) {
    url = process.env.DB_URL
    const dbname = 'mediaFile'

    MongoClient.connect(url,{ useUnifiedTopology: true } , (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
    })

    
}

module.exports.get = function () {
    return state.db
}