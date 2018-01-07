
class CCISignal {
    constructor({ cci, upper = 100, lower = -100}) {
        this.cci = cci
        this.upper = upper
        this.lower = lower
    }

    shouldSell() {
        const data = cci.getResults().reverse()
        const threshold = this.upper
        if(data.length === 0) { return false }

        const [first] = data

        if(first < threshold) { return }

        let crossed = false
        const crossedIndex = data.reduce((acc, val, index) => {
            if(crossed) { return acc }
            if(val > threshold) {
                return val.offset
            }

            if(acc !== null){
                crossed = true
                return index
            }

            return null
        }, null)

        if(crossedIndex !== null) { return false}

        return true
    }
}

module.exports = exports = CCISignal
