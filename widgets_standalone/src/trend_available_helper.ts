import { helper } from '@glimmerx/helper'

export default helper(([row, column]) => {
    if (column.valuePath + 'Trend' in row && row[column.valuePath + 'Trend']) {
        return true
    } else {
        return false
    }
})
