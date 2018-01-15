const mongoose = require('mongoose')
const {Schema} = mongoose

const TradeSchema = new Schema({
    state: {
        type: String,
        enum: ['open', 'closed']
    },
    enter: {
        price: Number,
        time: Date,
        amount: Number,
        order:{
            type: String
        }
    },
    exit: {
        price: Number,
        time: Date,
        amount: Number, 
        order: {
            type: String
        }
    },
    bot: {
        type: Schema.Types.ObjectId,
        ref: 'Bot',
        required: true
    }
})

const Trade = mongoose.model('Trade', TradeSchema)

module.exports = exports = Trade
