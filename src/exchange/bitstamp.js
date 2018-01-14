const { TickerStream, OrderBookStream, Bitstamp } = require('node-bitstamp')
const config = require('configuration')
const key = config.get('BITSTAMP_API_KEY')
const secret = config.get('BITSTAMP_API_SECRET')
const clientId = config.get('BITSTAMP_API_CLIENT_ID')
const Candlestick = require('candlestick')

const bitstamp = new Bitstamp({
    key,
    secret,
    clientId,
    timeout: 5000,
    rateLimit: true //turned on by default
})

module.exports = {
    name: 'Bitstamp',
    async getAccounts() {
        return await bitstamp.balance().then(({ body: data }) => data)
    },
    async getBalanceForProductPair(product) {
        const products = product.split('-')
        const accounts = await this.getAccounts()
        const keys = products.reduce((acc,value) => {
            const key = `${p.toLowerCase()}_available`
            acc[value] = accounts[key]
            return acc
        }, {})

        return keys
    },

    async openOrders({ product }) {
        const currency = this.currencyForProduct(product)
        const orders = await bitstamp.openOrders(currency).then(({ body: data }) => data)
        return orders
    },

    async orderStatus({ id }) {
        const {status} = await bitstamp.orderStatus(id).then(({ body: data }) => data)
        return status
    },

    async getProductHistoricRates({ interval, product }) {
        const currency = this.currencyForProduct(product)
        const minutes = Math.floor(interval / 60)
        const transactions = await bitstamp.transactions(currency, 'day').then(({ status, headers, body }) => body)
        const history = transactions.reverse().reduce((acc, transaction) => {
            const lastIndex = acc.length - 1
            const current = acc[lastIndex]
            if(current.length === 0) { 
                currency.push(transaction) 
                return acc
            }

            const [first] = current
            const transactionDate = parseInt(transaction.date)
            const firstDate = parseInt(first.date)
            if(transactionDate - firstDate > interval) { 
                acc.push([])
            } else {
                current.push(transaction)
            }

            return acc
        }, [[]])
        .map((chunk, index) => {
            if(chunk.length === 0) { return null }
            const [firstChunk] = chunk
            const candlestick = new Candlestick({
                interval,
                price: parseFloat(firstChunk.price),
                startTime: parseInt(firstChunk.date)
            })

            chunk.slice(1).forEach(c=> candlestick.onPrice(c.price))

            candlestick.state = 'closed'
            return candlestick
        })
        .filter(c => c !== null)

        return history
    },

    async placeBuyOrder({ product, amount, price }) {
        const currency = this.currencyForProduct(product)
        const order = await bitstamp.buyLimitOrder(amount, price, currency)
        return order
    },

    async placeSellOrder({ product, amount, price }) {
        const currency = this.currencyForProduct(product)
        const order = await bitstamp.sellMarketOrder(cost, currency)
        return order
    },

    async currentPriceForProduct(product) {
        const currency = this.currencyForProduct(product)
        const ticker = await bitstamp.ticker(currency).then(({ status, headers, body }) => body)

        return { ask: ticker.ask, bid: ticker.bid }
    },

    currencyForProduct(product) {
        return product.replace('-', '').toLowerCase();
    }
}
