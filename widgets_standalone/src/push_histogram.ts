import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import vegaConfig from './vega_config'
import vegaModifier from './vega_modifier'

import { formatFor } from './formats';

import dateFormatHelper from './date_format_helper'
import valueFormatHelper from './value_format_helper'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

const formatDisplay = helper(([name], { greeting }) => {
    return `${greeting} ${name}`
})

class PushHistogramComponent extends Component {
    @service data

    @service dateCalc

    get title() {
        if (this.isMultiGrouped) {
            return this.args.title + ' - Median'
        } else {
            return this.args.title
        }
    }

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    get binColumns() {
        if (this.args.binColumns) {
            return this.args.binColumns.split(',')
        }

        let numberColumns = this.data.numberColumns
        let filteredNumberColumns = numberColumns.filter(function (c) {
            return !c.endsWith('Trend') && !c.endsWith('Previous')
        })
        return filteredNumberColumns
    }

    get binColumnsFormatted() {
        return this.binColumns.map(
            function (e) {
                let median = null
                let q25 = null
                let q75 = null

                if (
                    this.latestSummarizedTable &&
                    this.latestSummarizedTable.columnIndex(e) > -1
                ) {
                    median = agg(this.latestSummarizedTable, op.median(e))
                    q25 = agg(this.latestSummarizedTable, op.quantile(e, 0.25))
                    q75 = agg(this.latestSummarizedTable, op.quantile(e, 0.75))
                }

                return {
                    column: e,
                    title: e,
                    median: median,
                    q25: q25,
                    q75: q75,
                    spec: this.compiledVegaSpec(e),
                }
            }.bind(this)
        )
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
    get latestSummarizedTable() {
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

            if (this.data.windowFilter) {
                totalTable = totalTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }

            return totalTable
        } catch (error) {
            console.log('latestSummarizedTable failed: ' + error)
            return null
        }
    }

    get values() {
        if (this.latestSummarizedTable) {
            return this.latestSummarizedTable.objects()
        } else {
            return []
        }
    }

    compiledVegaSpec(column) {
        let liteSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: this.values },
            mark: { type: 'bar', tooltip: true },
            width: 'container',
            encoding: {
                x: {
                    field: column,
                    bin: { maxbins: 20 },
                    axis: {
                        format: formatFor(this.format),
                    },
                },
                y: { aggregate: 'count' },
            },
        }

        const vegaSpec = compile(liteSpec).spec
        return vegaSpec
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
		{{#each this.binColumnsFormatted as |column|}}
		  <div class="widget-view">
			<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
			<div class="widget-title">{{this.title}}</div>
			<div class="widget-canvas">
			  <div
				style="width: 100%"
				{{vegaModifier column.spec}}
			  >
			  </div>
			</div>
			<div class="widget-help">{{@help}}</div>
			<div class="widget-additional">
			  {{column.title}}: Q25:
			  {{valueFormatHelper column.q25 this.format}}
			  - M:
			  {{valueFormatHelper column.median this.format}}
			  - Q75:
			  {{valueFormatHelper column.q75 this.format}}
			</div>

		  </div>
		{{/each}}
  	</div>
    `,
        {
            strictMode: true,
            scope: {
                on,
                formatDisplay,
                dateFormatHelper,
                valueFormatHelper,
                vegaModifier,
                InputComponent,
                TextareaComponent,
            },
        }
    ),
    PushHistogramComponent
)

export default PushHistogramComponent
