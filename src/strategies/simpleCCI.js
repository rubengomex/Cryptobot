const { CCI, ADX } = require('technicalindicators')
const Trade = require('trade')

class SimpleCCI {
    constructor({ period , ticks, onBuySignal, onSellSignal }) {
        const open = ticks.map(tick => tick.open)
        const high = ticks.map(tick => tick.open)
        const low = ticks.map(tick => tick.open)
        const close = ticks.map(tick => tick.open)

        this.cci = new CCI({ open, high, low, close, period })
        this.adx = new ADX({ period, high, low, close })
        this.trades = []
        this.numberActiveTrades = 1
        this.onBuySignal = onBuySignal
        this.onSellSignal = onSellSignal
    }

    async initialize() {
        const [initialCCI, initialADX] = await Promise.all([
            await this.cci.getResult(),
            await this.adx.getResult()
        ])
    }

    onTick({ tick, time }) {
        const {open, close, high, low} = tick;
        const cciResult = cci.nextValue({ open, high, low, close})
        const adxResult = adx.nextValue({high, low, close })

        const price = tick.average()

        if(!cciResult || !adxResult) { return }

        console.log(`Time: ${time}    Price: ${price}    CCI: ${cciResult}    \
        ADX: ${adxResult.adx}    \
        PDI: ${adxResult.pdi}    \
        MDI: ${adxResult.mdi}`)

        this.trades.forEach(trade => {
            const {enter, exit, state} = trade
            const exitStr = exit ? `${exit.time} ${trade.profit()}` : '' 
            console.log(`${state} ${enter.time} ${enter.price} ${exitStr}`)
        })

        const openTrades = this.getOpenTrades()

        if(openTrades.length < this.numberActiveTrades) {
            const {adx, pdi, mdi} = adxResult
            if(cciResult < -100 ) {//&& adx > 20 && mdi < pdi + 5) { 
                this.onBuySignal(price) 
            }
            return
        }
        const [open] = openTrades

        if(cciResult > 100) { //&& adx > 20 && mdi > pdi - 5) {
            const gainProfit = price - (price * 0.0025) > (open.enter.price * 1.0025)
            if(gainProfit) { 
                this.onSellSignal(price) 
            }
        }


    }

    positionOpened({ price, time }) {
        console.log('BUY ORDER')
        this.trades.push(new Trade({ price, time }))
    }

    positionClosed({ price, time }) {
        console.log('SELL ORDER')
        const openTrades = this.getOpenTrades()

        openTrades.forEach(trade => trade.close({ price, time}))
    }

    getOpenTrades(){
        return this.trades.filter(trade => trade.state === 'open')
    }
}

module.exports = exports = SimpleCCI
