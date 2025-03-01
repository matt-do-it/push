import { LIFETIME } from '@starbeam/timeline'
import { renderComponent } from '@glimmerx/core'

import PushSummaryComponent from './push_summary'

import AppComponent from './app_component'

import DataService from './data_service'

import PresetService from './preset_service'

import { table, agg, op } from 'arquero'

import './style.css'

let dataService = new DataService()

let presetService = new PresetService()
presetService.load(dataService, "default")

renderComponent(AppComponent, {
    element: document.getElementById('app'),
    args: {},
    services: {
        data: dataService,
        preset: presetService,
    },
})
