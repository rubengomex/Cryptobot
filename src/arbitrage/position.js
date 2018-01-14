class ArbitragePosition{
    constructor({ longPrice, shortPrice, exchanges, time, longOrder, shortOrder }) {
        this.state = 'pending-open'
        this.trades = { 
            long: new Trade({ price: longPrice, time }), 
            short: new Trade({ price: shortPrice, time})
        }
        this.exchanges = exchanges
        this.orders = {
            open: {
                long: longOrder,
                short: shortOrder
            }
        }
        this.exit = undefined
    }

    async checkOrderState() {
        const orders = this.state === 'pending-close' ? this.orders.close : this.orders.open 
        const longStatus = await this.exchanges.long.orderStatus(orders.long.id)
        const shortStatus = await this.exchanges.short.orderStatus(orders.short.id)

        if(longStatus === 'Finished' && shortStatus === 'Finished') {
            if (this.state === 'pending-open') {
                this.opened()
            } else if(this.state === 'pending-close') {
                this.closed()
            }
        }
    }

    opened() {
        this.state = 'open'
    }

    closing() {
        this.state = 'pending-close'
    }

    closed() {
        this.state = 'closed'
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
