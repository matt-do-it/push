import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, escape } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import vegaModifier from './vega_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'
import dateHistoryFormatHelper from './date_history_format_helper'

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
    @service formatter

    @cached
    get title() {
        return this.args.title
    }

    @cached
    get dateColumn() {
        return this.args.dateColumn || 'date'
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

    @cached
    get valueColumn() {
        return this.args.valueColumn || 'value'
    }

    get display() {
        return this.args.display || 'isoweek'
    }

    get format() {
        return this.args.format || 'number'
    }

    get showLegend() {
        return this.args.showLegend || true
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
				.params({ groupColumns: this.groupColumns })
				.derive({ groupTitle: escape((d, $) => op.join($.groupColumns.map((c) => d[c]), "|") )})
				
            return valueTable
        } catch (error) {
            console.log('valueTable failed: ' + error)
            return null
        }
    }

    @cached
    get groupColumns() {
    	return this.data.groupColumns.filter(function(c) {
    		if (c == this.dateColumn || c == this.colorColumn) {
    			return false; 
    		} else {
    			return true; 
    		}
    	}.bind(this));
    }
    
    @cached
    get values() {
        if (this.valueTable) {
            return this.valueTable.objects()
        } else {
            return []
        }
    }


    @cached
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
		];

    	
    	if (this.colorColumn && this.groupColumns.length > 0) {
    		let valueTable = this.valueTable; 
    		if (valueTable != null) {

    			let colorMapping = valueTable
    				.params({ 
    					colorColumn: this.colorColumn, colorValues: colorValues })
    				.groupby("groupTitle")
    				.rollup({ "range": (d, $) => op.min(op.recode(d[$.colorColumn] - 1, $.colorValues, "#5EBD82")) })
    				.rename({ "groupTitle": "domain" });
    			
    			return {
    				domain: colorMapping.column("domain").data, 
    				range: colorMapping.column("range").data
    			};
    			
    		} 
    	}
    	
    	return {
    		domain: ["", null], 
    		range: ["#5EBD82", "#5EBD82"]
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

    markBarSpec() {
        var spec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            description: 'A simple bar chart with embedded data.',
            width: 'container',
            height: 'container',
            data: {
                values: this.values
            },
            transform: [
                {
                    calculate:
                        "timeOffset('day', toDate(datum.date), if(dayofyear(timeOffset('day', toDate(datum.date), 3))%7<5,6,-1))",
                    as: 'displayDate',
                }
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
                    legend: true,
                },
                y: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {
                        format: this.formatter.formatFor(this.format),
                    },
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
                values: this.values
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

                    legend: true,
                },
                y: {
                    field: this.valueColumn,
                    type: 'quantitative',
                    axis: {
                        format: this.formatter.formatFor(this.format),
                    },
                },
                tooltip: this.tooltip,
            },
        }

        return spec
    }

    get compiledVegaSpec() {
        let liteSpec

        if (this.args.mark == 'line') {
            liteSpec = this.markLineSpec()
        } else {
            liteSpec = this.markBarSpec()
        }

        const vegaSpec = compile(liteSpec, {
            config: this.formatter.vegaConfig,
        }).spec
        return vegaSpec
    }
}

setComponentTemplate(
    precompileTemplate(
        `
		<div class="widget-view">
		  <div class="widget-date">{{dateHistoryFormatHelper
			  this.date
			  this.display
			}}</div>
		  <div class="widget-title">{{this.title}}</div>
		  <div class="widget-canvas">
			<div style="width: 100%" {{vegaModifier this.compiledVegaSpec}}>
			</div>
		  </div>
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
                TextareaComponent,
            },
        }
    ),
    PushHistoryComponent
)

export default PushHistoryComponent
