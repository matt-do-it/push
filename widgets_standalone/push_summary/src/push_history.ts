import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import vegaModifier from './vega_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import vega_config from './vega_config'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushHistoryComponent extends Component {
    @service data
    @service dateCalc

    @tracked _dateColumn
    @tracked _valueColumn

    @tracked editMode

    get title() {
        return this.args.title || 'History'
    }

    @cached
    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    @cached
    get valueColumn() {
        return this._valueColumn || this.args.valueColumn || 'value'
    }

    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.dateColumn))
        } catch (error) {
            return null
        }
    }

    get display() {
        return this.args.display || 'isoweek'
    }

    get format() {
        return this.args.format || 'number'
    }

    @cached
    get summarizedTable() {
        try {
            if (this.date == null) {
                return null
            }

            let totalTable = this.data.summarizedTable

            if (this.data.windowFilter) {
                totalTable = totalTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }

            return totalTable
        } catch (error) {
            console.log('summarizedTable failed: ' + error)
            return null
        }
    }

    get values() {
        if (this.summarizedTable) {
            return this.summarizedTable.objects()
        } else {
            return []
        }
    }

    @cached
    get groupColumns() {
        let g = [...this.data.groupColumns]

        let dateIndex = g.indexOf(this.dateColumn)
        if (dateIndex > -1) {
            g.splice(dateIndex, 1)
        }

        return g
    }

    @cached
    get groupNames() {
        try {
            if (this.groupColumns.length > 0) {
                const uniqueColumnValues: string[][] = this.groupColumns.map(
                    (col) =>
                        (
                            this.data.summarizedTable
                                .rollup({ col: op.array_agg_distinct(col) })
                                .object() as any
                        ).col
                )
                // If just one column, don't do cartesian product and make it a 2D array.
                if (uniqueColumnValues.length === 1) {
                    return uniqueColumnValues[0].map((group) => [group])
                }
                return this.data.cartesian(...uniqueColumnValues)
            } else {
                return []
            }
        } catch (error) {
            return []
        }
    }

    @cached
    get groupTransform() {
        let groupColumns = this.groupColumns

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

    @cached
    get colorTransform() {
        if (this.args.colorColumn) {
            return {
                calculate: "datum['" + this.args.colorColumn + "']",
                as: 'colorTitle',
            }
        }

        let groupColumns = this.groupColumns

        if (groupColumns.length > 0) {
            return {
                calculate: groupColumns
                    .map((d) => "datum['" + d + "']")
                    .join(" + '|' + "),
                as: 'colorTitle',
            }
        } else {
            return { calculate: "'Gesamt'", as: 'colorTitle' }
        }
    }

    @cached
    get titleColumn() {
        return this.args.titleColumn || 'campaign'
    }

    @cached
    get colorMapping() {
        return {
            SPRITE: '#5EBD82',
            COKE: '#37A264',
        }
    }

    @cached
    get colorColumn() {
        return this.args.colorColumn || null
    }

    get valueColumn() {
        return this.args.valueColumn || 'impressions'
    }

    @cached
    get colors() {
        const colors = [
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
        return colors
    }

    get colorDomain() {
        if (this.args.colorColumn && !this.args.colorMapping) {
            let uniqueValues = (
                this.data.summarizedTable
                    .rollup({
                        col: op.array_agg_distinct(this.args.colorColumn),
                    })
                    .object() as any
            ).col
            return uniqueValues
        }

        if (this.args.colorColumn && this.args.colorMapping) {
            let uniqueValues = (
                this.data.summarizedTable
                    .rollup({
                        col: op.array_agg_distinct(this.args.colorColumn),
                    })
                    .object() as any
            ).col
            return uniqueValues
        }

        let groupNames = this.groupNames.map((x) => x.join('|'))
        return groupNames
    }

    get colorRange() {
        if (this.args.colorColumn && !this.args.colorMapping) {
            let colors = this.colors

            let colorDomain = this.colorDomain
            let colorIndex = 0
            let colorRange = colorDomain.map((x, i) => {
                let color = colors[x]
                return color
            })
            return colorRange
        }

        if (this.args.colorColumn && this.args.colorMapping) {
            let colors = this.colors

            let colorDomain = this.colorDomain
            let colorIndex = 0
            let colorRange = colorDomain.map((x, i) => {
                let color = this.args.colorMapping[x]
                return color
            })
            return colorRange
        }

        let colors = this.colors

        let colorDomain = this.colorDomain
        let colorIndex = 0

        let colorRange = colorDomain.map((x, i) => {
            let color = colors[colorIndex++]
            if (colorIndex > this.colors.length - 1) {
                colorIndex = 0
            }
            return color
        })

        return colorRange
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

    get tooltipColumns() {
        let columns = [...this.data.groupColumns]

        if (this.colorColumn) {
            columns.splice(columns.indexOf(this.colorColumn), 1)
        }
        let tooltipColumns = columns
            .map(function (x, i) {
                return { field: x, type: 'ordinal' }
            })
            .concat({ field: this.valueColumn, type: 'quantitative' })

        return tooltipColumns
    }

    markBarSpec() {
        return {
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
                this.groupTransform,
                this.colorTransform,
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
                detail: {
                    field: 'groupTitle',
                },
                color: {
                    field: 'colorTitle',
                    scale: {
                        domain: this.colorDomain,
                        range: this.colorRange,
                    },

                    legend: null,
                },
                y: {
                    field: this.valueColumn,
                    type: 'quantitative',
                },
                tooltip: this.tooltipColumns,
            },
        }
    }

    markLineSpec() {
        return {
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
                this.groupTransform,
                this.colorTransform,
            ],
            layer: [
                {
                    mark: {
                        type: 'line',
                        tooltip: 'true',
                        point: true,
                        strokeWidth: 1,
                        opacity: 0.5,
                    },
                    encoding: {
                        detail: {
                            field: 'groupTitle',
                        },
                        color: {
                            field: 'colorTitle',
                            scale: {
                                domain: this.colorDomain,
                                range: this.colorRange,
                            },

                            legend: null,
                        },
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
                y: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {},
                },
                tooltip: this.tooltipColumns,
            },
        }
    }

    get compiledVegaSpec() {
        let liteSpec

        if (this.args.mark == 'line') {
            liteSpec = this.markLineSpec()
        } else {
            liteSpec = this.markBarSpec()
        }

        const vegaSpec = compile(liteSpec, {
            config: vega_config(),
        }).spec

        return vegaSpec
    }

    @action
    updateDateColumn(input) {
        try {
            this._dateColumn = input
        } catch (error) {
            this._dateColumn = null
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
    toggleEditMode() {
        this.editMode = !this.editMode
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
        {{#unless this.editMode}}
      	<div class="widget-view">
			<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
			<div class="font-bold">{{this.title}}</div>
			<div class="px-4 py-4 aspect-video">
				<div style="width: 100%; height: 100%" {{vegaModifier this.compiledVegaSpec}}>
				</div>
			</div>
			<div class="widget-toggle">
				<button class="btn btn-xs btn-outline btn-info" {{on "click" this.toggleEditMode}}>ℹ</button>
			</div>
		</div>
		{{/unless}}
		{{#if this.editMode}}
    	<div class="widget-edit">
    		<div class="widget-edit-title">Bearbeiten</div>
    		<div class="grid grid-cols-3 gap-4">
    			<div class="field">
    			    <InputComponent @title="Date column" @value={{this.dateColumn}} @onInput={{this.updateDateColumn}}/>
				</div>
    			<div class="field">
    			    <InputComponent @title="Value column" @value={{this.valueColumn}} @onInput={{this.updateValueColumn}}/>
				</div>
    		</div>
			<div class="widget-toggle">
				<button class="btn btn-xs btn-info" {{on "click" this.toggleEditMode}}>ℹ</button>
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
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,

                InputComponent,
                TextareaComponent,
            },
        }
    ),
    PushHistoryComponent
)

export default PushHistoryComponent
