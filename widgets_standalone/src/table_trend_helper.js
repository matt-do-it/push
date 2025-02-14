import { helper } from '@glimmerx/helper'

export default helper(([row, column]) => {
    if (column.valuePath + 'Trend' in row) {
        return row[column.valuePath + 'Trend']
    } else {
        return null
    }
})
