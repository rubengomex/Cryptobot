const Candlestick = require('candlestick')
const StrategyFactory = require('srategies/factory')
const randomToken = require('random-token')
const uuidv1 = require('uuid/v1')

class Trader {
    constructor({ product, gdax, amount = 0.01, interval, period = 30, isLive = false, strategy }) {
        this.product = product
        this.exchange = gdax
        this.client = gdax.client
        this.client.productID = product
        this.interval = interval
        this.period = period
        this.amount = amount
        this.isLive = isLive
        this.strategyType = strategy
        this.state = 'initializing'
        this.tokens = {}
    }

    async start() {
        if(this.isLive) {
            console.log('Heads up, we are running live')
        }

        console.log(`Running trader with strategy ${this.strategyType} for amount: ${this.amount}`)
        // Get Accounts
        const [accounts, history, orders, fills] = await Promise.all([
            this.client.getAccounts(),
            this.client.getProductHistoricRates({ granularity: this.interval }),
            this.client.getOrders(),
            this.client.getFills()
        ])

        const ordersMapped = orders.reduce((acc, order) => {
            acc[order.side][order.id] = o
            return acc
        }, { buy: {}, sell: {} })

        const candlesticks = history.map(stick => {
            const [startTime, low, high, open, close, volume] = stick
            return new Candlestick({ 
                startTime: new Date(startTime), 
                low, high, open, close,
                volume,
                interval: this.interval })
        }).reverse()

        Object.assign(this, {accounts, candlesticks, orders: ordersMapped,  fills})

        // strategy
        this.strategy = StrategyFactory.create({ 
            type: this.strategyType,
            period: this.period,
            ticks: this.candlesticks,
            onBuySignal: price => this.onBuySignal(price),
            onSellSignal: price => this.onSellSignal(price)
        })

        // Start Ticker
        this.ticker = await this.exchange.ticker({
            product: this.product,
            onTick: data => this.onTick(data),
            onError: this.onTickerError
        })
        // Start OrderBook

        // Start user feed
        this.userFeed = await this.exchange.userFeed({
            product: this.product,
            onUpdate: data => this.onUserUpdate(data),
            onError: this.onUserFeedError
        })

        // set state
    }

    // receives on tick data
    onTick(data) {
        const {price, volume} = data
        console.log(`Time: ${new Date}    Price: ${price}`)

        if(!this.currentCandle) {
            this.currentCandle = new Candlestick({ 
                price: parseFloat(price), 
                volume: parseFloat(volume),
                interval: this.interval 
            })
            return
        }

        this.currentCandle.onPrice({ p: price, v: volume })

        const ticks = this.candlesticks.slice()
        ticks.push(currentCandle)
        await this.strategy.run({ ticks, time: new Date() })

        this.strategy.trades.forEach(t => t.print())
    }

    onTickerError(error) {
        console.log(error)
    }

    onUserUpdate(data) {
        let side
        let orderId

        switch (data.type) {
            case 'received':
                const clientId = data['client_oid']
                orderId = data['order_id']
                side = data['side']
                if(this.tokens[clientId] === side) {
                    this.orders[side][orderId] = data
                }
                break;
            case 'match':
                orderId = data['taker_order_id']
                side = data['side'] === 'sell' ? 'buy' : 'sell'
                const price = parseFloat(data['price'])
                const time = new Date(data['time'])
                if(this.orders[side][orderId]) {
                    if(side === 'sell') {
                        this.strategy.positionClosed({ price, time })
                        this.selling = false
                    } else {
                        this.strategy.positionOpened({ price, time })
                        this.buying = false
                    }
                }
            default:
                break;
        }
    }

    onUserFeedError(error) {
        console.log(error)
    }





    async onBuySignal(price) {
        this.strategy.positionOpened( { price, time: new Date() })
    }

    async onSellSignal(price) {
        this.strategy.positionClosed({ price, time: new Date() })
    }


}

module.exports = exports = Trader
