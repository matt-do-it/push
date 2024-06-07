import Component, { tracked, hbs } from "@glimmerx/component";
import { service } from "@glimmerx/service";
import { on, action } from "@glimmer/modifier";
import { table, agg, op } from "arquero";
import { helper } from "@glimmerx/helper";

import valueFormatHelper, { numberFormatter } from "./value_format_helper";
import displayFormatHelper from "./display_format_helper";
import canvasModifier from "./canvas_modifier";
import trendColorHelper from "./trend_color_helper";
import trendFormatHelper from "./trend_format_helper";
import dateFormatHelper from "./date_format_helper";

import InputComponent from "./input_component";
import TextareaComponent from "./text_area";

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from "@glimmer/core";

import * as d3 from "d3";

class PushSummaryComponent extends Component {
  @service data;
  @service dateCalc;

  @tracked _dateColumn;
  @tracked _valueColumn;

  @tracked editMode;

  get title() {
    return this.args.title;
  }

  get dateColumn() {
    return this._dateColumn || this.args.dateColumn || "date";
  }

  get valueColumn() {
    return this._valueColumn || this.args.valueColumn || "value";
  }

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

  get windowFilter() {
    return this.args.windowFilter;
  }

  get windowFilterParams() {
    return this.args.windowFilterParams;
  }

  get showBenchmark() {
    return this.windowFilter != null;
  }

  get benchmarkTitle() {
    return this.args.benchmarkTitle;
  }

  get latestFullTable() {
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
      console.log("latestFullTable failed: " + error);
      return null;
    }
  }

  get latestWindowedTable() {
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

      if (this.windowFilter) {
        totalTable = totalTable
          .params(this.windowFilterParams)
          .filter(this.windowFilter);
      }
      return totalTable;
    } catch (error) {
      console.log("latestWindowedTable failed: " + error);
      return null;
    }
  }

  get trendWindowedTable() {
    try {
      if (this.date == null) {
        return null;
      }

      let trendTable = this.data.summarizedTable;

      trendTable = trendTable
        .params({
          dateSet: ["2024-07-01", "2024-04-01", "2024-01-01"],
          dateColumn: this.dateColumn,
        })
        .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]));

      if (this.windowFilter) {
        trendTable = trendTable
          .params(this.windowFilterParams)
          .filter(this.windowFilter);
      }

      if (trendTable.numRows() != 3) {
        return null;
      }
      return trendTable;
    } catch (error) {
      console.log("trendWindowedTable failed: " + error);
      return null;
    }
  }

  get value() {
    if (
      this.latestWindowedTable &&
      this.latestWindowedTable.columnIndex(this.valueColumn) > -1
    ) {
      return this.latestWindowedTable.get(this.valueColumn, 0);
    } else {
      return null;
    }
  }

  get median() {
    if (
      this.latestFullTable &&
      this.latestFullTable.columnIndex(this.valueColumn) > -1
    ) {
      return agg(this.latestFullTable, op.median(this.valueColumn));
    } else {
      return null;
    }
  }

  get q25() {
    if (
      this.latestFullTable &&
      this.latestFullTable.columnIndex(this.valueColumn) > -1
    ) {
      return agg(this.latestFullTable, op.quantile(this.valueColumn, 0.25));
    } else {
      return null;
    }
  }

  get q75() {
    if (
      this.latestFullTable &&
      this.latestFullTable.columnIndex(this.valueColumn) > -1
    ) {
      return agg(this.latestFullTable, op.quantile(this.valueColumn, 0.75));
    } else {
      return null;
    }
  }

  get trend() {
    if (this.value && this.comparison) {
      return this.value / this.comparison - 1;
    } else {
      return null;
    }
  }

  get comparison() {
    if (
      this.trendWindowedTable &&
      this.trendWindowedTable.columnIndex(this.valueColumn) > -1
    ) {
      return agg(this.trendWindowedTable, op.mean(this.valueColumn));
    } else {
      return null;
    }
  }

  get previousDate() {
    return this.dateCalc.previousDate(this.date, this.display, 1);
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
      d3.max([0, this.value, this.median, this.q25, this.q75]) * 1.1;

    let xScale = d3.scaleLinear([0, maxValue], [0, canvasWidth]);

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

    let xTicks = xScale.ticks();
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
      ctx.fillText(numberFormatter(d), xScale(d), axisY + tickSize);
    });
  }

  @action
  updateDateColumn(input) {
    try {
      this._dateColumn = input;
    } catch (error) {
      this._dateColumn = null;
    }
  }

  @action
  updateValueColumn(input) {
    try {
      this._valueColumn = input;
    } catch (error) {
      this._valueColumn = null;
    }
  }

  @action
  toggleEditMode() {
    this.editMode = !this.editMode;
  }
}

setComponentTemplate(
  precompileTemplate(
    `
      <div class="push widget">
        {{#unless this.editMode}}
      	<div class="widget-view">
			<div class="widget-date">{{dateFormatHelper this.date}}</div>
			<div class="widget-title">{{this.title}}</div>
			<div class="widget-value">{{valueFormatHelper this.value}}</div>
			<div class="widget-canvas">
				<canvas width="300" height="40" {{canvasModifier this.drawCanvas}}></canvas>
			</div>	
			{{#if this.showBenchmark}}
			<div class="widget-benchmark">
				{{this.benchmarkTitle}}: 
					Q25: {{valueFormatHelper this.q25}}
					- 
					M: {{valueFormatHelper this.median}}
					- 
					Q75: {{valueFormatHelper this.q75}}
			</div>
			{{/if}}
			<div class="widget-trend">
				<div class="left">⌀ drei {{displayFormatHelper this.display}}: {{valueFormatHelper this.comparison}} </div>
				<div class="right {{trendColorHelper this.trend}}">{{trendFormatHelper this.trend}}</div>
			</div>
			<div class="widget-toggle">
				<button class="btn btn-xs btn-info" {{on "click" this.toggleEditMode}}>ℹ</button>
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
        canvasModifier,
        valueFormatHelper,
        displayFormatHelper,
        dateFormatHelper,
        trendFormatHelper,
        trendColorHelper,
        dateFormatHelper,

        InputComponent,
        TextareaComponent,
      },
    },
  ),
  PushSummaryComponent,
);

export default PushSummaryComponent;
