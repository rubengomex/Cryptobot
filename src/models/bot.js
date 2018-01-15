const mongoose = require('mongoose')
const {Schema} = mongoose


const BotSchema = new Schema({
    name: {
        type: String,
        required: true,
        index:{
            unique: true
        }
    },
    type: {
        type: String,
        enum: ['trader'],
        required: true
    },
    product: {
        type: String,
        required: true
    },
    strategy: {
        type: String
    },
    period: {
        type: String
    },
    amount: {
        type: Number
    },
    interval: {
        type: Number
    },
    isLive : {
        type: Boolean,
        required: true
    }
})

const Bot = mongoose.model('Bot', BotSchema)

BotSchema.statics.botWithData = async ({name, product, strategy, period, amount, interval}) => {
    const bot = await Bot.findOneAndUpdate({ name, product, strategy, period, amount, period}, {}, {
        new: true,
        runValidators: true,
        upsert: true
    })

    return bot
}

BotSchema.statics.botWithName = async name => {
    const bot = await Bot.findOne({ name })

    if(bot) { return bot }
}


module.exports = exports = Bot
