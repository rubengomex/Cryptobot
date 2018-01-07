
class Arbitrage {
    constructor({ amount, longExchange, shortExchange, isLive, product }) {
        this.amount = amount
        this.longExchange = longExchange
        this.shortExchange = shortExchange
        this.isLive = isLive
        this.product = product
        this.accounts = {
            long: undefined,
            short: undefined
        }
    }

    async start(){
        this.accounts.short = await this.shortExchange.getBalanceForProductPair(this.product)
        console.log(this.accounts.short)

        this.accounts.long = await this.longExchange.getBalanceForProductPair(this.product)
        console.log(this.accounts.long)
    }
}

module.exports = exports = Arbitrage
