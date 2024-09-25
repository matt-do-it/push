import { helper } from '@glimmerx/helper'

export default helper(([trend]) => {
    if (trend < 0) {
        return 'text-error'
    } else {
        return 'text-success'
    }
})
