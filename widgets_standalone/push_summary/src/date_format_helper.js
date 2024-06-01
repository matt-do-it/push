import { helper } from "@glimmerx/helper";
import * as d3 from "d3";

const dateFormatter = d3.utcFormat("%d.%m.%Y");
export default helper(([date, format]) => {
  const parsedDate = new Date(Date.parse(date));

  return dateFormatter(parsedDate);
});
