const Gdax = require('gdax')
const config = require('configuration')
const key = config.get('GDAX_API_KEY')
const secret = config.get('GDAX_API_SECRET')
const passphrase = config.get('GDAX_API_PASSPHRASE')
const apiURL = config.get('GDAX_API_URL_SANDBOX')
const wsURL = config.get('GDAX_WS_FEED_SANDBOX')

//Public client
//const client = new Gdax.PublicClient(apiURL)
// Authenticated client
const client = new Gdax.AuthenticatedClient(key, secret, passphrase, apiURL)

module.exports = {
    client,
    ticker({ product, onTick, onError }) {
        const socket = new Gdax.WebsocketClient(
            [product],
            wsURL,
            { key, secret, passphrase},
            { channels: ['ticker', 'heartbeat'] }
        )

        socket.on('message', data => {
            if(data.type === 'heartbeat') { return }
            onTick(data)
        })

        socket.on('error', err => {
            onError(err)
            socket.connect()
        })

        socket.on('close', () => socket.connect())

        return socket
    },

    userFeed({ product, onUpdate, onError }) {
        const socket = new Gdax.WebsocketClient(
            [product],
            wsURL,
            { key, secret, passphrase },
            { channels: ['user','heartbeat'] }
        )

        socket.on('message', data => {
            if(data.type === 'heartbeat') { return }
            onUpdate(data)
        })

        socket.on('error', err => {
            onError(err)
            socket.connect()
        })

        socket.on('close', () => socket.connect())

        return socket
    }
}
