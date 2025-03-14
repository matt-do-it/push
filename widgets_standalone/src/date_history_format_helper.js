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

export default helper(([date, display]) => {
    if (!date) {
        return 'NA'
    }

    const parsedDate = new Date(Date.parse(date))

    if (!parsedDate) {
        return 'NA'
    }

    if (display == 'isoyear') {
        let startDate = startDateForHistory(parsedDate, display)
        let endDate = sub(addISOYears(parsedDate, 1), { days: 1 })
        return formatDateHuman(startDate) + ' - ' + formatDateHuman(endDate)
    }
    if (display == 'isoquarter') {
        let startDate = startDateForHistory(parsedDate, display)
        let endDate = sub(addISOQuarters(parsedDate, 1), { days: 1 })
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
        let startDate = startDateForHistory(parsedDate, display)
        let endDate = sub(addISOWeeks(parsedDate, 1), { days: 1 })
        return (
            formatDateHuman(startDate) +
            ' - ' +
            formatDateHuman(endDate) +
            ' (' +
            'W' +
            getISOWeek(endDate) +
            ')'
        )
    }
})

function startDateForHistory(dateEnd, display) {
    if (display == 'isoyear') {
        return addISOYears(dateEnd, -3)
    }
    if (display == 'isoquarter') {
        return addISOQuarters(dateEnd, -5)
    }
    if (display == 'isoweek') {
        return addISOWeeks(dateEnd, -8)
    }
}

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
