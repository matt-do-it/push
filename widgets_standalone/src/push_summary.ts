import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import formatterFor from './formatters'
import valueFormatHelper, { availableFormats } from './value_format_helper'
import displayFormatHelper, { availableDisplays } from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'

import InputComponent from './input_component'
import SelectComponent from './select_component'

import { previousDate } from './date_calc_util'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushSummaryComponent extends Component {
    @tracked _title
    @tracked _valueColumn
    @tracked _format
    @tracked _display

    @tracked editMode = false

    get data() {
        let applicationInstance = getOwner(this)

        return applicationInstance.services[this.args.service || 'data']
    }

    get title() {
        if (this.isAggregated) {
            return (this._title || this.args.title) + ' - Median'
        } else {
            return this._title || this.args.title
        }
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

    get isAggregated() {
        if (
            this.latestWindowedTable &&
            this.latestWindowedTable.columnIndex(this.valueColumn) > -1 &&
            this.latestWindowedTable.numRows() > 1
        ) {
            return true
        } else {
            return false
        }
    }

    get showTrend() {
        if (this.args.showTrend !== undefined) {
            return this.args.showTrend
        } else {
            return true
        }
    }

    get showBenchmark() {
        if (this.isAggregated || this.data.windowFilter) {
            return true
        } else {
            return false
        }
    }

    get benchmarkTitle() {
        return this.args.benchmarkTitle || 'Benchmark'
    }

    @cached
    get latestSummarizedTable() {
        try {
            if (this.date == null) {
                return null
            }

            let summarizedTable = this.data.summarizedTable

            summarizedTable = summarizedTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.data.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            return summarizedTable
        } catch (error) {
            console.log('latestSummarizedTable failed: ' + error)
            return null
        }
    }

    @cached
    get latestWindowedTable() {
        try {
            if (this.date == null) {
                return null
            }

            let totalTable = this.data.summarizedTable

            totalTable = totalTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.data.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            if (this.data.windowFilter) {
                totalTable = totalTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }
            return totalTable
        } catch (error) {
            console.log('latestWindowedTable failed: ' + error)
            return null
        }
    }

    @cached
    get trendWindowedTable() {
        try {
            if (this.date == null) {
                return null
            }

            let trendTable = this.data.summarizedTable

            trendTable = trendTable
                .params({
                    dateSet: this.trendDateSet,
                    dateColumn: this.data.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            if (this.data.windowFilter) {
                trendTable = trendTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }
            return trendTable
        } catch (error) {
            return null
        }
    }

    @cached
    get trendDateSet() {
        return [
            this.date,
            previousDate(this.date, this.display, 1),
            previousDate(this.date, this.display, 2),
        ]
    }

    @cached
    get value() {
        if (
            this.latestWindowedTable &&
            this.latestWindowedTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(this.latestWindowedTable, op.median(this.valueColumn))
        } else {
            return null
        }
    }

    @cached
    get median() {
        if (
            this.latestSummarizedTable &&
            this.latestSummarizedTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(this.latestSummarizedTable, op.median(this.valueColumn))
        } else {
            return null
        }
    }

    @cached
    get q25() {
        if (
            this.latestSummarizedTable &&
            this.latestSummarizedTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(
                this.latestSummarizedTable,
                op.quantile(this.valueColumn, 0.25)
            )
        } else {
            return null
        }
    }

    @cached
    get q75() {
        if (
            this.latestSummarizedTable &&
            this.latestSummarizedTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(
                this.latestSummarizedTable,
                op.quantile(this.valueColumn, 0.75)
            )
        } else {
            return null
        }
    }

    @cached
    get trend() {
        if (this.value && this.comparison) {
            return this.value / this.comparison - 1
        } else {
            return null
        }
    }

    @cached
    get comparison() {
        if (
            this.trendWindowedTable &&
            this.trendWindowedTable.columnIndex(this.valueColumn) > -1
        ) {
            let dateIndex = this.data.groupColumns.indexOf('date')

            let groupColumns = this.data.groupColumns.filter(
                function (e) {
                    return e != this.data.dateColumn
                }.bind(this)
            )

            let rolledupTable = this.trendWindowedTable
                .reify()
                .groupby(this.data.dateColumn)
                .rollup({
                    value: op.median(this.valueColumn),
                })

            return agg(rolledupTable, op.mean('value'))
        } else {
            return null
        }
    }

    @action
    drawCanvas(canvas) {
        const ctx = canvas.getContext('2d')
        ctx.reset()

        let scale = 2

        let canvasWidth = canvas.width
        let canvasHeight = canvas.height

        let offsetValue = {
            top: 6 * scale,
            bottom: 26 * scale,
        }
        let offsetBenchmark = {
            top: 0 * scale,
            bottom: 20 * scale,
        }

        let maxValue =
            d3.max([0, this.value, this.median, this.q25, this.q75]) * 1.1

        let xScale = d3.scaleLinear([0, maxValue], [0, canvasWidth])

        // Clear background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        ctx.fillStyle = '#F2F2F2'
        ctx.fillRect(
            0,
            offsetBenchmark.top,
            canvasWidth,
            canvasHeight - offsetBenchmark.top - offsetBenchmark.bottom
        )

        if (this.showBenchmark) {
            // Draw Quantiles
            ctx.fillStyle = '#D7DDE4'
            ctx.fillRect(
                xScale(this.q25),
                offsetBenchmark.top,
                xScale(this.q75) - xScale(this.q25),
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top
            )

            // Draw Median
            ctx.fillStyle = '#2B3440'
            ctx.fillRect(
                xScale(this.median) - 2,
                offsetBenchmark.top,
                4 * scale,
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top
            )
        }

        // Draw value
        ctx.fillStyle = 'rgb(31, 119, 180)'
        ctx.fillRect(
            0,
            offsetValue.top,
            xScale(this.value),
            canvasHeight - offsetValue.bottom - offsetValue.top
        )

        if (this.showTrend) {
            ctx.fillStyle = 'rgb(174, 199, 232)'
            ctx.fillRect(
                xScale(this.comparison) - 2,
                offsetBenchmark.top,
                4 * scale,
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top
            )
        }
        // Draw axis
        let axisY = canvasHeight - offsetBenchmark.bottom

        let xTicks = xScale.ticks(Math.round(canvasWidth / 200))
        let tickSize = 6 * scale

        ctx.strokeStyle = '#1f2937'
        ctx.beginPath()
        xTicks.forEach((d) => {
            ctx.moveTo(xScale(d), axisY)
            ctx.lineTo(xScale(d), axisY + tickSize)
        })
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, axisY + tickSize)
        ctx.lineTo(0, axisY)
        ctx.lineTo(canvasWidth, axisY)
        ctx.lineTo(canvasWidth, axisY + tickSize)
        ctx.stroke()

        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'black'
        ctx.font = 12 * scale + 'px sans-serif'

        xTicks.forEach((d) => {
            ctx.beginPath()
            ctx.fillText(
                formatterFor(this.format)(d),
                xScale(d),
                axisY + tickSize
            )
        })
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
      <div class="push">
		  <div class="widget">
			{{#unless this.editMode}}
			<div class="widget-view">
				<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
				<div class="widget-title">{{this.title}}</div>
				<div class="widget-value">{{valueFormatHelper this.value this.format}}</div>
				<div class="widget-canvas" style="height: 40px">
					<canvas {{canvasModifier this}}></canvas>
				</div>	
				<div class="widget-benchmark">
						Q25: {{valueFormatHelper this.q25 this.format}}
						- 
						M: {{valueFormatHelper this.median this.format}}
						- 
						Q75: {{valueFormatHelper this.q75 this.format}}
				</div>
				<div class="widget-trend">
					<div class="left">⌀ drei {{displayFormatHelper this.display}}: {{valueFormatHelper this.comparison this.format}}</div>
					<div class="right {{trendColorHelper this.trend}}">{{trendFormatHelper this.trend}}</div>
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
  	</div>
    `,
        {
            strictMode: true,
            scope: {
                on,
                canvasModifier,
                valueFormatHelper,
                displayFormatHelper,
                dateFormatHelper,
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,

                InputComponent,
                SelectComponent,
            },
        }
    ),
    PushSummaryComponent
)

export default PushSummaryComponent
