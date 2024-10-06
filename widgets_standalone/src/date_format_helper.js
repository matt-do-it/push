import { helper } from '@glimmerx/helper'
import * as d3 from 'd3'

import locale from './locale'

const isoweekFormatter = d3.utcFormat('%d.%m.%Y')
const isoquarterFormatter = d3.utcFormat('%d.%m.%Y')
const isoyearFormatter = d3.utcFormat('%d.%m.%Y')

export default helper(([date, display]) => {
    if (date == null) {
        return 'NA'
    }
    const parsedDate = new Date(Date.parse(date))

    if (display == 'isoweek') {
        return isoweekFormatter(parsedDate)
    }
    if (display == 'isoquarter') {
        return isoweekFormatter(parsedDate)
    }
    if (display == 'isoyear') {
        return isoyearFormatter(parsedDate)
    }

    return 'Unknown format'
})
