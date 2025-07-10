import type { Meta, StoryObj } from '@storybook/html'
import { fn } from '@storybook/test'

import PresetService from './preset_service'

import DataService from './data_service'
import DateCalcService from './date_service'

import { renderComponent } from '@glimmerx/core'
import PushFunnelComponent from './push_funnel'

import './style.css'

const meta = {
    title: 'Push/PushFunnel',
    tags: ['autodocs'],
    render: (args) => {
        let dataService = new DataService()

        let presetService = new PresetService()
        presetService.load(dataService, args.presetName)

        dataService.filter = args.filter

        dataService.dateColumn = args.dateColumn
        dataService.groupColumns = args.groupColumns

        dataService.rollup = args.rollup

        dataService.windowFilter = args.windowFilter

        let element = document.createElement('div')
        element.classList.add("push");
        element.classList.add("push-editable");
        renderComponent(PushFunnelComponent, {
            element: element,
            args: args,
            services: {
                data: dataService,
            },
        })
        return element
    },
    argTypes: {
        title: { control: 'text', table: { category: 'Widget options' } },
        colorColumn: { control: 'text', table: { category: 'Widget options' } },
        display: {
            control: 'select',
            table: { category: 'Widget options' },
            options: ['isoweek', 'isoquarter', 'isoyear'],
        },
        format: {
            control: 'select',
            table: { category: 'Widget options' },
            options: ['rate', 'number', 'float', 'currency', 'duration'],
        },
        dateColumn: { control: 'text', table: { category: 'Data options' } },
        presetName: {
            control: 'select',
            table: { category: 'Data options' },
            options: ['default'],
        },
        filter: { control: 'object', table: { category: 'Data options' } },
        groupColumns: {
            control: 'object',
            table: { category: 'Data options' },
        },
        phaseTitles: { control: 'text', table: { category: 'Widget options' } },
        valueColumns: { control: 'text', table: { category: 'Widget options' } },
        rollup: { control: 'object', table: { category: 'Data options' } },
        derive: { control: 'object', table: { category: 'Data options' } },
        windowFilter: {
            control: 'object',
            table: { category: 'Data options' },
        },
    },
    parameters: {
        docs: {
            description: {
                component: 'This is a summary display of all data',
            },
        },
    },
} satisfies Meta<PushFunnelProps>

export default meta
type Story = StoryObj<PushFunnelProps>

export const Default: Story = {
    args: {
        title: 'Title',
        dateColumn: 'date',
        phaseTitles: 'Value 1, Value 2',
        valueColumns: 'value,value2',
        colorColumn: 'color',
        display: 'isoquarter',
        format: 'number',
        filter: null,
        groupColumns: ['group', 'group2', 'color', 'date'],
        rollup: { value: 'op.sum(d.value)' },
        derive: {},
        windowFilter: null,
        presetName: 'default',
    },
}
