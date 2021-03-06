const colors = require('colors')

class Trade {
    constructor({ price, time, model, amount }) {
        this.state = 'open'
        this.enter = { price, time, amount }
        this.exit = null
        this.model = model
        this.amount = amount
    }

    close({ price, time, amount, model }) {
        this.exit = { price, time, amount }
        this.state = 'closed'
        this.amount = amount
        this.model = model
    }

    profit() {
        const fee = 0.0025
        const entrance = this.enter.price * (1 + fee)
        const exit = this.exit.price * (1 - fee)

        return exit - entrance
    }

    print() {
        const enter = `Enter: | ${this.enter.price} | ${this.enter.time}`
        const exit = this.exit ? `Exit - | ${this.exit.price} | ${this.exit.time}` : ''
        let profit = ''

        if(this.state === 'closed') {
            const pro= `${this.profit()}`
            const coloredProfit = this.profit > 0 ? colors.green(pro) : colors.red(pro)
            profit = ` - Profit: ${coloredProfit}`
        }

        console.log(`${enter} - ${exit} - ${profit}`)
    }
}

module.exports = exports = Trade
