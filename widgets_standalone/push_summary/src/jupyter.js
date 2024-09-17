import { renderComponent } from '@glimmerx/core'

import DataService from './data_service'
import DateCalcService from './date_service'

import PushSummaryComponent from './push_summary'

import './style.css'

export async function pushEmbed(component, element, dataService, args) {
    renderComponent(component, {
        element: document.getElementById(element),
        args: args,
        services: {
            data: dataService,
            dateCalc: new DateCalcService(),
        },
    })
}

function embed(component, dataService, args) {
    let element = document.createElement('div')
    renderComponent(PushSummaryComponent, {
        element: element,
        args: args,
        services: {
            data: dataService,
            dateCalc: new DateCalcService(),
        },
    })
    return element
}

let dataServiceTotal = new DataService(); 
      
dataServiceTotal.groupColumns = ["date"];
dataServiceTotal.rollup = { value: "op.sum(d.value)" };
          
function render({ model, el }) {
    dataServiceTotal.fromArrow(model.get("value").buffer);
    
    let totals = embed(PushSummaryComponent, dataServiceTotal, {
          title: "Zusammenfassung",
          benchmarkTitle: "Groups",
    });
    el.appendChild(totals);
}

export default { render };
