const { TickerStream, OrderBookStream, Bitstamp} = require('node-bitstamp')
const config = require('configuration')
const key = config.get('BITSTAMP_API_KEY')
const secret = config.get('BITSTAMP_API_SECRET')
const clientId = config.get('BITSTAMP_API_CLIENT_ID')

const bitstamp = new Bitstamp({
    key,
    secret,
    clientId,
    timeout: 5000,
    rateLimit: true //turned on by default
})

module.exports = {
    async getAccounts() {
        return await bitstamp.balance().then(({ body: data }) => data)
    },
    async getBalanceForProductPair(product) {
        const products = product.split('-')
        const accounts = await this.getAccounts()
        const keys = products.reduce((d,p) => {
            const key = `${p.toLowerCase()}_available`
            d[p] = accounts[key]
        }, {})

        return keys
    }
}
