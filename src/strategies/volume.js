const Strategy = require('./strategy')
const tulind = require('tulind')

class Volume extends Strategy {
    async run({ ticks, time }) {
        const price = ticks[ticks.length - 1].close
        const vol = ticks[ticks.length - 1].volume
        const close = ticks.map(t => t.close)
        const volume = ticks.map(t => t.volume)
        const prices = ticks.map(t => t.average())
        
        const rsiRes = tulind.indicators.rsi.indicator([prices], [this.period])
        const bbRes = tulind.indicators.bbands.indicator([prices], [this.period, 2])
        const obvRes = tulind.indicators.obv.indicator([close, volume], [])

        const [obv] = obvRes
        const [rsi] = rsiRes
        const [bbLow, bbMid, bbHigh] = bbRes
        const obvL = obv[obv.length - 1]
        const rsiL = rsi[rsi.length - 1]
        const bbL = bbLow[bbLow.length - 1]
        const bbM = bbMid[bbMid.length - 1]
        const bbH = bbHigh[bbHigh.length - 1]

        if(!obvL || !bbL || !rsiL) { return }

        console.log(`Time: ${time}    Price: ${price.toFixed(2)}\
        Volume: ${vol.toFixed(2)}    OBV: ${obvL.toFixed(2)}\
        Low: ${bbL.toFixed(2)}    Mid: ${bbM.toFixed(2)}\
        High ${bbH.toFixed(2)}    RSI: ${rsiL.toFixed(2)}`)

        const openTrades = this.getOpenTrades()
        if(openTrades.length < this.maxActiveTrades) {
            if(price < bbL && rsiL < 125) {
                this.onBuySignal(price)
            } 
        } else {
            const [active] = openTrades
            if(price > bbH && rsiL > -75 && price > active.enter.price * 1.04) {
                this.onSellSignal(price)
            }
        }


    }
}

module.exports = exports = Volume