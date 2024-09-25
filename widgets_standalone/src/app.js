import { LIFETIME } from '@starbeam/timeline'
import { renderComponent } from '@glimmerx/core'

import PushSummaryComponent from './push_summary'
import PushTableComponent from './push_table'

import AppComponent from './app_component'

import DataService from './data_service'
import DateCalcService from './date_service'
import PresetService from './preset_service'

import { table, agg, op } from 'arquero'

import './style.css'

let dataService = new DataService()

let presetService = new PresetService()
presetService.presets = [
    {
        title: 'Campaigns',
        values: [
            {
                date: '2024-07-01',
                campaign: 'COKE',
                channel: 'ONE',
                color: 1,
                impressions: 500,
            },
            {
                date: '2024-07-01',
                campaign: 'PEPSI',
                channel: 'ONE',
                color: 6,
                impressions: 700,
            },
            {
                date: '2024-04-01',
                campaign: 'COKE',
                channel: 'ONE',
                color: 1,
                impressions: 200,
            },
            {
                date: '2024-04-01',
                campaign: 'PEPSI',
                channel: 'ONE',
                color: 6,
                impressions: 300,
            },
            {
                date: '2024-01-01',
                campaign: 'SPRITE',
                channel: 'ONE',
                color: 3,
                impressions: 100,
            },
            {
                date: '2024-01-01',
                campaign: 'SPRITE',
                channel: 'ONE',
                color: 3,
                impressions: 700,
            },
            {
                date: '2024-01-01',
                campaign: 'COKE',
                channel: 'ONE',
                color: 1,
                impressions: 100,
            },
            {
                date: '2024-01-01',
                campaign: 'PEPSI',
                channel: 'ONE',
                color: 1,
                impressions: 700,
            },
            {
                date: '2024-07-01',
                campaign: 'COKE',
                channel: 'TWO',
                color: 1,
                impressions: 1200,
            },
            {
                date: '2024-07-01',
                campaign: 'PEPSI',
                channel: 'TWO',
                color: 6,
                impressions: 700,
            },
        ],
        groupColumns: ['date', 'campaign', 'channel', 'color'],
        filter: '',
        rollup: { impressions: 'op.sum(d.impressions)' },
        derive: { value: 'd.impressions' },
    },
]

presetService.load(dataService, presetService.presets[0])

renderComponent(AppComponent, {
    element: document.getElementById('app'),
    args: {},
    services: {
        data: dataService,
        dateCalc: new DateCalcService(),
        preset: presetService,
    },
})
