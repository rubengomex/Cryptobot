const config = require('configuration')
const key = config.get('KRAKEN_API_KEY')
const secret = config.get('KRAKEN_API_SECRET')
const krakenClient = require('kraken-api')
const Kraken = new krakenClient(key, secret)

module.exports = {
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
    }
}
