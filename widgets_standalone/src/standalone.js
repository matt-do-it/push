import { renderComponent } from '@glimmerx/core'

import DataService from './data_service'
import PresetService from './preset_service'

import PushSummaryComponent from './push_summary'
import PushHistoryComponent from './push_history'
import PushHierarchyComponent from './push_hierarchy'
import PushTableComponent from './push_table'
import PushSunburstComponent from './push_sunburst'
import PushScatterComponent from './push_scatter'
import PushValuesComponent from './push_values'

import './style.css'

function pushEmbed(component, dataService, args) {
    let element = document.createElement('div')
    
    renderComponent(component, {
        element: element,
        args: args,
        services: {
            data: dataService
        },
    })
    
    return element
}


export { 
	PushSummaryComponent, 
	PushHistoryComponent,
	PushHierarchyComponent,
	PushTableComponent,
	PushSunburstComponent,
	PushScatterComponent,
	PushValuesComponent
}

export { DataService }
export { PresetService }

export { pushEmbed, renderComponent }
