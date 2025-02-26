import formats from './formats'
import { germanLocaleSpec } from './locale'

const vegaConfig = function () {
    return {
        numberFormat: formats.numberFormat,
        locale: { number: germanLocaleSpec },
    }
}

export default vegaConfig
