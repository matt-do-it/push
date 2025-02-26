import { helper } from '@glimmerx/helper'

export const availableDisplays = ['isoweek', 'isoquarter', 'isoyear']

export default helper(([display, format]) => {
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
