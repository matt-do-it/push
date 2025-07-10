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

import PushTable from './push_table'
import Slide from './slide'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

class SlideTableComponent extends Component {
    @service dateCalc
    @service formatter

    @tracked offset = 0
    @tracked limit = 10

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
    }

    get title() {
        return this.args.title
    }

    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    get sortColumn() {
        if (this.args.sortColumn) {
            return this.args.sortColumn
        }
        if (this.args.columns && this.args.columns.length > 1) {
            return this.args.columns[1].valuePath
        } else {
            return null
        }
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

    @cached get latestSummarizedTableNonNull() {
        var latestSummarizedTable = this.latestSummarizedTable
        if (latestSummarizedTable == null) {
            return null
        }

        var allNullExpr =
            'd => (' +
            this.args.columns
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
                this.args.columns
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
            df = df.orderby(desc(this.sortColumn))
        }
        return df
    }

    get totalRecords() {
        if (this.latestSummarizedTableNonNull) {
            return this.latestSummarizedTableNonNull.numRows()
        } else {
            return 0
        }
    }

    get pageList() {
        let pageCount = Math.ceil(this.totalRecords / this.limit) // Zero based
        let currentPage = this.offset / this.limit // Zero based

		if (this.args.maxPages > 0 && pageCount > this.args.maxPages) {
			pageCount = this.args.maxPages; 
		}
        let pageList = []
        for (var i = 0; i < pageCount; i++) {
            pageList.push({
                title: this.args.pageOffset + i + 1,
                offset: i * this.limit,
            })
        }
        return pageList
    }
}

setComponentTemplate(
    precompileTemplate(
        `
{{#each this.pageList as |page|}}
<Slide @title1={{@title1}}
       @title2={{@title2}}
       @pageNr={{page.title}}>
	 <PushTable
			@service={{@service}}
			@title="Details"
			@columns={{@columns}}
			@display={{@display}}
			@offset={{page.offset}}
			@sortColumn={{this.sortColumn}}
			@height="100%"
		  />
</Slide>
{{/each}}  `,
        {
            strictMode: true,
            scope: {
                on,
                Slide,
                PushTable,
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
            },
        }
    ),
    SlideTableComponent
)

export default SlideTableComponent
