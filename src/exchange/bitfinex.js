const BFX = require('bitfinex-api-node')
const config = require('configuration')
const key = require('BITFINEX_API_KEY')
const secret = require('BITFINEX_API_SECRET')

const bfx = new BFX(key, secret, { version: 1 })
const bfx2 = new BFX(key, secret, { version: 2, transform: true })

module.exports = {
    name: 'Bitfinex',
    supportShort: true,
    getBalanceForProductPair(pair) {
        return new Promise((resolve, reject) => {
            bfx.rest.wallet_balances((err, balances) => {
                if(err) { return reject(err) }

                const wallets = balances.filter(b => b.type === 'trading')
                .reduce((acc, wallet) => {
                    acc[wallet.currency] = wallet
                    return acc
                }, {})

                const currs = pair.split('-')
                let result = currs.reduce((d, p) => {
                    d[p] = wallets[p.toLowerCase()].available
                    return d
                })
                resolve(result)
            })
        })
    },

    placeBuyOrder({ price, amount, product }) {
        return new Promise((resolve, reject) => {
            const currency = product.replace('-', '').toLowerCase()
            bfx.rest.new_order(currency, amount, price, 'bitfinex', 'buy', 'limit', (err, order) => {
                if(err) { return reject(err) }
                resolve(order)
            })
        })
    },

    placeShortOrder({ price, amount, product }) {
        return new Promise((resolve, reject) => {
            const currency = product.replace('-', '').toLowerCase()
            bfx.rest.new_order(currency, amount, price, 'bitfinex', 'sell', 'limit', (err, order) => {
                if(err) { return reject(err) }
                resolve(order)
            })
        })
    },

    currentPriceForProduct(product) {
        return new Promise((resolve, reject) => {
            const currency = this.currencyForProduct(product)
            bfx2.rest.ticker(currency, (err, ticker) => {
                if(err){ return reject(err) }
                resolve({ ask: ticker.ASK, bid: ticker.BID })
            })
        })
    },

    currencyForProduct(product) {
        const reduced = product.replace('-', '').toLowerCase()
        return `t${reduced}`
    }
}
