import { helper } from '@glimmerx/helper'
import * as d3 from 'd3'

import { endOfPeriod, formatDateHuman } from './date_calc_util';

const dateFormatter = d3.utcFormat('%d.%m.%Y')

export default helper(([date, display]) => {
    if (!date) {
        return 'NA'
    }

    return formatDateHuman(date, display)
})


