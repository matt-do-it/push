import { tracked } from '@glimmerx/component'
import * as d3 from 'd3'
import * as dayjs from 'dayjs'
import * as isoWeek from 'dayjs/plugin/isoWeek' // import plugin
import * as isLeapYear from 'dayjs/plugin/isLeapYear'
import * as isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear'

dayjs.extend(isoWeek) // use plugin
dayjs.extend(isLeapYear) // use plugin
dayjs.extend(isoWeeksInYear) // use plugin

export function formatDateHuman(date, display) {
	let d = dayjs(date);
	
	if (display == "isoyear") {
	    return d.format('YYYY')
	}
	if (display == "isoquarter") {
	    return d.format('DD.MM.YYYY') + " (Q" + getIsoQuarter(d) + ")"
	}
	if (display == "isoweek") {
	    return d.format('DD.MM.YYYY') + " (W" + d.isoWeek() + ")"
	}
    return d.format('DD.MM.YYYY')
}

export function getIsoQuarter(dayDate) {
	return Math.ceil(dayDate.isoWeek() / 13);
}

export function endOfPeriod(date, display) {
	let d = dayjs(date)
	
	let e = d; 
	
	if (display == "isoweek") {
		e = d
                .add(1, 'week')
                .subtract(1, 'day')
	} else if (display == "isoquarter") {
		if (d.isoWeeksInYear() == 53 && d.weekOfYear() == 40) {
			e = d
					.add(14, 'week')
					.subtract(1, 'day')
		} else {
			e = d
					.add(13, 'week')
					.subtract(1, 'day')
		}
	} else if (display == "isoyear") {
		if (d.isoWeeksInYear() == 53) {
			e = d
					.add(53, 'week')
					.subtract(1, 'day')
		} else {
			e = d
					.add(52, 'week')
					.subtract(1, 'day')
		}
	}

	return e.format('YYYY-MM-DD')
}


export function previousDate(stringDate, display, periods) {
    let d = dayjs(stringDate)

    let startOfWeek = d.startOf('isoweek')

    let previousDate = startOfWeek
    if (display == 'isoweek') {
        previousDate = startOfWeek
        previousDate = startOfWeek.subtract(periods, 'week')
    }
    if (display == 'isoquarter') {
        for (let i = 0; i < periods; i++) {
            let weekOfPreviousPeriod = previousDate
                .subtract(1, 'week')
                .isoWeek()

            let substractWeeks = 13
            if (weekOfPreviousPeriod == 53) {
                substractWeeks = 14
            }
            previousDate = previousDate.subtract(substractWeeks, 'week')
        }
    }
    if (display == 'isoyear') {
        previousDate = startOfWeek.isoWeek(1)

        for (let i = 0; i < periods; i++) {
            let weeksInPreviousPeriod = previousDate
                .subtract(1, 'week')
                .isoWeeksInYear()
            previousDate = previousDate.subtract(weeksInPreviousPeriod, 'week')
        }
    }

    return previousDate.format('YYYY-MM-DD')
}
