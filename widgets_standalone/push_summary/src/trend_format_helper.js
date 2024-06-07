import { helper } from "@glimmerx/helper";
import * as d3 from "d3";

const trendFormatter = d3.format(",.1%");

export default helper(([value, format]) => {
  if (value == null) {
    return "NA";
  }
  return trendFormatter(value);
});
