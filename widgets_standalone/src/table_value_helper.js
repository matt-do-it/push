import { helper } from '@glimmerx/helper'

export default helper(([row, column]) => {
    if (column.valuePath in row) {
        return row[column.valuePath]
    } else {
        return null
    }
})
