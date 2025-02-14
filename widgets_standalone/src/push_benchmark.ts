import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, escape } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'
import dateHistoryFormatHelper from './date_history_format_helper'

import vegaModifier from './vega_modifier'
import InputComponent from './input_component'
import TextareaComponent from './text_area'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushBenchmarkComponent extends Component {
    @service data
    
    @service dateCalc
    @service formatter

    get title() {
        return this.args.title
    }

    @cached
    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    @cached
    get colorColumn() {
    	if (this.args.colorColumn) {
    		return this.args.colorColumn; 
    	}
    	
    	let colorColumn = this.data.groupColumns.filter(function(c) {
    		return c.endsWith(".color");
    	})
    	
    	if (colorColumn.length > 0) {
    		return colorColumn[0];
    	}

        return null;
    }

	get valueColumn() {
		return this.args.valueColumn || "costPerContact";
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
    get display() {
        return this.args.display || 'isoweek'
    }

    @cached
    get format() {
        return this.args.format || 'number'
    }

    @cached
    get groupColumns() {
    	return this.data.groupColumns.filter(function(c) {
    		if (c == this.dateColumn || c == this.colorColumn) {
    			return false; 
    		} else {
    			return true; 
    		}
    	}.bind(this));
    }


    @cached
    get valueTable() {
        try {
            let dateCurrent = this.date
            let datePrevious = this.dateCalc.previousDate(
                this.date,
                this.display,
                1
            )

            let valueTable = this.data.summarizedTable.filter(
                function (d) {
                    return (
                        d['costPerContact'] != null &&
                        op.is_finite(d['costPerContact'])
                    )
                }
            )

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
				.derive({ groupTitle: escape((d, $) => op.join($.groupColumns.map((c) => d[c]), "|") )})

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

    @cached
    get valueColumn() {
        return this.args.valueColumn
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
                if (e != this.colorColumn && e != this.dateColumn) {
                    tooltips.push({
                        field: e.replace(/\./, '\\.'),
                    })
                }
            }.bind(this)
        )

        tooltips.push({
            field: this.valueColumn,
            type: 'quantitative',
            format: this.formatter.formatFor(this.format),
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
            transform: [
                {
                    calculate:
                        "timeOffset('day', toDate(datum.date), if(dayofyear(timeOffset('day', toDate(datum.date), 3))%7<5,6,-1))",
                    as: 'displayDate',
                }
            ],
            encoding: {
                x: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {
                        format: this.formatter.formatFor(this.format),
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
            config: this.formatter.vegaConfig,
        }).spec
        console.log(vegaSpec)
        return vegaSpec
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
		<div class="widget-view">
		  <div class="widget-date">{{dateHistoryFormatHelper
			  this.date
			  this.display
			}}</div>
		  <div class="widget-title">{{this.title}}</div>
		  <div class="widget-canvas">
			<div style="width: 100%; height: 100%" {{vegaModifier this.compiledVegaSpec}}>
			</div>
		  </div>
		</div>  	
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
            },
        }
    ),
    PushBenchmarkComponent
)

export default PushBenchmarkComponent
