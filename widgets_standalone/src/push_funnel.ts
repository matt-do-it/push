import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op, escape } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'
import { compile } from 'vega-lite'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import { formatFor } from './formats'

import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'

import vegaModifier from './vega_modifier'
import InputComponent from './input_component'
import TextareaComponent from './text_area'

import vegaConfig from './vega_config'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushFunnelComponent extends Component {
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
        return this.args.title
    }

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

    get format() {
        return this.args.format || 'number'
    }

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

    get valueTable() {
        try {
            if (this.date == null) {
                return null
            }

            let valueTable = this.data.summarizedTable

            valueTable = valueTable
                .params({
                    dateSet: [this.date],
                    dateColumn: this.data.dateColumn,
                })
                .filter((d, $) => op.includes($.dateSet, d[$.dateColumn]))

            if (this.data.windowFilter) {
                valueTable = valueTable
                    .params(this.data.windowFilterParams)
                    .filter(this.data.windowFilter)
            }

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

    get values() {
        let valueTable = this.valueTable

        if (valueTable == null) {
            return []
        }

        let data = this.valueTable.objects().reduce(
            function (allData, e) {
                var elements = []

                for (var i = 0; i < this.valueColumns.length; i++) {
                    if (e[this.valueColumns[i]]) {
                        var modified = {}

                        for (var j = 0; j < this.groupColumns.length; j++) {
                            modified[this.groupColumns[j]] =
                                e[this.groupColumns[j]]
                        }
                        modified['phase'] = this.phaseTitles[i]
                        modified['value'] = e[this.valueColumns[i]]
                        modified['groupTitle'] = this.groupColumns
                            .map(function (g) {
                                return e[g]
                            })
                            .join('|')

                        elements.push(modified)
                    }
                }

                return allData.concat(elements)
            }.bind(this),
            []
        )

        let orderMap = {}

        data.forEach(function (x) {
            if (orderMap[x.groupTitle]) {
                orderMap[x.groupTitle] = orderMap[x.groupTitle] + x.value
            } else {
                orderMap[x.groupTitle] = x.value
            }
        })

        const sortValues = Object.values(orderMap)

        const sortValuesSorted = sortValues.sort((a, b) => a - b)

        let rankMap = {}
        sortValues.forEach((value, index) => {
            rankMap[value] = index
        })

        let orderMapped = {}
        for (const [key, value] of Object.entries(orderMap)) {
            orderMapped[key] = rankMap[value]
        }

        let showOrderUntil = sortValues.length * (7 / 10)

        let modifiedData = data.map(function (e) {
            e['order'] = orderMapped[e['groupTitle']]
            return e
        })

        return modifiedData
    }

    get groupTitleTransform() {
        if (this.titleColumn) {
            return {
                calculate: "datum['" + this.titleColumn + "']",
                as: 'groupTitle',
            }
        } else {
            return { calculate: "'Gesamt'", as: 'groupTitle' }
        }
    }

    get valueColumns() {
        return this.args.valueColumns || []
    }

    get phaseTitles() {
        return this.args.phaseTitles || []
    }

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

    get vegaTimeUnit() {
        if (this.display == 'isoyear') {
            return 'year'
        }
        if (this.display == 'isoquarter') {
            return 'yearquarter'
        }
        if (this.display == 'isoweek') {
            return 'yearweek'
        }
    }

    get tooltip() {
        var tooltips = []

        this.data.groupColumns.forEach(
            function (e) {
                if (e != this.colorColumn && e != this.data.dateColumn) {
                    tooltips.push({
                        field: e.replace(/\./, '\\.'),
                    })
                }
            }.bind(this)
        )
        tooltips.push({
            field: 'phase',
            type: 'nominal',
        })

        tooltips.push({
            field: 'value',
            type: 'quantitative',
            format: formatFor('number'),
        })

        return tooltips
    }

    get legendTitle() {
        if (this.groupColumns.length > 0) {
            return this.groupColumns[0]
        } else {
            return 'Legende'
        }
    }

    get compiledVegaSpec() {
        let liteSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 'container',
            height: 'container',
            data: { values: this.values },
            mark: { type: 'bar', tooltip: true },
            encoding: {
                order: {
                    field: 'order',
                },
            },
            layer: [
                {
                    mark: {
                        type: 'bar',
                    },
                    encoding: {
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
                        x: {
                            field: 'phase',
                            sort: this.phaseTitles,
                        },
                        y: {
                            field: 'value',
                            aggregate: 'sum',
                            stack: 'normalize',
                        },
                        tooltip: this.tooltip,
                    },
                },

                {
                    mark: {
                        type: 'text',
                        opacity: 0.9,
                        color: 'white',
                    },
                    encoding: {
                        text: { field: 'groupTitle', type: 'nominal' },
                        x: {
                            field: 'phase',
                            sort: this.phaseTitles,
                        },
                        y: {
                            field: 'value',
                            aggregate: 'sum',
                            stack: 'normalize',
                            bandPosition: 0.5,
                        },
                    },
                },
            ],
        }

        const vegaSpec = compile(liteSpec, {
            config: vegaConfig(),
        }).spec

        return vegaSpec
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
		<div class="widget-view">
		  <div class="widget-date">{{dateFormatHelper this.date this.display}}</div>
		  <div class="widget-title">{{this.title}}</div>
		  <div class="widget-canvas aspect-video">
			<div style="width: 100%; height: 100%" {{vegaModifier this.compiledVegaSpec}}>
			</div>
		  </div>
		</div>
  	</div>
    `,
        {
            strictMode: true,
            scope: {
                on,
                canvasModifier,
                vegaModifier,
                valueFormatHelper,
                displayFormatHelper,
                dateFormatHelper,
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,

                InputComponent,
            },
        }
    ),
    PushFunnelComponent
)

export default PushFunnelComponent
