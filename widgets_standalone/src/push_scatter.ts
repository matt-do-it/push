import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import vegaModifier from './vega_modifier'
import dateFormatHelper from './date_format_helper'

import InputComponent from './input_component'
import SelectComponent from './select_component'

import valueFormatHelper, { availableFormats } from './value_format_helper'
import displayFormatHelper, { availableDisplays } from './display_format_helper'

import { formatFor } from './formats'
import vegaConfig from './vega_config'

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
	@tracked _title
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

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    @cached
    get format() {
        return this._format || this.args.format || 'number'
    }

    @cached
    get display() {
        return this._display || this.args.display || 'isoweek'
    }

	get valueColumns() {
		return this.args.valueColumns || this.data.numberColumns
	}
	
	get valueColumnPairs() {
		let pairs = [];

		let valueColumns = this.valueColumns;
		
  		// Schleife durch alle Elemente im Array
  		for (let i = 0; i < valueColumns.length; i++) {
    		for (let j = i + 1; j < valueColumns.length; j++) {
      			pairs.push([valueColumns[i], valueColumns[j]]);
    		}
  		}
  		
  		return pairs;
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
        return this.valueColumnPairs.map((c) => this.vegaSpec(c[0], c[1]))
    }

    vegaSpec(valueColumn1, valueColumn2) {
        return {
            width: "container",
            height: "container",
            data: {
                values: this.values,
            },
            mark: 'point',
            encoding: {
                x: { 
                	field: valueColumn1, 
                	type: 'quantitative',
                	axis: {
                        format: formatFor(this.format),
                    } 
                },
                y: { 
                	field: valueColumn2, 
                	type: 'quantitative',
                	axis: {
                        format: formatFor(this.format),
                    } 
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
    		<div class="widget-title">{{this.title}}</div>
    		<div class="widget-canvas-grid grid sm:grid-cols-3">
  				{{#each this.specs as |col|}}
			  		<div class="widget-canvas aspect-video w-full" {{vegaModifier col}}></div>
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
    PushScatterComponent
)

export default PushScatterComponent
