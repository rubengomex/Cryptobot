const SimpleCCI = require('strategies/simpleCCI')
const Candlestick = require('candlestick')

class Backtester {
    constructor({ start, end, period, interval, gdax, product }){
        this.startTime = start
        this.endTime = end
        this.period = period
        this.interval = interval
        this.exchange = gdax
        this.client = gdax.client
        this.client.productID = product
        this.product = product
    }

    async start() {
        // history
        const history = await this.client.getProductHistoricRates({
            granularity: this.interval,
            start: this.startTime,
            end: this.endTime
        })

        this.candlesticks = history.map(stick => {
            const [startTime, low, high, open, close] = stick
            return new Candlestick({ startTime: new Date(startTime* 1000), low, high, open, close, interval: this.interval })
        }).reverse()

        // strategy
        this.strategy = new SimpleCCI({ 
            period: this.period,
            ticks: this.candlesticks,
            onBuySignal: price => this.onBuySignal(price),
            onSellSignal: price => this.onSellSignal(price)
        })
        await this.strategy.initialize()

        this.candlesticks.forEach(async tick => {
            this.currentTime = tick.startTime
            await this.strategy.onTick({ tick, time: tick.startTime })
        })

        const trades = this.strategy.trades

        trades.forEach(trade => {
            const {enter, exit, state} = trade
            const exitStr = exit ? `${exit.time} ${trade.profit()}` : '' 
            console.log(`${state} ${enter.time} ${enter.price} ${exitStr}`)
        })
    }

    async onBuySignal(price) {
        this.strategy.positionOpened({ price, time: this.currentTime })
    }

    async onSellSignal(price) {
        this.strategy.positionClosed({ price, time: this.currentTime })
    }
}

module.exports = exports = Backtester
