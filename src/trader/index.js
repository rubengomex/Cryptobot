const SimpleCCI = require('strategies/simpleCCI')
const Candlestick = require('candlestick')

class Trader {
    constructor({ product, gdax, interval, period = 30 }) {
        this.product = product
        this.exchange = gdax
        this.client = gdax.client
        this.client.productID = product
        this.interval
    }

    async start() {
        // Get Accounts
        const [accounts, history, orders, fills] = await Promise.all([
            this.client.getAccounts(),
            this.client.getProductHistoricRates({ granularity: this.interval }),
            this.client.getOrders(),
            this.client.getFills()
        ])

        const candlesticks = history.map(stick => {
            const [startTime, low, high, open, close] = stick
            return new Candlestick({ startTime: new Date(startTime), low, high, open, close, interval: this.interval })
        }).reverse()

        Object.assign(this, {accounts, candlesticks, orders,  fills})

        // strategy
        this.strategy = new SimpleCCI({ 
            period: this.period,
            ticks: this.candlesticks,
            onBuySignal: price => this.onBuySignal(price),
            onSellSignal: price => this.onSellSignal(price)
        })
        await this.strategy.initialize()

        // Start Ticker
        this.ticker = await this.exchange.ticker({
            product: this.product,
            onTick: data => this.onTick(data),
            onError: this.onTickerError
        })
        // Start OrderBook

        // Start user feed

        // set state
    }

    // receives on tick data
    async onTick(data) {
        const {price} = data
        console.log(`Time: ${new Date}    Price: ${price}`)

        if(!this.currentCandle) {
            this.currentCandle = new Candlestick({ price: parseFloat(price), interval: this.interval })
            return
        }

        this.currentCandle.onPrice(price)

        if(this.currentCandle.state === 'closed') {
            this.candlesticks.push(this.currentCandle)
            this.strategy.onTick({ tick: this.currentCandle, time: new Date() })
            this.currentCandle = null
        }
    }

    async onTickerError(error) {
        console.log(error)
    }

    async onBuySignal(price) {
        this.strategy.positionOpened( { price, time: new Date() })
    }

    async onSellSignal(price) {
        this.strategy.positionClosed({ price, time: new Date() })
    }


}

module.exports = exports = Trader
