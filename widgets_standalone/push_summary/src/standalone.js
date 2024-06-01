import { renderComponent } from "@glimmerx/core";

import DataService from "./data_service";
import DateCalcService from "./date_service";

import PushSummaryComponent from "./push_summary";

import "./style.css";

export default async function pushEmbed(component, element, dataService, args) {
  renderComponent(component, {
    element: document.getElementById(element),
    args: args,
    services: {
      data: dataService,
      dateCalc: new DateCalcService(),
    },
  });
}

export { pushEmbed, PushSummaryComponent, DataService };