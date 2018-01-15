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
    .option('-a, --amount <n>', 'The amount for arbitrage', parseFloat)
    .option('-S, --strategy [strategy]', 'The strategy to use (crossover, cci, volume)')
    .option('-P, --period <n>', 'The period to invest on trade (trade and backtest use only', parseFloat)
    .parse(process.argv)

const main = async () => {
    const options = { gdax, product: program.product, interval: 300 };

    switch (program.type) {
        case 'trade':
            const trader = new Trader({
                ...options,
                period: program.period,
                strategy: program.strategy
            })
            await trader.start()
            break
        case 'backtest':
            const now = new Date() - 1 * 60 * 1000
            const backtester = new Backtester({
                ...options,
                strategy: program.strategy,
                period: program.period,
                start: new Date(now - 24 * 60 * 60 * 1000),
                end: new Date(now)
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
                exchanges: [kraken, bitstamp]
            })
            await arbitrage.start()
            break
        default:
            console.log('Begin backtest')
            break
    }
}

main()
// database.connect()
