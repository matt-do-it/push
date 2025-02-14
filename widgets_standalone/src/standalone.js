import { renderComponent } from '@glimmerx/core'

import DataService from './data_service'
import DateCalcService from './date_service'
import FormatterService from './formatter_service'

import PushSummaryComponent from './push_summary'
import SlideComponent from './slide'
import ReportPage from './report_page'
//import PushTableComponent from './push_table'

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
    renderComponent(component, {
        element: element,
        args: args,
        services: {
            data: dataService,
            dateCalc: new DateCalcService(),
        },
    })
    return element
}

export { PushSummaryComponent }
export { SlideComponent }
export { ReportPage }
export { DataService, DateCalcService, FormatterService }

export { pushEmbed, embed }

export { renderComponent }
