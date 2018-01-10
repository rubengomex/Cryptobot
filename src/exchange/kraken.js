const config = require('configuration')
const key = config.get('KRAKEN_API_KEY')
const secret = config.get('KRAKEN_API_SECRET')
const krakenClient = require('kraken-api')
const Kraken = new krakenClient(key, secret)

module.exports = {
    name: 'Kraken',
    client: kraken,
    supportsShort: true,
    async getAccounts() {
        return krakenClient.api('Balance')
    },

    ticker({ product, onTick, onError }) {

    },

    userFeed({ product, onUpdate, onError }) {

    },

    async getBalanceForProductPair(pair) {
        const balance = await this.getAccounts().then(({result: data}) => data)
        const products = pair.split('-')

        return products.reduce((acc, key) => {
            let amount = '0.0000000'

            if(key === 'BTC') {
                amount = balance['XXBT'] 
                acc[key] = amount
                return acc
            }

            amount = balance[key]

            if(!amount) { amount = '0.00000000' }

            acc[k] = amount
            return acc
        }, {})
    },

    async placeShortOrder({ amount, cost }) {

    },

    async currentPriceForProduct(product) {
        const currency = this.currencyForProduct(product)
        const ticker = await kraken.api('Ticker', { pair: currency })
        const res = ticker['result'][currency]
        
        return { ask: parseFloat(res.a[0]), bid: parseFloat(res.b[0]) }
    },

    currencyForProduct(product) {
        if(product === 'BTC-USD') { return 'XXBTZUSD' }
        if(product === 'BTC-EUR') { return 'XXBTEUR'}
        return null
    }
}
