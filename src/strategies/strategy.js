const Trade = require('trade')

class Strategy {
    constructor({ period , ticks = [], onBuySignal, onSellSignal }) {
        this.period = period
        this.ticks = ticks
        this.onBuySignal = onBuySignal
        this.onSellSignal = onSellSignal
        this.maxActiveTrades = 1
        this.trades = []
    }

    positionOpened(price) {
        console.log('BUY ORDER')
        this.trades.push(new Trade({ price, time: new Date()}))
    }

    positionClosed(price) {
        console.log('SELL ORDER')
        const openTrades = this.getOpenTrades()

        openTrades.forEach(trade => trade.close({ price, time: new Date()}))
    }

    getOpenTrades(){
        return this.trades.filter(trade => trade.state === 'open')
    }
}

module.exports = exports = Strategy
