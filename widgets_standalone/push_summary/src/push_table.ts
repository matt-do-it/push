import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'
import tableValueHelper from './table_value_helper'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

class PushTableComponent extends Component {
    @service dateCalc
    @service formatter

    @tracked currentPage = 1

    @tracked sortColumn = null
    @tracked sortAscending = true

    @service data

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
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

    get entriesPerPage() {
        return 20
    }

    get maximumPage() {
        if (this.latestSummarizedTable) {
            return (
                Math.floor(
                    agg(this.latestSummarizedTable, op.count()) /
                        this.entriesPerPage
                ) + 1
            )
        } else {
            return 1
        }
    }

    get hasPreviousPage() {
        return this.currentPage > 1
    }

    get hasNextPage() {
        return this.currentPage < this.maximumPage
    }

    get hasPages() {
        return this.maximumPage > 1
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
        let startIndex = (this.currentPage - 1) * this.entriesPerPage
        let endIndex = this.currentPage * this.entriesPerPage

        if (this.latestSummarizedTable) {
            return this.latestSummarizedTable
                .slice(startIndex, endIndex)
                .objects()
        } else {
            return []
        }
    }

    @action
    toggleEditMode() {}

    @action
    nextPage() {
        this.currentPage = this.currentPage + 1
    }

    @action
    previousPage() {
        this.currentPage = this.currentPage - 1
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
            let allColumns = this.latestSummarizedTable.columnNames()

            let columnsMapped = allColumns.map(function (c) {
                return {
                    name: c,
                    valuePath: c,
                }
            })

            return columnsMapped
        }
    }
}

setComponentTemplate(
    precompileTemplate(
        `<div class="push widget">
    	<div class="widget-view">
    		<div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
    		<div class="font-bold">Details</div>
	    	<div class="widget-table">
        		<div class="overflow-x-auto">
					<table class="table">
						<!-- head -->
						<thead>
							<tr>
								{{#each this.columns as |column|}}
									<td>{{column.name}}</td>
								{{/each}}
							</tr>
						</thead>
					<tbody>
						{{#each this.values as |row|}}
							<tr>
								{{#each this.columns as |column|}}
									<td>{{tableValueHelper row column}}</td>
								{{/each}}
							</tr>
						{{/each}}
					</tbody>
				</table>
        	</div>
			{{#if this.hasPages}}
			<div class="pages mx-auto">
				<div class="join">
					{{#if this.hasPreviousPage}}
						<button
							class="join-item btn"
							{{on "click" this.previousPage}}
						>«</button>
					{{/if}}
					<button class="join-item btn">Page {{this.currentPage}}</button>
					{{#if this.hasNextPage}}
						<button
							class="join-item btn"
							{{on "click" this.nextPage}}
						>»</button>
					{{/if}}
				</div>
			</div>
			{{/if}}
	    </div>
	</div>
</div>
    `,
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
            },
        }
    ),
    PushTableComponent
)

export default PushTableComponent
