const Strategy = require('./strategy')
const tulind = require('tulind')

class CCIStrategy extends Strategy {

    async run({ ticks, time }) {
        const price = ticks[ticks.length - 1].close
        const close = ticks.map(t => t.close)
        const low = ticks.map(t => t.low)
        const high = ticks.map(t => t.high)

        const results = await tulind.indicators.cci.indicator([high, low, close], [this.period])
        const [data] = results

        if(data.length === 0) { return }
        const result = data[data.length - 1]

        console.log(`Time: ${time} Price: ${price.toFixed(2)} CCI: ${result}`)

        const openTrades = this.getOpenTrades()

        if(openTrades.length < this.maxActiveTrades) {
            if(result < 100) {
                this.onBuySignal(price)
            }
        } else {
            const [trade] = openTrades
            if(price * 1.01 > trade.price && result > 100) {
                this.onSellSignal(price)
            }
        }
    }
}

module.exports = exports = CCIStrategy
