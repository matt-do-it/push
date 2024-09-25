import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushSummaryComponent extends Component {
    @service data
    @service dateCalc

    @tracked _dateColumn
    @tracked _valueColumn

    @tracked editMode

    get title() {
        if (this.isAggregated) {
            return this.args.title + ' - Median'
        } else {
            return this.args.title
        }
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

    @cached
    get format() {
        return this.args.format || 'number'
    }

    @cached
    get display() {
        return this.args.display || 'isoquarter'
    }

    @cached
    get windowFilter() {
        return this.args.windowFilter
    }

    @cached
    get windowFilterParams() {
        return this.args.windowFilterParams
    }

    @cached
    get isMultiGrouped() {
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
        if (this.isMultiGrouped || this.data.windowFilter) {
            return true
        } else {
            return false
        }
    }

    @cached
    get latestTotalTable() {
        try {
            if (this.date == null) {
                return null
            }

            let totalTable = this.data.summarizedTable

            totalTable = totalTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            return totalTable
        } catch (error) {
            console.log('latestFullTable failed: ' + error)
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
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            if (this.windowFilter) {
                totalTable = totalTable
                    .params(this.windowFilterParams)
                    .filter(this.windowFilter)
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
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            if (this.windowFilter) {
                trendTable = trendTable
                    .params(this.windowFilterParams)
                    .filter(this.windowFilter)
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
            this.dateCalc.previousDate(this.date, this.display, 1),
            this.dateCalc.previousDate(this.date, this.display, 2),
        ]
    }

    @cached
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
            this.latestTotalTable &&
            this.latestTotalTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(this.latestTotalTable, op.median(this.valueColumn))
        } else {
            return null
        }
    }

    @cached
    get q25() {
        if (
            this.latestTotalTable &&
            this.latestTotalTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(
                this.latestTotalTable,
                op.quantile(this.valueColumn, 0.25)
            )
        } else {
            return null
        }
    }

    @cached
    get q75() {
        if (
            this.latestTotalTable &&
            this.latestTotalTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(
                this.latestTotalTable,
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
                    return e != this.dateColumn
                }.bind(this)
            )

            let rolledupTable = this.trendWindowedTable
                .reify()
                .groupby(groupColumns)
                .rollup({
                    mean: op.mean(this.valueColumn),
                    values: op.count(),
                })
                .filter((d) => op.equal(d.values, 3))
            return agg(rolledupTable, op.median('mean'))
        } else {
            return null
        }
    }

    @action
    drawCanvas(canvas) {
        const ctx = canvas.getContext('2d')

        let canvasWidth = canvas.width
        let canvasHeight = canvas.height

        let offsetValue = {
            top: 6,
            bottom: 26,
        }
        let offsetBenchmark = {
            top: 0,
            bottom: 20,
        }

        let maxValue =
            d3.max([0, this.value, this.median, this.q25, this.q75]) * 1.1

        let xScale = d3.scaleLinear([0, maxValue], [0, canvasWidth])

        // Clear background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // Draw background
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
                4,
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
                4,
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top
            )
        }
        // Draw axis
        let axisY = canvas.height - offsetBenchmark.bottom

        let xTicks = xScale.ticks()
        let tickSize = 6

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
        xTicks.forEach((d) => {
            ctx.beginPath()
            ctx.fillText(numberFormatter(d), xScale(d), axisY + tickSize)
        })
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
      <div class="push">
		  <div class="widget">
			{{#unless this.editMode}}
			<div class="widget-view">
				<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
				<div class="widget-title">{{this.title}}</div>
				<div class="widget-value">{{valueFormatHelper this.value this.format}}</div>
				<div class="widget-canvas">
					<canvas width="300" height="40" {{canvasModifier this}}></canvas>
				</div>	
				<div class="widget-benchmark">
						Q25: {{valueFormatHelper this.q25 this.format}}
						- 
						M: {{valueFormatHelper this.median this.format}}
						- 
						Q75: {{valueFormatHelper this.q75 this.format}}
				</div>
				<div class="widget-trend">
					<div class="left">⌀ drei {{displayFormatHelper this.display}}: {{valueFormatHelper this.comparison this.format}} </div>
					<div class="right {{trendColorHelper this.trend}}">{{trendFormatHelper this.trend}}</div>
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
            },
        }
    ),
    PushSummaryComponent
)

export default PushSummaryComponent
