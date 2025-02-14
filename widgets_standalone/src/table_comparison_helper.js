import { helper } from '@glimmerx/helper'

export default helper(([row, column]) => {
    if (column.valuePath + 'Previous' in row) {
        return row[column.valuePath + 'Previous']
    } else {
        return null
    }
})
