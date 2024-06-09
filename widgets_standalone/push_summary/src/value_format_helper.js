import { helper } from "@glimmerx/helper";
import * as d3 from "d3";

import currentLocale from "./locale";

export const numberFormatter = currentLocale().format(",.1f");
export const rateFormatter = currentLocale().format(".2%");

export const multiFormatter = function (value, format) {
  if (value == null) {
    return "NA";
  }

  if (format == "number") {
    return numberFormatter(value);
  }
  if (format == "rate") {
    return rateFormatter(value);
  }

  return "Unknown format";
};

export default helper(([value, format]) => {
  return multiFormatter(value, format);
});
