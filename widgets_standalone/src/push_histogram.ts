import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import vegaConfig from './vega_config'
import vegaModifier from './vega_modifier'

import { formatFor } from './formats'

import dateFormatHelper from './date_format_helper'
import valueFormatHelper, { availableFormats } from './value_format_helper'
import displayFormatHelper, { availableDisplays } from './display_format_helper'

import InputComponent from './input_component'
import SelectComponent from './select_component'

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
    @tracked _title
    @tracked _format
    @tracked _display

    @tracked editMode = false

    @tracked data

    constructor(owner, args) {
        super(owner, args)

        if (this.args.service) {
            this.data = owner.services[this.args.service]
        } else {
            this.data = owner.services['data']
        }
    }

    get title() {
        return this._title || this.args.title
    }

    get valueColumns() {
        if (this.args.valueColumn) {
            return [this.args.valueColumn]
        }
        let numberColumns = this.data.numberColumns
        let filteredNumberColumns = numberColumns.filter(function (c) {
            return !c.endsWith('Trend') && !c.endsWith('Previous')
        })
        return filteredNumberColumns
    }

    get valueColumnsFormatted() {
        return this.valueColumns.map(
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

    get values() {
        if (this.latestSummarizedTable) {
            console.log('got values')
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
            height: 'container',
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
				<div class="widget-canvas-grid flex flex-row justify-stretch">
					{{#each this.valueColumnsFormatted as |column|}}
						<div class="flex flex-col flex-auto w-10 overflow-hidden">
							<div class="widget-canvas aspect-video w-full">
								<div style="width: 100%; height: 100%"
									{{vegaModifier column.spec}}>
									
								</div>
							</div>
							<div class="widget-additional text-xs">
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
				<div class="widget-help">{{@help}}</div>
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
                valueFormatHelper,
                vegaModifier,

                InputComponent,
                SelectComponent,
            },
        }
    ),
    PushHistogramComponent
)

export default PushHistogramComponent
