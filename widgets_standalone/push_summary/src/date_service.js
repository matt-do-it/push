import { tracked } from "@glimmerx/component";
import * as d3 from "d3";

export default class DateCalcService {
  constructor() {}

  previousDate(stringDate, display, periods) {
    let date = Date.parse(stringDate);
    if (date == null) {
      return null;
    }

    let previousDate = d3.utcMonday.floor(date);
    if (+previousDate !== +date) {
      console.log("date not week aligned");
      console.log(date);
      console.log(previousDate);
      return null;
    }

    if (display == "isoweek") {
      previousDate.setDate(previousDate.getDate() - 7 * periods);
    }
    if (display == "isoquarter") {
      // Convert date to ISOweeks and then to isoquarter
      // Substract isoyears
    }

    return previousDate.toISOString().substring(0, 10);
  }
}
