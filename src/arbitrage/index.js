const PromiseTool = require('promise-tool')
const colors = require('colors')
const Trade = require('trade')

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

class Arbitrage {
    constructor({ amount, exchanges, isLive, product }) {
        this.amount = amount
        this.exchanges = exchanges
        this.exchangesDict = exchanges.reduce((acc, exchange) => {
            acc[exchange.name] = exchange
            return acc
        }, {})
        this.isLive = isLive
        this.product = product
        this.accounts = {}
        this.positions = []
        this.numberOfActivePositions = 1
        this.pairs = this.createPairs()
    }

    async start(){
        try {

            const balances = await Promise.all(this.exchanges.map(exchange => {
                return exchange.getBalanceForProductPair(this.product)
            }))

            this.accounts = balances.reduce((acc, balance, index) => {
                const exchange = this.exchanges[index]
                acc[exchange.name] = balance

                return acc
            }, {})

            const delay = 3000
            await PromiseTool.setInterval(delay, () => {
                this.loop()
            })

        } catch(err) {
            await this.start()
        }
    }

    createPairs(){
        const pairs = this.exchanges.map(exchange => {
            if(!exchange.supportShort) { return }
            const paired = this.exchanges.map(other => { 
                return {short: exchange.name, long: other.name}
            })
            .filter(d => d !== undefined && d.short !== d.long)
            .reduce((a, p) => a.concat(p), [])

            return paired
        })

        return pairs
    }

    async loop() {
        try {
            const prices = await this.currentPrices()
            const pairs = this.createPairs()

            const pricesPair = this.pairs.forEach(pair => {
                const {short, long} = pair
                const price = {
                    long: prices[long],
                    short: prices[short]
                }

                const exchanges = {
                    long: this.exchangesDict[long],
                    short: this.exchangesDict[short]
                }

                return {prices: price, exchanges}
            })

            pricesPair.forEach(pair => this.checkSpread(pair))

        } catch(err) {
            console.log('Error response')
        }

        this.positions.forEach(p => p.print())
    }

    async checkSpread({ prices, exchanges }) {
        const openPositions = this.positions.filter(p => p.state === 'open')
        const hasOpen = openPositions > 0
        const longPrice = hasOpen ? prices.long.bid : prices.long.ask
        const shortPrice = hasOpen ? prices.short.ask : prices.short.bid
        const {name: longName} = exchanges.long
        const {name: shortName} = exchanges.short
        const longStr = `${exchanges.long.name}: ${longPrice.toFixed(2)}`
        const shortStr = `${exchanges.short.name}:  ${shortPrice.toFixed(2)}`
        const spread = (100 - (longPrice / shortPrice * 100)).toFixed(2)
        const spreadStr = `Spread: ${spread}%`
        const full = [`${new Date()}`, longStr, shortStr, spreadStr].join(' | ')
        console.log(full)

        if(openPositions.length < this.numberOfActivePositions) {
            if(spread >= 0.9) {
                console.log(`LONG ORDER: ${longPrice}`)
                console.log(`SHORT ORDER: ${shortPrice}`)
                const position = new ArbitragePosition({ 
                    longPrice, shortPrice, 
                    longName, shortName,
                    time: new Date()
                 })
                this.positions.push(position)
            }
        } else {
            console.log('CLOSING ORDER')
            console.log(`LONG ORDER: ${longPrice}`)
            console.log(`SHORT ORDER: ${shortPrice}`)
            if(spread < 0.0) {
                openPositions.forEach(p => {
                    if(p.longName !== longName && p.shortName !== shortName) { return }
                    p.close({ longPrice, shortPrice, time: new Date() })
                })
            }
        }
    }

    async currentPrices(product) {
        const prices = await Promise.all(this.exchanges.map(e => {
            return e.currentPricesForProduct(this.product)
        }))

        return prices.reduce((acc, price, index) =>{
            const exchange = this.exchanges[index]
            acc[exchange.name] = price
            return acc
        }, {})
    }
}

module.exports = exports = Arbitrage
