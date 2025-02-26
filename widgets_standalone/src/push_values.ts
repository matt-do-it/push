import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import vegaModifier from './vega_modifier'
import dateFormatHelper from './date_format_helper'

import InputComponent from './input_component'
import SelectComponent from './select_component'

import { formatFor } from './formats'

import valueFormatHelper, { availableFormats } from './value_format_helper'
import displayFormatHelper, { availableDisplays } from './display_format_helper'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import vegaConfig from './vega_config'


const formatDisplay = helper(([name], { greeting }) => {
    return `${greeting} ${name}`
})

class PushValuesComponent extends Component {
    @tracked _valueColumn
    @tracked _format
    @tracked _display

    @tracked editMode

    get data() {
        let applicationInstance = getOwner(this)

        return applicationInstance.services[this.args.service || 'data']
    }

    get title() {
		return this._title || this.args.title    
	}


    get values() {
        return this.latestSummarizedTable.objects()
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
    get valueColumn() {
        return this._valueColumn || this.args.valueColumn || 'value'
    }

    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    get columns() {
        return this.args.columns || this.data.categoryColumns
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
            console.log('latestSummarizedTable failed: ' + error)
            return null
        }
    }

    get specs() {
        return this.columns.map((c) => this.vegaSpec(c))
    }

    vegaSpec(column) {
        let liteSpec = {
            width: 'container',
            height: 'container',
            data: {
                values: this.values,
            },
            mark: {
                type: 'boxplot',
                extent: 'min-max',
            },
            encoding: {
                x: { field: column },
                y: { field: this.valueColumn, type: 'quantitative',                     axis: {
                        format: formatFor(this.format),
                    },
 },
            },
        }
        
                const vegaSpec = compile(liteSpec, {
            config: vegaConfig(),
        }).spec

        return vegaSpec

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
    updateValueColumn(input) {
        try {
            this._valueColumn = input
        } catch (error) {
            this._valueColumn = null
        }
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
      <div class="push widget">
		{{#unless this.editMode}}
      	<div class="widget-view">
			<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
    		<div class="widget-title">{{@title}}</div>
			<div class="widget-canvas-row flex flex-row justify-stretch">
	  			{{#each this.specs as |col|}}
	  				<div class="flex flex-col flex-auto w-10 overflow-hidden">
	  					<div class="widget-canvas aspect-video w-full">
		    				<div style="width: 100%; height: 100%" {{vegaModifier col}}></div>
		    			</div>
	    			</div>
    			{{/each}}
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
    `,
        {
            strictMode: true,
            scope: {
                on,
                formatDisplay,
                dateFormatHelper,
                vegaModifier,
                
                InputComponent,
                SelectComponent,
            },
        }
    ),
    PushValuesComponent
)

export default PushValuesComponent
