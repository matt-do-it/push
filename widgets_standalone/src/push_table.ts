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
    @service dateCalc;
    @service formatter;

    @tracked currentPage = 1;

    @tracked sortColumn = null;
    @tracked sortAscending = true;

    get data() {
        if (this.args.service) {
            return getOwner(this).lookup("service:" + this.args.service);
        } else {
            return getOwner(this).lookup("service:data");
        }
    }

    get title() {
        return this.args.title;
    }

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || "date";
    }

    @cached
    get date() {
        try {
            return agg(this.data.summarizedTable, op.max(this.dateColumn));
        } catch (error) {
            return null;
        }
    }

    get display() {
        return this.args.display || "isoweek";
    }

    get entriesPerPage() {
        return 20;
    }

    get maximumPage() {
        if (this.latestSummarizedTableNonNull) {
            let itemCount = agg(this.latestSummarizedTableNonNull, op.count());
            let pageCount = Math.floor(itemCount / this.entriesPerPage);
            let remainder = itemCount % this.entriesPerPage;
            if (remainder > 0) {
              pageCount = pageCount + 1;
            }
            return pageCount;
        } else {
            return 1;
        }
    }

    get hasPreviousPage() {
        return this.currentPage > 1;
    }

    get hasNextPage() {
        return this.currentPage < this.maximumPage;
    }

    @cached
    get latestSummarizedTable() {
        try {
            if (this.date == null) {
                return null;
            }

            let totalTable = this.data.summarizedTable;
            totalTable = totalTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]));

            if (this.data.windowFilter) {
                totalTable = totalTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter);
            }

            return totalTable;
        } catch (error) {
            console.log("latestSummarizedTable failed: " + error);
            return null;
        }
    }

    get latestSummarizedTableNonNull() {
      var allNullExpr = "d => (" + this.args.columns.filter(function(c) {
        return !c.isSimpleValue;
      })
      .map(function(c) {
        return "d['" + c.valuePath + "'] > 0"
      })
      .join(" || ") + ")";

      var df = this.latestSummarizedTable
        .filter(allNullExpr);

      if (this.sortColumn) {
        if (this.sortAscending) {
          df = df.orderby(this.sortColumn);
        } else {
          df = df.orderby(desc(this.sortColumn));
        }
      }
      return df;
    }

    get values() {
        let startIndex = (this.currentPage - 1) * this.entriesPerPage;
        let endIndex = this.currentPage * this.entriesPerPage;

        if (this.latestSummarizedTableNonNull) {
            return this.latestSummarizedTableNonNull
                .slice(startIndex, endIndex)
                .objects();
        } else {
            return [];
        }
    }

    @action
    toggleEditMode() {}

    @action
    nextPage() {
        this.currentPage = this.currentPage + 1;
    }

    @action
    previousPage() {
        this.currentPage = this.currentPage - 1;
    }

    @action
    updateColumnSort(sorting) {
        if (sorting == this.sortColumn) {
            this.sortAscending = !this.sortAscending;
        } else {
            this.sortColumn = sorting;
        }
    }

    get columns() {
    if (this.args.columns) {
        return this.args.columns
    } else {
        let allColumns = this.latestSummarizedTableNonNull.columnNames()

        let columnsMapped = allColumns.map(function (c) {
            return {
                name: c,
                valuePath: c,
            }
        })

        return columnsMapped
    }
}

setComponentTemplate(
    precompileTemplate(
        `<div class="push">
        	<div class="widget">
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
										  <th>
											<button
											  type="button"
											  {{on "click" (fn this.updateColumnSort column.valuePath)}}
											>
											  {{column.name}}
											</button>
										  </th>
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
					</div>
					{{#if this.hasPages}}
						<div class="pt-8 flex flex-row">
							<div class="mx-auto content-center">
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
