import type { Meta, StoryObj } from '@storybook/html'
import { fn } from '@storybook/test'

import PresetService from './preset_service'

import DataService from './data_service'
import DateCalcService from './date_service'

import { renderComponent } from '@glimmerx/core'
import PushSummaryComponent from './push_summary'

import './style.css'

const meta = {
    title: 'Push/PushSummary',
    tags: ['autodocs'],
    render: (args) => {
        let dataService = new DataService()

        let presetService = new PresetService()
        presetService.load(dataService, 'default')

        dataService.groupColumns = ['date']
        dataService.rollup = { value: 'op.sum(d.value)' }

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
    },
    argTypes: {
        title: { control: 'text', table: { category: 'Widget options' } },
        dateColumn: { control: 'text', table: { category: 'Widget options' } },
        valueColumn: { control: 'text', table: { category: 'Widget options' } },
        display: {
            control: 'select',
            table: { category: 'Widget options' },
            table: { category: 'Widget options' },
            options: ['isoweek', 'isoquarter', 'isoyear'],
        },
        windowFilter: { control: 'text', table: { category: 'Data options' } },
    },
    parameters: {
        docs: {
            description: {
                component: 'This is a summary display of all data',
            },
        },
    },
} satisfies Meta<PushProps>

export default meta
type Story = StoryObj<PushProps>

export const Default: Story = {
    args: {
        title: 'Title',
        dateColumn: 'date',
        valueColumn: 'value',
        display: 'isoweek',
    },
}
