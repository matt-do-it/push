import { deDE } from 'date-fns/locale'
import * as d3 from 'd3'

let formats = {
    currency: '$,.2f',
    rate: '.2%',
    number: ',.0f',
    float: ',.2f',
}

export function formatFor(format) {
    if (format == 'number') {
        return formats.number
    }
    if (format == 'float') {
        return formats.float
    }
    if (format == 'rate') {
        return formats.rate
    }
    if (format == 'currency') {
        return formats.currency
    }
    return formats.number
}

export default formats
