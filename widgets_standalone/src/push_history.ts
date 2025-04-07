import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, escape } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import valueFormatHelper, { availableFormats } from './value_format_helper'
import displayFormatHelper, { availableDisplays } from './display_format_helper'
import vegaModifier from './vega_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'
import dateHistoryFormatHelper from './date_history_format_helper'
import { formatFor } from './formats'

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

class PushHistoryComponent extends Component {
    @tracked _title
    @tracked _valueColumn
    @tracked _format
    @tracked _display
    @tracked _mark

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
    get showLegend() {
        return this._showLegend || this.args.showLegend || true
    }

    @cached
    get mark() {
        return this._mark || this.args.mark || 'bar'
    }

    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    get start_date() {
        try {
            return agg(this.data.summarizedTable, op.min(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    get end_date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    get legendTitle() {
        if (this.groupColumns.length > 0) {
            return this.groupColumns[0]
        } else {
            return 'Legende'
        }
    }

    get valueTable() {
        try {
            if (this.date == null) {
                return null
            }

            let valueTable = this.data.summarizedTable

            if (this.data.windowFilter) {
                valueTable = valueTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }

            valueTable = valueTable
                .reify()
                .params({
                    groupColumns: this.groupColumns,
                    sortColumn: this.colorColumn || this.valueColumn,
                })
                .derive({
                    groupTitle:
                        this.groupColumns.length > 0
                            ? escape((d, $) =>
                                  op.join(
                                      $.groupColumns.map((c) => d[c]),
                                      '|'
                                  )
                              )
                            : "'Gesamt'",
                    sortOrder: (d, $) => d[$.sortColumn],
                })

            var anyNonNullExpr =
                'd => (' +
                [this.valueColumn]
                    .filter(function (c) {
                        return !c.isSimpleValue
                    })
                    .map(function (c) {
                        return "d['" + c + "'] > 0"
                    })
                    .join(' || ') +
                ')'

            valueTable = valueTable.filter(anyNonNullExpr)

            return valueTable
        } catch (error) {
            console.log('valueTable failed: ' + error)
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

    get values() {
        if (this.valueTable) {
            return this.valueTable.objects()
        } else {
            return []
        }
    }

    get colorMapping() {
        const colorValues = [
            '#5EBD82',
            '#37A264',
            '#00884A',
            '#006C3A',
            '#00512A',
            '#56B0FF',
            '#0096E8',
            '#007BC0',
            '#00629A',
            '#71767C',
        ]

        if (this.groupColumns.length > 0) {
            let valueTable = this.valueTable
            if (valueTable != null) {
                if (this.colorColumn) {
                    let colorMapping = valueTable
                        .params({
                            colorColumn: this.colorColumn,
                            colorValues: colorValues,
                        })
                        .groupby('groupTitle')
                        .rollup({
                            range: (d, $) =>
                                op.min(
                                    op.recode(
                                        d[$.colorColumn] - 1,
                                        $.colorValues,
                                        '#5EBD82'
                                    )
                                ),
                            order: (d, $) => op.min(d[$.colorColumn]),
                        })
                        .rename({ groupTitle: 'domain' })
                        .orderby('order')
                        .reify()

                    return {
                        domain: colorMapping.column('domain').data,
                        range: colorMapping.column('range').data,
                    }
                } else {
                    let colorMapping = valueTable
                        .params({
                            valueColumn: this.valueColumn,
                        })
                        .groupby('groupTitle')
                        .rollup({})
                        .rename({ groupTitle: 'domain' })
                        .orderby('domain')
                        .reify()

                    let domains = colorMapping.column('domain').data

                    let range = domains.map(function (e, i) {
                        return colorValues[i % 10]
                    })
                    return {
                        domain: domains,
                        range: range,
                    }
                }
            }
        }

        return {
            domain: ['Gesamt'],
            range: ['#5EBD82', '#5EBD82'],
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

        tooltips.push({
            field: 'displayDate',
            type: 'temporal',
        })
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

    markBarSpec() {
        var spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A simple bar chart with embedded data.',
            width: 'container',
            height: 'container',
            data: {
                values: this.values,
            },
            transform: [
                {
                    calculate:
                        "timeOffset('day', toDate(datum.date), if(dayofyear(timeOffset('day', toDate(datum.date), 3))%7<5,6,-1))",
                    as: 'displayDate',
                },
            ],
            mark: {
                type: 'bar',
                tooltip: true,
            },
            encoding: {
                x: {
                    field: 'displayDate',
                    type: 'temporal',
                    timeUnit: this.vegaTimeUnit,
                    bandPosition: 0.5,
                    axis: {
                        title: 'Date',
                    },
                },
                color: {
                    field: 'groupTitle',
                    scale: {
                        domain: this.colorMapping.domain,
                        range: this.colorMapping.range,
                    },
                    legend: {
                        title: this.legendTitle,
                    },
                },
                y: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {
                        format: formatFor(this.format),
                    },
                },
                order: {
                    field: 'sortOrder',
                },
                tooltip: this.tooltip,
            },
        }
        return spec
    }

    markLineSpec() {
        var spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A simple bar chart with embedded data.',
            width: 'container',
            height: 'container',
            data: {
                values: this.values,
            },
            transform: [
                {
                    calculate:
                        "timeOffset('day', toDate(datum.date), if(dayofyear(timeOffset('day', toDate(datum.date), 3))%7<5,6,-1))",
                    as: 'displayDate',
                },
            ],
            layer: [
                {
                    mark: {
                        type: 'line',
                        tooltip: true,
                        point: true,
                        strokeWidth: 1,
                        opacity: 0.5,
                    },
                },
            ],

            encoding: {
                x: {
                    field: 'displayDate',
                    type: 'temporal',
                    timeUnit: this.vegaTimeUnit,
                    axis: {
                        title: 'Date',
                    },
                },
                color: {
                    field: 'groupTitle',
                    scale: {
                        domain: this.colorMapping.domain,
                        range: this.colorMapping.range,
                    },
                    legend: {
                        title: this.legendTitle,
                    },
                },
                y: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {
                        format: formatFor(this.format),
                    },
                },
                tooltip: this.tooltip,
            },
        }

        return spec
    }

    get compiledVegaSpec() {
        let liteSpec

        if (this.mark == 'line') {
            liteSpec = this.markLineSpec()
        } else {
            liteSpec = this.markBarSpec()
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

    get availableMarks() {
        return ['bar', 'line']
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
    updateMark(input) {
        try {
            this._mark = input
        } catch (error) {
            this._mark = null
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
				  <div class="widget-date">{{dateHistoryFormatHelper
					  this.start_date
					  this.end_date
					  this.display
					}}</div>
				  <div class="widget-title">{{this.title}}</div>
				  <div class="widget-canvas aspect-video">
					<div style="width: 100%; height: 100%" {{vegaModifier this.compiledVegaSpec}}>
					</div>
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
					<div class="field">
						<SelectComponent @title="Mark" @value={{this.mark}} @options={{this.availableMarks}} @onInput={{this.updateMark}}/>
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
    PushHistoryComponent
)

export default PushHistoryComponent
