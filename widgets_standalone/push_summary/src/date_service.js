import { tracked } from "@glimmerx/component";
import * as d3 from "d3";
import * as dayjs from "dayjs";
import * as isoWeek from "dayjs/plugin/isoWeek"; // import plugin
import * as isLeapYear from "dayjs/plugin/isLeapYear";
import * as isoWeeksInYear from "dayjs/plugin/isoWeeksInYear";

export default class DateCalcService {
  constructor() {}

  previousDate(stringDate, display, periods) {
    dayjs.extend(isoWeek); // use plugin
    dayjs.extend(isLeapYear); // use plugin
    dayjs.extend(isoWeeksInYear); // use plugin

    let d = dayjs(stringDate);

    let startOfWeek = d.startOf("isoweek");

    let previousDate = startOfWeek;
    if (display == "isoweek") {
      previousDate = startOfWeek;
      previousDate = startOfWeek.subtract(periods, "week");
    }
    if (display == "isoquarter") {
      for (let i = 0; i < periods; i++) {
        let weekOfPreviousPeriod = previousDate.subtract(1, "week").isoWeek();

        let substractWeeks = 13;
        if (weekOfPreviousPeriod == 53) {
          substractWeeks = 14;
        }
        previousDate = previousDate.subtract(substractWeeks, "week");
      }
    }
    if (display == "isoyear") {
      previousDate = startOfWeek.isoWeek(1);

      for (let i = 0; i < periods; i++) {
        let weeksInPreviousPeriod = previousDate
          .subtract(1, "week")
          .isoWeeksInYear();
        previousDate = previousDate.subtract(weeksInPreviousPeriod, "week");
      }
    }

    return previousDate.format("YYYY-MM-DD");
  }
}
