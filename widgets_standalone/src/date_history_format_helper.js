import { helper } from '@glimmerx/helper'
import { deDE } from 'date-fns/locale'
import {
    sub,
    addDays,
    format,
    subWeeks,
    subQuarters,
    subYears,
    startOfQuarter,
    endOfISOWeek,
    endOfQuarter,
    endOfYear,
    parse,
    add,
    parseISO,
    formatISO,
    startOfISOWeekYear,
    subISOWeekYears,
    addISOWeekYears,
    addWeeks,
    startOfISOWeek,
    getISOWeekYear,
    getISOWeek,
    setISOWeek,
    setISOWeekYear,
} from 'date-fns'
import * as d3 from 'd3'

const dateFormatter = d3.utcFormat('%d.%m.%Y')

export default helper(([startDate, endDate, display]) => {
    if (!startDate || !endDate) {
        return 'NA'
    }

    const parsedStartDate = new Date(Date.parse(startDate))
    const parsedEndDate = new Date(Date.parse(endDate))

    if (!parsedStartDate || !parsedEndDate) {
        return 'NA'
    }

    if (display == 'isoyear') {
        let startDate = parsedStartDate
        let endDate = sub(addISOYears(parsedEndDate, 1), { days: 1 })
        return formatDateHuman(startDate) + ' - ' + formatDateHuman(endDate)
    }
    if (display == 'isoquarter') {
        let startDate = parsedStartDate
        let endDate = sub(addISOQuarters(parsedEndDate, 1), { days: 1 })
        return (
            formatDateHuman(startDate) +
            ' - ' +
            formatDateHuman(endDate) +
            ' (' +
            'Q' +
            (Math.floor(getISOWeek(parsedDate) / 13) + 1) +
            ')'
        )
    }
    if (display == 'isoweek') {
        let startDate = parsedStartDate
        let endDate = sub(addISOWeeks(parsedEndDate, 1), { days: 1 })
        return (
            formatDateHuman(startDate) +
            ' - ' +
            formatDateHuman(endDate) +
            ' (' +
            'W' +
            getISOWeek(startDate) +
            ')'
        )
    }
})

function formatDateHuman(d) {
    return format(d, 'dd.MM.yyyy')
}

function addISOYears(d, amount) {
    const startDate = startOfISOWeekYear(d)
    return addISOWeekYears(startDate, amount)
}

function addISOQuarters(d, amount) {
    const startDate = startOfISOWeek(d)

    const isoYear = getISOWeekYear(startDate)
    const isoWeek = getISOWeek(startDate)

    const yearquarter = isoYear * 100 + (Math.floor(isoWeek / 13) / 4) * 100

    const yearquarterSub = yearquarter + amount * 25

    const quarterAlignedIsoYear = Math.floor(yearquarterSub / 100)
    const quarterAlignedIsoWeek = ((yearquarterSub % 100) / 100) * 4 * 13 + 1

    const quarterAlignedDate = setISOWeek(
        setISOWeekYear(new Date(1900, 0, 1), quarterAlignedIsoYear),
        quarterAlignedIsoWeek
    )
    return quarterAlignedDate
}

function addISOWeeks(d, amount) {
    const startDate = startOfISOWeek(d)
    return addWeeks(startDate, amount)
}
