import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, desc } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import trendAvailableHelper from './trend_available_helper'
import dateFormatHelper from './date_format_helper'
import tableValueHelper from './table_value_helper'
import tableTrendHelper from './table_trend_helper'
import tableComparisonHelper from './table_comparison_helper'
import tableSortColumnHelper from './table_sort_column_helper'

import InputComponent from './input_component'
import SelectComponent from './select_component'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

class PushTableComponent extends Component {
    @tracked currentPage = 1

    @tracked offset = 0
    @tracked limit = 10
    @tracked search = ''

    @tracked sortColumn = null
    @tracked sortAscending = false

    @tracked editMode = false

    @tracked _title

	
    get data() {
        if (this.args.service) {
            return getOwner(this).services[this.args.service]
        } else {
            return getOwner(this).services.data
        }
    }

    constructor(owner, args) {
        super(owner, args)

        if (this.args.offset) {
            this.offset = parseInt(this.args.offset)
        }

        if (this.args.limit) {
            this.limit = parseInt(this.args.limit)
        }

        if (this.args.sortColumn) {
            this.sortColumn = this.args.sortColumn
        } else {
            if (this.args.columns && this.args.columns.length > 1) {
                this.sortColumn = this.args.columns[1].valuePath
            }
        }
    }

    get title() {
        return this._title || this.args.title
    }

	get columns() {
		if (this.args.columns) {
			return this.args.columns
		} else {
			return this.data.summarizedTable.columnNames.map(function(c) {
				return {
					title: c
				}
			})
		}
	}


    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.data.dateColumn))
        } catch (error) {
            return null
        }
    }

    get display() {
        return this.args.display || 'isoweek'
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

    @cached get latestSummarizedTableNonNull() {
        var latestSummarizedTable = this.latestSummarizedTable
        if (latestSummarizedTable == null) {
            return null
        }

        var allNullExpr =
            'd => (' +
            this.columns
                .filter(function (c) {
                    return !c.isSimpleValue
                })
                .map(function (c) {
                    return "d['" + c.valuePath + "'] > 0"
                })
                .join(' || ') +
            ')'

        var df = latestSummarizedTable.filter(allNullExpr)

        if (this.search) {
            var searchExpr =
                'd => (' +
                this.columns
                    .filter(function (c) {
                        return c.isSimpleValue
                    })
                    .map(
                        function (c) {
                            return (
                                "op.match(d['" +
                                c.valuePath +
                                "'], /" +
                                this.search +
                                '/i)'
                            )
                        }.bind(this)
                    )
                    .join(' || ') +
                ')'

            df = df.filter(searchExpr)
        }

        if (this.sortColumn) {
            if (this.sortAscending) {
                df = df.orderby(this.sortColumn)
            } else {
                df = df.orderby(desc(this.sortColumn))
            }
        }

        return df
    }

    get values() {
        let startIndex = this.offset
        let endIndex = this.offset + this.limit - 1
        if (this.latestSummarizedTableNonNull) {
            return this.latestSummarizedTableNonNull
                .slice(startIndex, endIndex)
                .objects()
        } else {
            return []
        }
    }

    @action
    updateColumnSort(sorting) {
        if (sorting == this.sortColumn) {
            this.sortAscending = !this.sortAscending
        } else {
            this.sortColumn = sorting
        }
    }

    get columns() {
    	
        if (this.args.columns) {
            return this.args.columns
        } else {
            let allColumns = this.data.summarizedTable.columnNames()

            let columnsMapped = allColumns.map(function (c) {
                return {
                    name: c,
                    valuePath: c,
                }
            })

            return columnsMapped
        }
    }

    get offsetFormatted() {
        return this.offset + 1
    }

    get limitList() {
        return [
            {
                limit: 10,
                isActive: this.limit == 10,
            },
            {
                limit: 20,
                isActive: this.limit == 20,
            },
            {
                limit: 50,
                isActive: this.limit == 50,
            },
            {
                limit: 100,
                isActive: this.limit == 100,
            },
        ]
    }

    @action updateLimit(event) {
        this.limit = parseInt(event.target.value)
    }

    get totalRecords() {
        if (this.latestSummarizedTableNonNull) {
            return this.latestSummarizedTableNonNull.numRows()
        } else {
            return 0
        }
    }

    get offsetNextFormatted() {
        return Math.min(this.offset + this.limit, this.totalRecords)
    }

    get pageList() {
        let showPages = 2

        let pageCount = Math.ceil(this.totalRecords / this.limit) // Zero based
        let currentPage = this.offset / this.limit // Zero based

        let pageList = []

        if (currentPage > 0) {
            pageList.push({
                title: 1,
                offset: 0,
                isActive: false,
            })
        }

        if (currentPage - showPages - 1 > 0) {
            pageList.push({
                title: '...',
                offset: (currentPage - showPages - 1) * this.limit,
                isActive: false,
            })
        }

        for (
            var i = Math.max(currentPage - showPages, 1);
            i < currentPage;
            i++
        ) {
            pageList.push({
                title: i + 1,
                offset: i * this.limit,
                isActive: false,
            })
        }

        pageList.push({
            title: currentPage + 1,
            offset: this.offset,
            isActive: true,
        })

        for (
            var i = currentPage + 1;
            i < Math.min(currentPage + 1 + showPages, pageCount - 1);
            i++
        ) {
            pageList.push({
                title: i + 1,
                offset: i * this.limit,
                isActive: false,
            })
        }

        if (currentPage + 1 + showPages < pageCount - 1) {
            pageList.push({
                title: '...',
                offset: (currentPage + 1 + showPages) * this.limit,
                isActive: false,
            })
        }

        if (currentPage < pageCount - 1) {
            pageList.push({
                title: pageCount,
                offset: (pageCount - 1) * this.limit,
                isActive: false,
            })
        }

        return pageList
    }

    @action updateOffset(value) {
        this.offset = parseInt(value)
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
				  <table class="table table-fixed border border-solid border-slate-100 rounded-md flex-grow">
					<thead>
					  <tr>
						{{#each this.columns as |column|}}
						  <th>
				
							  {{column.name}}
				  

						  </th>
						{{/each}}
					  </tr>
					</thead>
					<tbody>
					  {{#each this.values as |row|}}
						<tr>
						  {{#each this.columns as |column|}}
							<td>
							  {{#if column.format}}
								<div class="md:flex md:flex-col justify-between">
								  <div class="{{if this.isNA 'text-base-300' ''}}">
									{{valueFormatHelper
									  (tableValueHelper row column)
									  column.format
									}}
								  </div>
								  {{#if (trendAvailableHelper row column)}}
									<div class="flex-row">
									  <div
										class="text-xs
										  {{trendColorHelper (tableTrendHelper row column)}}"
									  >
										{{trendFormatHelper (tableTrendHelper row column)}}
									  </div>
									  <div class="text-base text-xs">
										Ø drei
										{{displayFormatHelper this.display}}:
										{{valueFormatHelper
										  (tableComparisonHelper row column)
										  column.format
										}}
									  </div>
									</div>
								  {{/if}}
								</div>

							  {{else}}
								{{tableValueHelper row column}}
							  {{/if}}
							</td>
						  {{/each}}
						</tr>
					  {{/each}}
					</tbody>
				  </table>
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
				</div>
				<div class="widget-toggle">
					<button class="btn btn-xs btn-circle" {{on "click" this.toggleEditMode}}>✕</button>
				</div>
			</div>
			{{/if}}
		</div>   `,
        {
            strictMode: true,
            scope: {
                on,
                dateFormatHelper,
                valueFormatHelper,
                displayFormatHelper,
                dateFormatHelper,
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,

                tableValueHelper,
                tableComparisonHelper,
                tableTrendHelper,
                tableSortColumnHelper,
                trendAvailableHelper,

                InputComponent,
                SelectComponent,
            },
        }
    ),
    PushTableComponent
)

export default PushTableComponent
