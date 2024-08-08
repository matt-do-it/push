import { helper } from '@glimmerx/helper'

export default helper(([display, format]) => {
    return 'Wochen'
    if (display == 'isoweek') {
        return 'Wochen'
    }
    if (display == 'isoquarter') {
        return 'Quartale'
    }
    if (display == 'isoyear') {
        return 'Jahre'
    }
    return display
})
