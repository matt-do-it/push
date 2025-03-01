import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, escape } from 'arquero'
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

            valueTable = valueTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            if (this.data.windowFilter) {
                valueTable = valueTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }
console.log(this.groupColumns);
            valueTable = valueTable
                .reify()
                .params({ groupColumns: this.groupColumns })
                .derive({
                    groupTitle: escape((d, $) =>
                        op.join(
                            $.groupColumns.map((c) => d[c]),
                            '|'
                        )
                    ),
                })

            var anyNonNullExpr =
                'd => (' +
                this.valueColumns
                    .filter(function (c) {
                        return !c.isSimpleValue
                    })
                    .map(function (c) {
                        return "d['" + c + "'] > 0"
                    })
                    .join(' || ') +
                ')'

            valueTable = valueTable.filter(anyNonNullExpr)

            return valueTable
        } catch (error) {
            console.log('latestSummarizedTable failed: ' + error)
            return null
        }
    }

    @cached
    get values() {
        if (this.valueTable) {
        console.log(this.valueTable.objects());
            return this.valueTable.objects()
        } else {
            return []
        }
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
        return this.args.valueColumns || this.data.numberColumns
    }

    get valueColumnPairs() {
        let pairs = []

        let valueColumns = this.valueColumns

        // Schleife durch alle Elemente im Array
        for (let i = 0; i < valueColumns.length; i++) {
            for (let j = i + 1; j < valueColumns.length; j++) {
                pairs.push([valueColumns[i], valueColumns[j]])
            }
        }

        return pairs
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

    @cached
    get colorColumn() {
        if (this.args.colorColumn) {
            return this.args.colorColumn
        }

        let colorColumn = this.data.groupColumns.filter(function (c) {
            return c.endsWith('.color')
        })

        if (colorColumn.length > 0) {
            return colorColumn[0]
        }

        return null
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
        ]

        if (this.groupColumns.length > 0) {
            let valueTable = this.valueTable
            if (valueTable != null) {
                if (this.colorColumn) {
                    let colorMapping = valueTable
                        .params({
                            colorColumn: this.colorColumn,
                            colorValues: colorValues,
                        })
                        .groupby('groupTitle')
                        .rollup({
                            range: (d, $) =>
                                op.min(
                                    op.recode(
                                        d[$.colorColumn] - 1,
                                        $.colorValues,
                                        '#5EBD82'
                                    )
                                ),
                            order: (d, $) => op.min(d[$.colorColumn]),
                        })
                        .rename({ groupTitle: 'domain' })
                        .orderby('order')
                        .reify()

                    return {
                        domain: colorMapping.column('domain').data,
                        range: colorMapping.column('range').data,
                    }
                } else {
                    let colorMapping = valueTable
                        .params({
                            valueColumn: this.valueColumn,
                        })
                        .groupby('groupTitle')
                        .rollup({})
                        .rename({ groupTitle: 'domain' })
                        .orderby('domain')
                        .reify()

                    let domains = colorMapping.column('domain').data

                    let range = domains.map(function (e, i) {
                        return colorValues[i % 10]
                    })
                    return {
                        domain: domains,
                        range: range,
                    }
                }
            }
        }

        return {
            domain: ['Gesamt'],
            range: ['#5EBD82', '#5EBD82'],
        }
    }

    get legendTitle() {
        if (this.groupColumns.length > 0) {
            return this.groupColumns[0]
        } else {
            return 'Legende'
        }
    }

    @cached
    get groupColumns() {
        return this.data.groupColumns.filter(
            function (c) {
                if (c == this.data.dateColumn || c == this.colorColumn) {
                    return false
                } else {
                    return true
                }
            }.bind(this)
        )
    }

    vegaSpec(valueColumn1, valueColumn2) {
        return {
            width: 'container',
            height: 'container',
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
                    },
                },
                y: {
                    field: valueColumn2,
                    type: 'quantitative',
                    axis: {
                        format: formatFor(this.format),
                    },
                },
                color: {
                            field: 'groupTitle',
                            scale: {
                                domain: this.colorMapping.domain,
                                range: this.colorMapping.range,
                            },
                            legend: {
                                title: this.legendTitle,
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
    		<div class="widget-canvas-grid grid sm:grid-cols-2">
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
