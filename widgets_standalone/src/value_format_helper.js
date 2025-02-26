import { helper } from '@glimmerx/helper'
import * as d3 from 'd3'

import currentLocale from './locale'
import formatterFor from './formatters'

export const availableFormats = [
    'rate',
    'number',
    'float',
    'currency',
    'duration',
]

export default helper(([value, format]) => {
    if (value == null) {
        return 'NA'
    }

    return formatterFor(format)(value)
})
