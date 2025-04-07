import { helper } from '@glimmerx/helper'

export default helper(([row, column]) => {
    if (column.valuePath + 'Trend' in row && row[column.valuePath + 'Trend'] && column.isTrendValue) {
        return true
    } else {
        return false
    }
})
