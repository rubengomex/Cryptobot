const program = require('commander')
const pkg = require('./package.json')
const Trader = require('trader')
const Backtester = require('backtester')
const Arbitrage = require('arbitrage')
const database = require('database')
const { gdax, kraken, bitstamp, bitfinex} = require('exchange')

program.version(pkg.version)
    .option('-t, --type [type]', 'Run type [backtest, trade, arbitrage]', 'backtest')
    .option('-p, --product [product]', 'Product [BTC-EUR, LTC-EUR, ETH-EUR]', 'BTC-EUR')
    .option('-s, --short [shortExchange]', 'The exchange to short on (arbitrage only)', 'kraken')
    .option('-l, --long [longExchange]', 'The exchange to long on (arbitrage only)', 'bitstamp')
    .option('-L, --live', 'Run live in arbitrage')
    .option('-a, --amount <n>', 'The amount for [arbitrage, trader]', parseFloat)
    .option('-S, --strategy [strategy]', 'The strategy to use [crossover, cci, volume]', 'cci')
    .option('-P, --period <n>', 'The period use', parseInt)
    .option('-h, --hours <n>', 'The number of hours in the past', parseInt, 0)
    .option('-d, --days <n>', 'The number of days int the past', parseInt, 0)
    .option('-n, --name [name]', 'The name of the bot', undefined)
    .parse(process.argv)

const main = async () => {
    const options = { gdax, product: program.product, interval: 300 };

    switch (program.type) {
        case 'trade':
            if(!program.name) { throw new Error('Bot needs a name') }

            await database.connect()
            const trader = new Trader({
                ...options,
                isLive: program.live,
                period: program.period,
                strategy: program.strategy,
                amount: program.amount,
                name: program.name
            })
            await trader.start()
            break
        case 'backtest':
            const days = program.days * 24 * 60 * 60
            const hours = program.hours * 60 * 60
            const now = new Date() - (days + hours + (-1 * 60)) * 1000 
            const backtester = new Backtester({
                ...options,
                period: program.period,
                start: new Date(now - 36 * 60 * 60 * 1000),
                end: new Date(now),
                strategy: program.strategy,
            })  
            await backtester.start()
            break
        case 'arbitrage':
            const live = program.live
            const longExchange = program.longExchange
            const shortExchange = program.shortExchange
            const amount = program.amount || 10
            const arbitrage = new Arbitrage({
                product: program.product,
                amount,
                exchanges: [bitfinex.load(), bitstamp.load()]
            })
            await arbitrage.start()
            break
        default:
            console.log('Begin backtest')
            break
    }
}

main()
