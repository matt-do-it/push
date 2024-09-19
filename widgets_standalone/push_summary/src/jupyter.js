import { renderComponent } from '@glimmerx/core'

import DataService from './data_service'
import DateCalcService from './date_service'

import PushSummaryComponent from './push_summary'

import './style.css'


async function pushEmbed(component, element, dataService, args) {
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


function render({ model, el }) {
    let dataService = new DataService()
alert("render");
    let value_serialized = model.get("value"); 
    
    dataService.fromArrow(value_serialized)
    dataService.groupColumns = model.get("groupColumns"); 
    dataService.rollup = model.get("rollup"); 
    
    let embedded = embed(PushSummaryComponent, dataService, {
        title: model.get("title"),
        benchmarkTitle: model.get("benchmarkTitle")
    });
    
    el.appendChild(embedded);
}

export default { render };
