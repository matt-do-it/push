import { renderComponent } from '@glimmerx/core'

import DataService from './data_service'
import PresetService from './preset_service'

import PushSummaryComponent from './push_summary'
import PushHistoryComponent from './push_history'

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
        },
    })
    return element
}

export { PushSummaryComponent, PushHistoryComponent }
export { DataService }
export { PresetService }

export { pushEmbed, embed }
