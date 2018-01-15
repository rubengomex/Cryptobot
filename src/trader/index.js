const Candlestick = require('candlestick')
const StrategyFactory = require('srategies/factory')
const randomToken = require('random-token')
const uuidv1 = require('uuid/v1')
const BotModel = require('models/bot')

class Trader {
    constructor({ product, gdax, amount = 0.01, interval, period = 30, isLive = false, strategy, name }) {
        this.product = product
        this.exchange = gdax
        this.client = gdax.client
        this.client.productID = product
        this.interval = interval
        this.period = period
        this.amount = amount
        this.isLive = isLive
        this.strategyType = strategy
        this.name = name
        this.state = 'initializing'
        this.tokens = {}
    }

    async start() {

        this.model = await BotModel.botWithData({
            product: this.product, 
            interval: this.interval, 
            period: this.period, 
            amount: this.amount,
            strategy: this.strategyType, 
            name: this.name,
            isLive: this.isLive
        })

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
            bot: this.model,
            isLive: this.isLive,
            onBuySignal: price => this.onBuySignal(price),
            onSellSignal: price => this.onSellSignal(price)
        })

        // Start Ticker
        this.ticker = await this.exchange.ticker({
            product: this.product,
            onTick: async data => await this.onTick(data),
            onError: this.onTickerError
        })
        // Start OrderBook

        // Start user feed
        this.userFeed = await this.exchange.userFeed({
            product: this.product,
            onUpdate: async data => await this.onUserUpdate(data),
            onError: this.onUserFeedError
        })

        // set state
    }

    // receives on tick data
    async onTick(data) {

        try {
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

            if(this.currentCandle.state === 'closed') {
                const candle = this.currentCandle
                this.currentCandle = null
                this.candlesticks.push(candle)
            }
        } catch(err) {
            console.log(err)
        }
    }

    onTickerError(error) {
        console.log(error)
    }

    async onUserUpdate(data) {
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
                    const data = { price, time, order: orderId, amount: this.amount }
                    if(side === 'sell') {
                        await this.strategy.positionClosed(data)
                        this.selling = false
                    } else {
                        await this.strategy.positionOpened(data)
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
         if(this.buying) { return }
         this.buying = true
         try {
             const token = uuidv1()
             this.tokens[token] = 'buy'
             const buyParams = {
                 size: this.amount,
                 product_id: this.product,
                 type: 'market',
                 client_oid: token
             }
             if(this.isLive) {
                 const order = await this.client.buy(buyParams)
                 if(order.message) {
                     throw new Error(order.message)
                 }
             } else {
                this.strategy.positionOpened( { price, time: new Date(), amount: this.amount })
                this.buying = false
             }
         } catch(err) {
             console.log(error)
             this.buying = false
         }
    }

    async onSellSignal(price) {
        if(this.selling) { return }
        this.selling = true

        try {
            const token = uuidv1()
            this.tokens[token] = 'sell'
            const buyParams = {
                size: this.amount,
                product_id: this.product,
                type: 'market',
                client_oid: token
            }
            if(this.isLive) {
                const order = await this.client.sell(buyParams)
                if(order.message) {
                    throw new Error(order.message)
                }
            } else {
               this.strategy.positionClosed( { price, time: new Date(), amount: this.amount })
               this.selling = false
            }
        } catch(err) {
            console.log(error)
            this.selling = false
        }
    }


}

module.exports = exports = Trader
