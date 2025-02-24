import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import formatterFor from './formatters'
import valueFormatHelper from './value_format_helper'
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
    @service dateCalc

    get data() {
        if (this.args.service) {
            return getOwner(this).services[this.args.service]
        } else {
            return getOwner(this).services.data
        }
    }

    get title() {
        if (this.isMultiGrouped) {
            return this.args.title + " - Median";
        } else {
            return this.args.title;
        }
    }

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || "date";
    }

    get valueColumn() {
        return this._valueColumn || this.args.valueColumn || "impressions";
    }

    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.dateColumn));
        } catch (error) {
            return null;
        }
    }

    get display() {
        return this.args.display || "isoweek";
    }

    @cached
    get isMultiGrouped() {
        if (
            this.latestSummarizedWindowedTable &&
            this.latestSummarizedWindowedTable.columnIndex(this.valueColumn) >
                -1 &&
            this.latestSummarizedWindowedTable.numRows() > 1
        ) {
            return true;
        } else {
            return false;
        }
    }

    get showTrend() {
        if (this.args.showTrend !== undefined) {
            return this.args.showTrend;
        } else {
            return true;
        }
    }

    get showBenchmark() {
        if (this.isMultiGrouped || this.data.windowFilter) {
            return true;
        } else {
            return false;
        }
    }

    get benchmarkTitle() {
        return this.args.benchmarkTitle;
    }

    @cached
    get latestSummarizedTable() {
        try {
            if (this.date == null) {
                return null;
            }

            let totalTable = this.data.summarizedTable;

            totalTable = totalTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]));
            return totalTable;
        } catch (error) {
            console.log("latestSummarizedTable failed: " + error);
            return null;
        }
    }

    @cached
    get latestSummarizedWindowedTable() {
        try {
            if (this.date == null) {
                return null;
            }

            let totalTable = this.data.summarizedTable;

            totalTable = totalTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]));

            if (this.data.windowFilter) {
                totalTable = totalTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter);
            }

            return totalTable;
        } catch (error) {
            console.log("latestSummarizedWindowedTable failed: " + error);
            return null;
        }
    }

    @cached
    get trendWindowedTable() {
        try {
            if (this.date == null) {
                return null;
            }

            let trendTable = this.data.summarizedTable;

            trendTable = trendTable
                .params({
                    dateSet: [
                        this.date,
                        this.dateCalc.subISOPeriods(this.date, 1, this.display),
                        this.dateCalc.subISOPeriods(this.date, 2, this.display),
                    ],
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]));

            if (this.data.windowFilter) {
                trendTable = trendTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter);
            }
            return trendTable.reify();
        } catch (error) {
            console.log("trendWindowedTable failed: " + error);
            return null;
        }
    }

    @cached
    get value() {
        if (
            this.latestSummarizedWindowedTable &&
            this.latestSummarizedWindowedTable.columnIndex(this.valueColumn) >
                -1
        ) {
            if (this.isMultiGrouped) {
                return agg(
                    this.latestSummarizedWindowedTable,
                    op.median(this.valueColumn),
                );
            } else {
                return this.latestSummarizedWindowedTable.get(
                    this.valueColumn,
                    0,
                );
            }
        } else {
            return null;
        }
    }

    @cached
    get median() {
        if (
            this.latestSummarizedTable &&
            this.latestSummarizedTable.columnIndex(this.valueColumn) > -1
        ) {
            return agg(this.latestSummarizedTable, op.median(this.valueColumn));
        } else {
            return null;
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
                op.quantile(this.valueColumn, 0.25),
            );
        } else {
            return null;
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
                op.quantile(this.valueColumn, 0.75),
            );
        } else {
            return null;
        }
    }

    @cached
    get trend() {
        if (
            !this.isMultiGrouped &&
            this.latestSummarizedWindowedTable &&
            this.latestSummarizedWindowedTable.columnIndex(
                this.valueColumn + "Trend",
            ) > -1
        ) {
            if (this.isMultiGrouped) {
                return agg(
                    this.latestSummarizedWindowedTable,
                    op.median(this.valueColumn + "Trend"),
                );
            } else {
                return this.latestSummarizedWindowedTable.get(
                    this.valueColumn + "Trend",
                    0,
                );
            }
        }

        if (this.value && this.comparison) {
            return this.value / this.comparison - 1;
        } else {
            return null;
        }
    }

    @cached
    get comparison() {
        if (
            !this.isMultiGrouped &&
            this.latestSummarizedWindowedTable &&
            this.latestSummarizedWindowedTable.columnIndex(
                this.valueColumn + "Previous",
            ) > -1
        ) {
            if (this.isMultiGrouped) {
                return agg(
                    this.latestSummarizedWindowedTable,
                    op.median(this.valueColumn + "Previous"),
                );
            } else {
                return this.latestSummarizedWindowedTable.get(
                    this.valueColumn + "Previous",
                    0,
                );
            }
        }

        if (
            this.trendWindowedTable &&
            this.trendWindowedTable.columnIndex(this.valueColumn) > -1
        ) {
            if (this.isMultiGrouped) {
                let remainingGroups = this.data.groupColumns.filter(
                    function (c) {
                        return c != "date";
                    },
                );

                let rolledupTable = this.trendWindowedTable
                    .reify()
                    .groupby(this.dateColumn)
                    .rollup({
                        value: op.median(this.valueColumn),
                    });

                return agg(rolledupTable, op.mean("value"));
            } else {
                if (this.trendWindowedTable.numRows() != 3) {
                    return null;
                }

                return agg(this.trendWindowedTable, op.mean(this.valueColumn));
            }
        } else {
            return null;
        }
    }

    get format() {
        return this.args.format || "number";
    }

    @action
    drawCanvas(canvas) {
        const ctx = canvas.getContext("2d");

        let canvasWidth = canvas.width;
        let canvasHeight = canvas.height;

        let offsetValue = {
            top: 6,
            bottom: 26,
        };
        let offsetBenchmark = {
            top: 0,
            bottom: 20,
        };

        let maxValue =
            d3.max([
                0,
                this.value,
                this.median,
                this.q25,
                this.q75,
                this.comparison,
            ]) * 1.1;

        let xScale = d3.scaleLinear([0, maxValue], [0, canvasWidth]);

        // Draw background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw background
        ctx.fillStyle = "#F2F2F2";
        ctx.fillRect(
            0,
            offsetBenchmark.top,
            canvasWidth,
            canvasHeight - offsetBenchmark.top - offsetBenchmark.bottom,
        );

        if (this.showBenchmark) {
            // Draw Quantiles
            ctx.fillStyle = "#D7DDE4";
            ctx.fillRect(
                xScale(this.q25),
                offsetBenchmark.top,
                xScale(this.q75) - xScale(this.q25),
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top,
            );

            // Draw Median
            ctx.fillStyle = "#2B3440";
            ctx.fillRect(
                xScale(this.median) - 2,
                offsetBenchmark.top,
                4,
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top,
            );
        }

        // Draw value
        ctx.fillStyle = "rgb(31, 119, 180)";
        ctx.fillRect(
            0,
            offsetValue.top,
            xScale(this.value),
            canvasHeight - offsetValue.bottom - offsetValue.top,
        );

        if (this.showTrend) {
            ctx.fillStyle = "rgb(174, 199, 232)";
            ctx.fillRect(
                xScale(this.comparison) - 2,
                offsetBenchmark.top,
                4,
                canvasHeight - offsetBenchmark.bottom - offsetBenchmark.top,
            );
        }
        // Draw axis
        let axisY = canvas.height - offsetBenchmark.bottom;

        let xTicks = xScale.ticks(3);
        let tickSize = 6;

        ctx.strokeStyle = "#1f2937";
        ctx.beginPath();
        xTicks.forEach((d) => {
            ctx.moveTo(xScale(d), axisY);
            ctx.lineTo(xScale(d), axisY + tickSize);
        });
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, axisY + tickSize);
        ctx.lineTo(0, axisY);
        ctx.lineTo(canvasWidth, axisY);
        ctx.lineTo(canvasWidth, axisY + tickSize);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "black";
        xTicks.forEach((d) => {
            ctx.beginPath();
            ctx.fillText(
                formatterFor(this.format)(d),
                xScale(d),
                axisY + tickSize,
            );
        });
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
<div class="widget-view">
  <div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
  <div class="widget-title">{{this.title}}</div>
  <div class="widget-value">{{valueFormatHelper
      this.value
      this.format
    }}</div>
  <div class="widget-canvas-fixed">
    <canvas
      width="0"
      height="40"
      {{canvasModifier this}}
    >></canvas>
  </div>
  {{#if this.showBenchmark}}
    <div class="text-xs grid">
      {{this.benchmarkTitle}}: Q25:
      {{valueFormatHelper this.q25 this.format}}
      - M:
      {{valueFormatHelper this.median this.format}}
      - Q75:
      {{valueFormatHelper this.q75 this.format}}
    </div>
  {{/if}}
  <div class="grid grid-cols-2">
    <div class="text-xs grid">⌀ drei
      {{displayFormatHelper this.display}}:
      {{valueFormatHelper this.comparison this.format}}
    </div>
    <div
      class="text-xs grid text-right {{trendColorHelper this.trend}}"
    >{{trendFormatHelper this.trend}}</div>
  </div>
</div> 	</div>
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
