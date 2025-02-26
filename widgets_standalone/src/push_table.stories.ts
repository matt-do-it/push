import type { Meta, StoryObj } from '@storybook/html'
import { fn } from '@storybook/test'

import PresetService from './preset_service'

import DataService from './data_service'
import DateCalcService from './date_service'

import { renderComponent } from '@glimmerx/core'
import PushTableComponent from './push_table'

import './style.css'

const meta = {
    title: 'Push/PushTable',
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
        renderComponent(PushTableComponent, {
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
        columns: { control: 'object', table: { category: 'Widget options' } },
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
} satisfies Meta<PushTableProps>

export default meta
type Story = StoryObj<PushTableProps>

export const Default: Story = {
    args: {
        title: 'Title',
        dateColumn: 'date',
        columns: null,
        display: 'isoquarter',
        format: 'number',
        filter: null,
        groupColumns: ['date'],
        rollup: { value: 'op.sum(d.value)' },
        derive: {},
        windowFilter: null,
        presetName: 'default',
    },
}
