import { helper } from '@glimmerx/helper'
import * as d3 from 'd3'

import { endOfPeriod, formatDateHuman } from './date_calc_util';

const dateFormatter = d3.utcFormat('%d.%m.%Y')

export default helper(([minDate, maxDate, display]) => {
    if (!minDate || !maxDate) {
        return 'NA'
    }

    let startDate = minDate;
    let endDate = endOfPeriod(maxDate, display);
        
    return formatDateHuman(startDate, display) + ' - ' + formatDateHuman(endDate, display)
})


