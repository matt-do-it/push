import { helper } from "@glimmerx/helper";
import * as d3 from "d3";

export const numberFormatter = d3.format(",.1f");

export default helper(([value, format]) => {
  return numberFormatter(value);
});
