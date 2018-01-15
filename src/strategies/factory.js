const Crossover = require('./crossover')
const SimpleCCI = require('./cci')
const Volume = require('./volume')

exports.create = function(data) {
    switch (data.type) {
        case 'crossover':
            return new Crossover(data)
        case 'volume': 
            return new Volume(data)
        default:
            return new SimpleCCI(data)
    }
}
