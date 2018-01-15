const Trade = require('trade')
const TradeModel = require('models/trade')

class Strategy {
    constructor({ period, onBuySignal, onSellSignal, bot, isLive = false }) {
        this.period = period
        this.onBuySignal = onBuySignal
        this.onSellSignal = onSellSignal
        this.isLive = isLive
        this.bot = bot
        this.maxActiveTrades = 1
        this.trades = []
    }

    async positionOpened({ price, time, amount, order }) {
        console.log('BUY ORDER')
        let model

        if(this.bot) {
            model = await TradeModel.create({
                state: 'open',
                bot: this.bot,
                enter: { time, amount, order, price }
            })
        }

        this.trades.push(new Trade({ price, time, model, amount }))
    }

     async positionClosed({ price, time, amount, order }) {
        console.log('SELL ORDER')
        const openTrades = this.getOpenTrades()

        openTrades.forEach(async trade => {
            let model

            if(this.bot) {
                model = trade.model
                model.exit = { time, amount, order, price }
                model = await model.save()
            }
                
            trade.close({ price, time, model, amount })
        })
    }

    getOpenTrades(){
        return this.trades.filter(trade => trade.state === 'open')
    }
}

module.exports = exports = Strategy
