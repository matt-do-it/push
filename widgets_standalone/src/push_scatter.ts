import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import vegaModifier from './vega_modifier'
import dateFormatHelper from './date_format_helper'

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

class PushScatterComponent extends Component {
    @service data

    @tracked _dateColumn
    @tracked _valueXColumn
    @tracked _valueYColumn

    @tracked editMode

    get values() {
        return this.latestSummarizedTable.objects()
    }

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    @cached
    get valueXColumn() {
        return this._valueXColumn || this.args.valueXColumn || 'value'
    }

    @cached
    get valueYColumn() {
        return this._valueYColumn || this.args.valueYColumn || 'value'
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
        return this.args.display || 'isoquarter'
    }

    get columns() {
        if (this.args.columns) {
            return this.args.columns
        } else {
            return this.data.getCategoryColumns()
        }
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

    get specs() {
        return this.columns.map((c) => this.vegaSpec(c))
    }

    vegaSpec(column) {
        return {
            width: 200,
            data: {
                values: this.values,
            },
            mark: 'point',
            encoding: {
                x: { field: this.valueXColumn, type: 'quantitative' },
                y: { field: this.valueYColumn, type: 'quantitative' },
            },
        }
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
      	<div class="widget-view">
			<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
    		<div class="widget-title">Values</div>
  			{{#each this.specs as |col|}}
    			<div class="render" {{vegaModifier col}}></div>
    		{{/each}}
    	</div>
  	</div>
    `,
        {
            strictMode: true,
            scope: { on, formatDisplay, dateFormatHelper, vegaModifier },
        }
    ),
    PushScatterComponent
)

export default PushScatterComponent
