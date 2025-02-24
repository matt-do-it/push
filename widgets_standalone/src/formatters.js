import formats from './formats'
import currentLocale from './locale'

export const numberFormatter = currentLocale().format(formats.number)
export const floatFormatter = currentLocale().format(formats.float)
export const rateFormatter = currentLocale().format(formats.rate)
export const currencyFormatter = currentLocale().format(formats.currency)

export const durationFormatter = function (n) {
            var sec_num = parseInt(n, 10); // don't forget the second param
            var hours = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - hours * 3600) / 60);
            var seconds = sec_num - hours * 3600 - minutes * 60;

            if (hours < 10) {
                hours = "0" + hours;
            }
            if (minutes < 10) {
                minutes = "0" + minutes;
            }
            if (seconds < 10) {
                seconds = "0" + seconds;
            }

            var formatted = seconds + " s";
            if (minutes > 0) {
                formatted = minutes + " m " + formatted;
            }
            if (hours > 0) {
                formatted = hours + "h " + formatted;
            }
            return formatted;
        };

export default function formatterFor(format) {
	if (format == "number") {
		return numberFormatter;
	}
	if (format == "float") {
		return floatFormatter;
	}
	if (format == "rate") {
		return rateFormatter;
	}
	if (format == "currency") {
		return currencyFormatter;
	}
	if (format == "duration") {
		return durationFormatter;
	}
	
	return numberFormatter; 
}