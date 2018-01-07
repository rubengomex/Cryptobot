const config = require('config')

module.exports = {
    get: key => process.env[key] || config[key]
}
