const PromiseTool = require('promise-tool')
const colors = require('colors')
const Trade = require('trade')
const ArbitragePosition = require('./position')

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

            const history = await Promise.all(this.exchanges.map(ex =>{
                return ex.getProductHistoricRates({
                    interval: 300,
                    product: this.product
                })
            })).then(h => {
                return h.reduce((d, tick, index) => {
                    const exchange = this.exchanges[index]
                    d[exchange.name] = tick
                    return d
                }, {})
            })

            this.getAverageSpreads(history)

            const delay = 3000
            await PromiseTool.setInterval(delay, () => {
                this.loop()
            })

        } catch(err) {
            await this.start()
        }
    }

    getAverageSpreads(history) {
        const counts = Object.keys(history).map(key => history[key].length)
        const equal = counts.reduce((isEqual, current, index) => {
            if(index === 0) { return true }
            const previous = counts[index - 1]
            return previous === current
        }, true)

        return equal
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

            pricesPair.forEach(async pair => {
                await this.checkSpread(pair)
            })

        } catch(err) {
            console.log('Error response')
        }

        this.positions.forEach(p => p.print())
    }

    async checkSpread({ prices, exchanges }) {
        const openPositions = this.positions.filter(p => p.state === 'open')
        const hasOpen = openPositions > 0
        const longPrice = hasOpen ? prices.long.ask : prices.long.bid
        const shortPrice = hasOpen ? prices.short.bid : prices.short.ask
        const {name: longName} = exchanges.long
        const {name: shortName} = exchanges.short
        const longStr = `${exchanges.long.name}: ${longPrice.toFixed(2)}`
        const shortStr = `${exchanges.short.name}:  ${shortPrice.toFixed(2)}`
        const spread = (100 - (longPrice / shortPrice * 100)).toFixed(2)
        const spreadStr = `Spread: ${spread}%`
        const full = [`${new Date()}`, longStr, shortStr, spreadStr].join(' | ')
        console.log(full)

        const product = this.product
        const amountLong = this.amount / longPrice
        const amountShort = this.amount / shortPrice

        if(openPositions.length < this.numberOfActivePositions) {
            if(spread >= 0.9) {
                await exchanges.long.placeBuyOrder({
                    amount: `${amountLong}`,
                    price: `${longPrice}`,
                    product
                })
                await exchanges.short.placeShortOrder({
                    amount: `${amountShort}`,
                    price:`${shortPrice}`,
                    product
                })
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
            if(spread < 0.0) {
                openPositions.forEach(p => {
                    if(p.longName !== longName && p.shortName !== shortName) { return }
                    console.log('CLOSING ORDER')
                    console.log(`LONG ORDER: ${longPrice}`)
                    console.log(`SHORT ORDER: ${shortPrice}`)
                    await exchanges.short.placeBuyOrder({
                        amount: `${amountLong}`,
                        price: `${longPrice}`,
                        product
                    })
                    await exchanges.long.placeSellOrder({
                        amount: `${amountLong}`,
                        price: `${longPrice}`,
                        product
                    })
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
