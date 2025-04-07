import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, escape } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import valueFormatHelper, { availableFormats } from './value_format_helper'
import { formatFor } from './formats'
import displayFormatHelper, { availableDisplays } from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'
import dateHistoryFormatHelper from './date_history_format_helper'
import { previousDate } from './date_calc_util'

import vegaModifier from './vega_modifier'
import InputComponent from './input_component'
import SelectComponent from './select_component'

import vegaConfig from './vega_config'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushBenchmarkComponent extends Component {
    @tracked _title
    @tracked _valueColumn
    @tracked _format
    @tracked _display

    @tracked editMode = false

    @tracked data

    constructor(owner, args) {
        super(owner, args)

        if (this.args.service) {
            this.data = owner.services[this.args.service]
        } else {
            this.data = owner.services['data']
        }
    }

    @cached
    get title() {
        return this._title || this.args.title
    }

    @cached
    get colorColumn() {
        if (this.args.colorColumn) {
            return this.args.colorColumn
        }

        let colorColumn = this.data.groupColumns.filter(function (c) {
            return c.endsWith('.color')
        })

        if (colorColumn.length > 0) {
            return colorColumn[0]
        }

        return null
    }

    @cached
    get valueColumn() {
        return this._valueColumn || this.args.valueColumn || 'value'
    }

    @cached
    get format() {
        return this._format || this.args.format || 'number'
    }

    @cached
    get display() {
        return this._display || this.args.display || 'isoweek'
    }

    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    @cached
    get groupColumns() {
        return this.data.groupColumns.filter(
            function (c) {
                if (c == this.data.dateColumn || c == this.colorColumn) {
                    return false
                } else {
                    return true
                }
            }.bind(this)
        )
    }

    @cached
    get valueTable() {
        try {
            let dateCurrent = this.date
            let datePrevious = previousDate(this.date, this.display, 1)

            let valueTable = this.data.summarizedTable
                .params({ valueColumn: this.valueColumn })
                .filter(function (d, $) {
                    return (
                        d[$.valueColumn] != null &&
                        op.is_finite(d[$.valueColumn])
                    )
                })

            if (this.date) {
                valueTable = valueTable
                    .params({
                        dateSet: [dateCurrent, datePrevious],
                        dateColumn: 'date',
                    })
                    .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))
            }

            if (this.data.windowFilter) {
                valueTable = valueTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }

            valueTable = valueTable
                .reify()
                .params({ groupColumns: this.groupColumns })
                .derive({
                    groupTitle: escape((d, $) =>
                        op.join(
                            $.groupColumns.map((c) => d[c]),
                            '|'
                        )
                    ),
                })

            return valueTable.reify()
        } catch (error) {
            console.log('latestSummarizedTable failed: ' + error)
            return null
        }
    }

    @cached
    get values() {
        let valueTable = this.valueTable

        if (valueTable != null) {
            return valueTable.objects()
        } else {
            return []
        }
    }

    @cached
    get groupTransform() {
        let dateIndex = this.data.groupColumns.indexOf(this.dateColumn)

        let groupColumns = [...this.data.groupColumns]
        groupColumns.splice(dateIndex)

        if (groupColumns.length > 0) {
            return {
                calculate: groupColumns
                    .map((d) => "datum['" + d + "']")
                    .join(" + '|' + "),
                as: 'groupTitle',
            }
        } else {
            return { calculate: "'Gesamt'", as: 'groupTitle' }
        }
    }

    get vegaTimeUnit() {
        if (this.display == 'isoyear') {
            return 'year'
        }
        if (this.display == 'isoquarter') {
            return 'yearquarter'
        }
        if (this.display == 'isoweek') {
            return 'yearweek'
        }
    }

    get tooltip() {
        var tooltips = []

        this.data.groupColumns.forEach(
            function (e) {
                if (e != this.colorColumn && e != this.data.dateColumn) {
                    tooltips.push({
                        field: e.replace(/\./, '\\.'),
                    })
                }
            }.bind(this)
        )

        tooltips.push({
            field: this.valueColumn,
            type: 'quantitative',
            format: formatFor(this.format),
        })

        return tooltips
    }

    get compiledVegaSpec() {
        let liteSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'Benchmark',
            data: { values: this.values },
            width: 'container',
            height: 'container',
            transform: [],
            encoding: {
                x: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {
                        format: formatFor(this.format),
                    },
                },
                y: {
                    field: 'groupTitle',
                    type: 'nominal',
                    title: 'grouping',
                    axis: {
                        offset: 5,
                        ticks: false,
                        minExtent: 70,
                        domain: false,
                    },
                },
                tooltip: this.tooltip,
            },
            layer: [
                {
                    mark: 'line',
                    encoding: {
                        detail: {
                            field: 'groupTitle',
                            type: 'nominal',
                        },
                        color: { value: '#db646f' },
                    },
                },
                {
                    mark: {
                        type: 'point',
                        filled: true,
                        tooltip: true,
                    },
                    encoding: {
                        color: {
                            field: 'date',
                            type: 'temporal',
                            scale: {
                                range: ['#e6959c', '#911a24'],
                            },
                            title: 'Date',
                            legend: null,
                        },
                        size: { value: 100 },
                        opacity: { value: 1 },
                    },
                },
            ],
        }

        const vegaSpec = compile(liteSpec, {
            config: vegaConfig(),
        }).spec

        return vegaSpec
    }

    get availableFormats() {
        return availableFormats
    }

    get availableDisplays() {
        return availableDisplays
    }

    get availableNumberColumns() {
        return this.data.numberColumns
    }

    @action
    updateTitle(input) {
        try {
            this._title = input
        } catch (error) {
            this._title = null
        }
    }

    @action
    updateValueColumn(input) {
        try {
            this._valueColumn = input
        } catch (error) {
            this._valueColumn = null
        }
    }

    @action
    updateDisplay(input) {
        try {
            this._display = input
        } catch (error) {
            this._display = null
        }
    }

    @action
    updateFormat(input) {
        try {
            this._format = input
        } catch (error) {
            this._format = null
        }
    }

    @action
    toggleEditMode() {
        this.editMode = !this.editMode
    }
}

setComponentTemplate(
    precompileTemplate(
        `
    	<div class="widget">
			{{#unless this.editMode}}
			<div class="widget-view">
				<div class="widget-date">{{dateFormatHelper
				  this.date
				  this.display
				}}</div>
			  	<div class="widget-title">{{this.title}}</div>
			  	<div class="widget-canvas aspect-video">
					<div style="width: 100%; height: 100%" {{vegaModifier this.compiledVegaSpec}}></div>
				</div>
				<div class="widget-toggle">
					<button class="btn btn-xs btn-circle" {{on "click" this.toggleEditMode}}>ℹ</button>
				</div>
			</div>
			{{/unless}}
			{{#if this.editMode}}
			<div class="widget-edit">
				<div class="widget-edit-title">Bearbeiten</div>
				<div class="grid sm:grid-cols-2 gap-4">
					<div class="field">
						<InputComponent @title="Title" @value={{this.title}} @onInput={{this.updateTitle}}/>
					</div>
					<div class="field">
						<SelectComponent @title="Value column" @value={{this.valueColumn}} @options={{this.availableNumberColumns}} @onInput={{this.updateValueColumn}}/>
					</div>
					<div class="field">
						<SelectComponent @title="Format" @value={{this.format}} @options={{this.availableFormats}} @onInput={{this.updateFormat}}/>
					</div>
					<div class="field">
						<SelectComponent @title="Display" @value={{this.display}} @options={{this.availableDisplays}} @onInput={{this.updateDisplay}}/>
					</div>
				</div>
				<div class="widget-toggle">
					<button class="btn btn-xs btn-circle" {{on "click" this.toggleEditMode}}>✕</button>
				</div>
			</div>
			{{/if}}
		</div>  	
    `,
        {
            strictMode: true,
            scope: {
                on,
                canvasModifier,
                vegaModifier,
                valueFormatHelper,
                displayFormatHelper,
                dateFormatHelper,
                dateHistoryFormatHelper,
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,

                InputComponent,
                SelectComponent,
            },
        }
    ),
    PushBenchmarkComponent
)

export default PushBenchmarkComponent
