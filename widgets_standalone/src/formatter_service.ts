import { deDE } from 'date-fns/locale'
import {
    sub,
    parseISO,
    formatISO,
    format,
    startOfISOWeekYear,
    subISOWeekYears,
    addISOWeekYears,
    addWeeks,
    subWeeks,
    subYears,
    startOfQuarter,
    endOfISOWeek,
    endOfQuarter,
    endOfYear,
    parse,
    add,
    subQuarters,
    startOfISOWeek,
    getISOWeekYear,
    getISOWeek,
    setISOWeek,
    setISOWeekYear,
} from 'date-fns'
import * as d3 from 'd3'

class DurationFormatter {
    format(n) {
        var sec_num = parseInt(n, 10) // don't forget the second param
        var hours = Math.floor(sec_num / 3600)
        var minutes = Math.floor((sec_num - hours * 3600) / 60)
        var seconds = sec_num - hours * 3600 - minutes * 60

        if (hours < 10) {
            hours = '0' + hours
        }
        if (minutes < 10) {
            minutes = '0' + minutes
        }
        if (seconds < 10) {
            seconds = '0' + seconds
        }

        var formatted = seconds + ' s'
        if (minutes > 0) {
            formatted = minutes + ' m ' + formatted
        }
        if (hours > 0) {
            formatted = hours + 'h ' + formatted
        }
        return formatted
    }
}

class D3NumberFormatter {
    constructor(locale, d3Format) {
        this.d3Formatter = locale.format(d3Format)
    }

    format(n) {
        return this.d3Formatter(n)
    }
}

class D3TimeFormatter {
    constructor(locale, d3Format) {
        this.d3Formatter = d3.timeFormat(d3Format)
    }

    format(n) {
        return this.d3Formatter(n)
    }
}

export default class FormatterService {
    constructor() {
        this.timeWeekFormat = 'W%V.%G'
        this.timeQuarterFormat = '%Y'
        this.timeYearFormat = '%G'

        this.timeWeekFormatter = new D3TimeFormatter(
            this.locale,
            this.timeWeekFormat
        )
        this.timeQuarterFormatter = new D3TimeFormatter(
            this.locale,
            this.timeQuarterFormat
        )
        this.timeYearFormatter = new D3TimeFormatter(
            this.locale,
            this.timeYearFormat
        )

        this.durationFormatter = new DurationFormatter()
    }

    get localeDefinition() {
        return {
            decimal: ',',
            thousands: '.',
            grouping: [3],
            currency: ['€', ''],
            dateTime: '%a %b %e %X %Y',
            date: '%d.%m.%Y',
            time: '%H:%M:%S',
            periods: ['AM', 'PM'],
            days: [
                'Sonntag',
                'Montag',
                'Dienstag',
                'Mittwoch',
                'Donnerstag',
                'Freitag',
                'Samstag',
            ],
            shortDays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
            months: [
                'Januar',
                'Februar',
                'März',
                'April',
                'Mai',
                'Juni',
                'Juli',
                'August',
                'September',
                'Oktober',
                'November',
                'Dezember',
            ],
            shortMonths: [
                'Jan',
                'Feb',
                'Mär',
                'Apr',
                'Mai',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Okt',
                'Nov',
                'Dez',
            ],
        }
    }
    get locale() {
        return d3.formatLocale(this.localeDefinition)
    }

    get numberFormat() {
        return ',.0f'
    }

    get number() {
        return this.locale.format(this.numberFormat)
    }

    get floatFormat() {
        return ',.2f'
    }

    get float() {
        return this.locale.format(this.floatFormat)
    }

    get currencyFormat() {
        return '$,.2f'
    }

    get currency() {
        return this.locale.format(this.currencyFormat)
    }

    get trendFormat() {
        return '+.1%'
    }
    get trend() {
        return this.locale.format(this.trendFormat)
    }

    get rateFormat() {
        return '.2%'
    }
    get rate() {
        return this.locale.format(this.rateFormat)
    }

    get duration() {
        return function (n) {
            var sec_num = parseInt(n, 10) // don't forget the second param
            var hours = Math.floor(sec_num / 3600)
            var minutes = Math.floor((sec_num - hours * 3600) / 60)
            var seconds = sec_num - hours * 3600 - minutes * 60

            if (hours < 10) {
                hours = '0' + hours
            }
            if (minutes < 10) {
                minutes = '0' + minutes
            }
            if (seconds < 10) {
                seconds = '0' + seconds
            }

            var formatted = seconds + ' s'
            if (minutes > 0) {
                formatted = minutes + ' m ' + formatted
            }
            if (hours > 0) {
                formatted = hours + 'h ' + formatted
            }
            return formatted
        }
    }

    formatFor(format) {
        if (format == 'currency') {
            return this.currencyFormat
        }
        if (format == 'rate') {
            return this.rateFormat
        }
        if (format == 'float') {
            return this.floatFormat
        }
        if (format == 'duration') {
            return this.numberFormat
        }
        return this.numberFormat
    }

    for(format) {
        if (format == 'currency') {
            return this.currency
        }
        if (format == 'rate') {
            return this.rate
        }
        if (format == 'float') {
            return this.float
        }
        if (format == 'duration') {
            return this.duration
        }
        return this.number
    }

    date(display) {
        if (display == 'isoyear') {
            return this.timeYearFormatter
        }
        if (display == 'isoquarter') {
            return this.timeQuarterFormatter
        }
        if (display == 'isoweek') {
            return this.timeWeekFormatter
        }
    }

    dateFormat(display) {
        if (display == 'isoyear') {
            return this.timeYearFormat
        }
        if (display == 'isoquarter') {
            return this.timeQuarterFormat
        }
        if (display == 'isoweek') {
            return this.timeWeekFormat
        }
    }

    formattedDateStringCurrent(parsedDate, display) {
        if (!parsedDate) {
            return 'NA'
        }
        if (display == 'isoyear') {
            let startDate = parsedDate
            let endDate = sub(this.addISOYears(parsedDate, 1), { days: 1 })
            return (
                this.formatDateHuman(startDate) +
                ' - ' +
                this.formatDateHuman(endDate)
            )
        }
        if (display == 'isoquarter') {
            let startDate = parsedDate
            let endDate = sub(this.addISOQuarters(parsedDate, 1), { days: 1 })
            return (
                this.formatDateHuman(startDate) +
                ' - ' +
                this.formatDateHuman(endDate) +
                ' (' +
                'Q' +
                (Math.floor(getISOWeek(parsedDate) / 13) + 1) +
                ')'
            )
        }
        if (display == 'isoweek') {
            let startDate = parsedDate
            let endDate = sub(this.addISOWeeks(parsedDate, 1), { days: 1 })
            return (
                this.formatDateHuman(startDate) +
                ' - ' +
                this.formatDateHuman(endDate) +
                ' (' +
                'W' +
                getISOWeek(startDate) +
                ')'
            )
        }
    }

    formattedDateStringHistory(dateStartParsed, dateEndParsed, display) {
        if (!dateStartParsed || !dateEndParsed) {
            return 'NA'
        }
        if (display == 'isoyear') {
            let startDate = dateStartParsed
            let endDate = sub(this.addISOYears(dateEndParsed, 1), { days: 1 })
            return (
                this.formatDateHuman(startDate) +
                ' - ' +
                this.formatDateHuman(endDate)
            )
        }
        if (display == 'isoquarter') {
            let startDate = dateStartParsed
            let endDate = sub(this.addISOQuarters(dateEndParsed, 1), {
                days: 1,
            })
            return (
                this.formatDateHuman(startDate) +
                ' - ' +
                this.formatDateHuman(endDate)
            )
        }
        if (display == 'isoweek') {
            let startDate = dateStartParsed
            let endDate = sub(this.addISOWeeks(dateEndParsed, 1), { days: 1 })
            return (
                this.formatDateHuman(startDate) +
                ' - ' +
                this.formatDateHuman(endDate)
            )
        }
    }

    formatDateHuman(d) {
        return format(d, 'dd.MM.yyyy')
    }

    parseISO(d) {
        return parseISO(d)
    }

    formatISO(d) {
        return formatISO(d, { representation: 'date' })
    }

    addISOYears(d, amount) {
        const startDate = startOfISOWeekYear(d)
        return addISOWeekYears(startDate, amount)
    }

    subISOYears(d, amount) {
        const startDate = startOfISOWeekYear(d)
        return subISOWeekYears(startDate, amount)
    }

    addISOQuarters(d, amount) {
        const startDate = startOfISOWeek(d)

        const isoYear = getISOWeekYear(startDate)
        const isoWeek = getISOWeek(startDate)

        const yearquarter = isoYear * 100 + (Math.floor(isoWeek / 13) / 4) * 100

        const yearquarterSub = yearquarter + amount * 25

        const quarterAlignedIsoYear = Math.floor(yearquarterSub / 100)
        const quarterAlignedIsoWeek =
            ((yearquarterSub % 100) / 100) * 4 * 13 + 1

        const quarterAlignedDate = setISOWeek(
            setISOWeekYear(new Date(1900, 0, 1), quarterAlignedIsoYear),
            quarterAlignedIsoWeek
        )
        return quarterAlignedDate
    }

    subISOQuarters(d, amount) {
        const startDate = startOfISOWeek(d)

        const isoYear = getISOWeekYear(startDate)
        const isoWeek = getISOWeek(startDate)

        const yearquarter =
            isoYear * 100 + (Math.floor((isoWeek - 1) / 13) / 4) * 100

        const yearquarterSub = yearquarter - amount * 25

        const quarterAlignedIsoYear = Math.floor(yearquarterSub / 100)
        const quarterAlignedIsoWeek =
            ((yearquarterSub % 100) / 100) * 4 * 13 + 1

        const quarterAlignedDate = setISOWeek(
            setISOWeekYear(new Date(1900, 0, 1), quarterAlignedIsoYear),
            quarterAlignedIsoWeek
        )
        return quarterAlignedDate
    }

    addISOWeeks(d, amount) {
        const startDate = startOfISOWeek(d)
        return addWeeks(startDate, amount)
    }

    subISOWeeks(d, amount) {
        const startDate = startOfISOWeek(d)
        return subWeeks(startDate, amount)
    }

    startDateForHistory(dateEnd, display) {
        if (display == 'isoyear') {
            return this.subISOYears(dateEnd, 3)
        }
        if (display == 'isoquarter') {
            return this.subISOQuarters(dateEnd, 5)
        }
        if (display == 'isoweek') {
            return this.subISOWeeks(dateEnd, 8)
        }
    }

    get vegaConfig() {
        return {
            numberFormat: this.numberFormat,
            locale: {
                number: this.localeDefinition,
            },
        }
    }
}
