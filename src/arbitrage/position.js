class ArbitragePosition{
    constructor({ longPrice, shortPrice, longName, shortName, time }) {
        this.state = 'open'
        this.trades = { 
            long: new Trade({ price: longPrice, time }), 
            short: new Trade({ price: shortPrice, time})
        }
        this.exit = undefined
    }

    close({ longPrice, shortPrice, time }) {
        this.state = 'closed'
        this.trades.long.close({ price: longPrice, time })
        this.trades.short.close({ price: shortPrice, time })
    }

    calculateProfit() {
        if(this.state !== 'closed') { return null }
        const fee = 0.0025
        const longProfit = this.trades.long.profit()
        const shortTrade = this.trades.short
        const shortSell = (shortTrade.enter.price * (1 - fee))
        const shortBuy = (shortTrade.exit.price * (1 + fee))
        const shortProfit = shortSell - shortBuy

        return shortProfit + longProfit
    }     

    print() {
        const enter = `Long: ${this.trades.long.price}    Short: ${this.trades.short.price}`
        const exit = this.state === 'closed' ? `Long: ${this.trades.long.exit.price}    Short: ${this.trades.short.exit.price}` : '' 
        const profit = this.calculateProfit()
        const prof = this.state === 'closed' ? `${profit}` : ''
        const colored = profit > 0 ? colors.green(prof) : colors.red(prof)
        const end = this.state === 'closed' ? `Exit - ${exit} | Profit: ${colored}`: ''
        console.log(`${this.state} | Enter - ${enter} | ${end}`)
    }
}

module.exports = exports = ArbitragePosition
