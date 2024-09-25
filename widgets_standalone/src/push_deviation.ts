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

class PushDeviationComponent extends Component {
    @service data

    @tracked _dateColumn
    @tracked _valueColumn
    @tracked _columns

    @tracked editMode

    get values() {
        return this.latestFilteredTable.objects()
    }

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    @cached
    get valueColumn() {
        return this._valueColumn || this.args.valueColumn || 'impressions'
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
        return (
            this._columns || this.args.columns || this.data.getCategoryColumns()
        )
    }

    @cached
    get latestFilteredTable() {
        try {
            if (this.date == null) {
                return null
            }

            let totalTable = this.data.filteredTable
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
            height: 200,
            data: {
                values: this.values,
            },
            encoding: { y: { field: column } },
            layer: [
                {
                    mark: { type: 'point', filled: true },
                    encoding: {
                        x: {
                            aggregate: 'mean',
                            field: this.valueColumn,
                            type: 'quantitative',
                            scale: { zero: false },
                        },
                    },
                },
                {
                    mark: { type: 'errorbar', extend: 'stddev' },
                    encoding: {
                        x: { field: this.valueColumn, type: 'quantitative' },
                    },
                },
            ],
        }
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
    updateColumns(input) {
        try {
            this._columns = input.split(',')
        } catch (error) {
            this._columns = null
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
    		<div class="widget-title">Values</div>
  			{{#each this.specs as |col|}}
    			<div class="render" {{vegaModifier col}}></div>
    		{{/each}}
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
    			<div class="field">
    			    <InputComponent @title="Bin columns" @value={{this.columns}} @onInput={{this.updateColumns}}/>
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
                formatDisplay,
                dateFormatHelper,
                vegaModifier,
                InputComponent,
            },
        }
    ),
    PushDeviationComponent
)

export default PushDeviationComponent
