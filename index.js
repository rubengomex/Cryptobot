const program = require('commander')
const pkg = require('./package.json')
const Trader = require('trader')
const Backtester = require('backtester')
const {gdax} = require('exchange')
const database = require('database')

program.version(pkg.version)
    .option('-t, --type [type]', 'Run type', 'backtest')
    .option('-p, --product [product]', 'Product', 'BTC-EUR')
    .parse(process.argv)

const main = async () => {
    const options = { gdax, product: program.product, interval: 300 };

    switch (program.type) {
        case 'trade':
            const trader = new Trader(options)
            await trader.start()
            break
        case 'backtest':
            const backtester = new Backtester({
                ...options, 
                period: 30,
                startTime: new Date() - (24 * 60 * 60),
                endTime: new Date() - 60
            })
            await backtester.start()
            break
        default:
            console.log('Begin backtest')
            break
    }
}

main()
// database.connect()
