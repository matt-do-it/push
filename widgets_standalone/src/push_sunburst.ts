import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { fn } from '@glimmer/runtime'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import valueFormatHelper, { numberFormatter } from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class PushSunburstComponent extends Component {
    @service data
    @service dateCalc

    @tracked _dateColumn
    @tracked _valueColumn

    @tracked width
    @tracked height

    @tracked editMode

    @tracked selectedNode = null

    @tracked timer = null
    @tracked shouldAnimate = true

    get title() {
        if (this.args.title) {
            return this.args.title
        } else {
            return 'Hierarchy'
        }
    }

    @cached
    get dateColumn() {
        return this._dateColumn || this.args.dateColumn || 'date'
    }

    @cached
    get valueColumn() {
        return this._valueColumn || this.args.valueColumn || 'value'
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
    get format() {
        return this.args.format || 'number'
    }

    @cached
    get display() {
        return this.args.display || 'isoquarter'
    }

    @cached
    get windowFilter() {
        return this.args.windowFilter
    }

    @cached
    get windowFilterParams() {
        return this.args.windowFilterParams
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
            return totalTable
        } catch (error) {
            console.log('latestSummarizedTable failed: ' + error)
            return null
        }
    }

    get values() {
        if (this.latestSummarizedTable != null) {
            return this.latestSummarizedTable.objects()
        } else {
            return []
        }
    }

    get displayColumns() {
        return this.data.groupColumns
    }

    @cached
    get groupColumns() {
        let g = [...this.data.groupColumns]

        let dateIndex = g.indexOf(this.dateColumn)
        if (dateIndex > -1) {
            g.splice(dateIndex, 1)
        }

        return g
    }

    @cached
    get groupNames() {
        try {
            if (this.groupColumns.length > 0) {
                const uniqueColumnValues: string[][] = this.groupColumns.map(
                    (col) =>
                        (
                            this.data.summarizedTable
                                .rollup({ col: op.array_agg_distinct(col) })
                                .object() as any
                        ).col
                )
                // If just one column, don't do cartesian product and make it a 2D array.
                if (uniqueColumnValues.length === 1) {
                    return uniqueColumnValues[0].map((group) => [group])
                }
                return this.data.cartesian(...uniqueColumnValues)
            } else {
                return []
            }
        } catch (error) {
            return []
        }
    }

    @cached
    get colors() {
        const colors = [
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
        return colors
    }

    get colorDomain() {
        if (this.args.colorColumn && !this.args.colorMapping) {
            let uniqueValues = (
                this.data.summarizedTable
                    .rollup({
                        col: op.array_agg_distinct(this.args.colorColumn),
                    })
                    .object() as any
            ).col
            return uniqueValues
        }

        if (this.args.colorColumn && this.args.colorMapping) {
            let uniqueValues = (
                this.data.summarizedTable
                    .rollup({
                        col: op.array_agg_distinct(this.args.colorColumn),
                    })
                    .object() as any
            ).col
            return uniqueValues
        }

        let groupNames = this.groupNames.map((x) => x.join('|'))
        return groupNames
    }

    get colorRange() {
        if (this.args.colorColumn && !this.args.colorMapping) {
            let colors = this.colors

            let colorDomain = this.colorDomain
            let colorIndex = 0
            let colorRange = colorDomain.map((x, i) => {
                let color = colors[x]
                return color
            })
            return colorRange
        }

        if (this.args.colorColumn && this.args.colorMapping) {
            let colors = this.colors

            let colorDomain = this.colorDomain
            let colorIndex = 0
            let colorRange = colorDomain.map((x, i) => {
                let color = this.args.colorMapping[x]
                return color
            })
            return colorRange
        }

        let colors = this.colors

        let colorDomain = this.colorDomain
        let colorIndex = 0

        let colorRange = colorDomain.map((x, i) => {
            let color = colors[colorIndex++]
            if (colorIndex > this.colors.length - 1) {
                colorIndex = 0
            }
            return color
        })

        return colorRange
    }

    mapToObject(tree, level) {
        let keys = Array.from(tree.keys())
        let children = keys.map(
            function (key) {
                let childTree = tree.get(key)
                if (childTree instanceof d3.InternMap) {
                    let c = {
                        name: key,
                        children: this.mapToObject(childTree, level + 1),
                    }

                    c['color'] = d3.min(c['children'], (d) => d.color)
                    return c
                } else {
                    return {
                        name: key,
                        value: d3.sum(
                            childTree,
                            function (d) {
                                return d[this.valueColumn]
                            }.bind(this)
                        ),
                        color: d3.min(
                            childTree,
                            function (d) {
                                if (this.args.colorColumn) {
                                    return d[this.args.colorColumn]
                                }

                                let color = this.groupColumns
                                    .map((x) => d[x])
                                    .join('|')
                                return color
                            }.bind(this)
                        ),
                    }
                }
            }.bind(this)
        )
        return children
    }

    @cached
    get hierarchyData() {
        let values = this.values.filter(
            function (e) {
                return e[this.valueColumn] != null
            }.bind(this)
        )

        let keys = [...this.groupColumns]
        const dateIndex = keys.indexOf(this.dateColumn)
        if (dateIndex > -1) {
            keys.splice(dateIndex, 1)
        }

        let childs = d3.group(values, ...keys.map((k) => (d) => d[k]))

        let data = { name: 'Root', children: this.mapToObject(childs, 0) }
        return data
    }

    @cached
    get dataRoot() {
        // Construct the data
        const treemapData = d3
            .hierarchy(this.hierarchyData)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value)

        // Specify layout
        const treemapLayout = d3
            .partition()
            .size([2 * Math.PI, treemapData.height + 1])

        // Calculate layout for treemapData
        const root = treemapLayout(treemapData)

        return root
    }

    get dataSelectedRoot() {
        if (this.selectedNode) {
            return this.selectedNode
        } else {
            return this.dataRoot
        }
    }

    get dataAncenstors() {
        return this.dataSelectedRoot.ancestors().reverse()
    }

    @cached
    get animatedNodes() {
        let displayIndices = this.displayColumns.map(
            function (e) {
                return this.groupColumns.indexOf(e)
            }.bind(this)
        )

        // Create the color scale.
        let color = d3.scaleOrdinal(this.colorDomain, this.colorRange)

        let relevantNodes = []
        let ancestors = this.dataSelectedRoot.ancestors()

        ancestors.forEach(function (e) {
            let others = e.children.filter(function (d) {
                return true
                return !ancestors.includes(d)
            })
            relevantNodes = relevantNodes.concat(others)
        })

        relevantNodes = relevantNodes.concat(this.dataSelectedRoot.children)

        return relevantNodes.map(
            function (d) {
                let animated = {
                    arcStart: d.x0,
                    arcEnd: d.x1,
                    levelStart: d.y0,
                    levelEnd: d.y1,
                    color: color(d.data.color),
                    formattedValue: valueFormatHelper([d.value, this.format]),
                    node: d,
                }

                let texts = []

                let p = d.ancestors().reverse()

                for (let i = 1; i < displayIndices.length; i++) {
                    if (displayIndices[i] + 1 < p.length) {
                        let t = p[displayIndices[i] + 1].data.name
                        if (t) {
                            texts.push(t)
                        }
                    }
                }

                animated['texts'] = texts

                return animated
            }.bind(this)
        )
    }

    @cached
    get xMap() {
        return d3.scaleLinear([0, this.width], [0, this.width])
    }

    @cached
    get yMap() {
        return d3.scaleLinear([0, this.height], [0, this.height])
    }

    @action
    drawNodes(ctx, scaledElapsed) {
        let displayIndices = this.displayColumns.map(
            function (e) {
                return this.groupColumns.indexOf(e)
            }.bind(this)
        )

        this.animatedNodes.forEach(
            function (d, i) {
                ctx.fillStyle = d.color
                ctx.strokeStyle = 'white'
                ctx.strokeWidth = 2

                let baseRadius = this.width / 6
                let baseOffset = this.width / 20

                let innerRadius = baseOffset + (d.levelStart - 1) * baseRadius
                let outerRadius = baseOffset + d.levelStart * baseRadius

                ctx.lineWidth = 3

                var innerStartX =
                    this.width / 2 + Math.cos(d.arcStart) * innerRadius
                var innerStartY =
                    this.height / 2 + Math.sin(d.arcStart) * innerRadius

                var innerEndX =
                    this.width / 2 + Math.cos(d.arcEnd) * innerRadius
                var innerEndY =
                    this.height / 2 + Math.sin(d.arcEnd) * innerRadius

                var outerEndX =
                    this.width / 2 + Math.cos(d.arcEnd) * outerRadius
                var outerEndY =
                    this.height / 2 + Math.sin(d.arcEnd) * outerRadius

                var outerStartX =
                    this.width / 2 + Math.cos(d.arcStart) * outerRadius
                var outerStartY =
                    this.height / 2 + Math.sin(d.arcStart) * outerRadius

                var outerTextX =
                    this.width / 2 +
                    Math.cos((d.arcStart + d.arcEnd) / 2) * outerRadius +
                    5
                var outerTextY =
                    this.height / 2 +
                    Math.sin((d.arcStart + d.arcEnd) / 2) * outerRadius +
                    5

                ctx.beginPath()

                ctx.moveTo(innerStartX, innerStartY)
                ctx.arc(
                    this.width / 2,
                    this.height / 2,
                    innerRadius,
                    d.arcStart,
                    d.arcEnd
                )
                ctx.lineTo(outerEndX, outerEndY)
                ctx.arc(
                    this.width / 2,
                    this.height / 2,
                    outerRadius,
                    d.arcEnd,
                    d.arcStart,
                    true
                )
                ctx.lineTo(innerStartX, innerStartY)

                ctx.fill()
                ctx.stroke()

                let levels = 0
                let texts = []

                ctx.fillStyle = 'black'
                ctx.textBaseline = 'top'
                ctx.font = 'bold 12px sans-serif'
                ctx.textAlign = 'left'

                let textOffset = 2

                for (let i = 0; i < d.texts.length; i++) {
                    ctx.save()
                    ctx.translate(outerTextX, outerTextY)
                    ctx.rotate((d.arcStart + d.arcEnd) / 2)

                    ctx.fillText(d.texts[i], 0, textOffset)
                    textOffset = textOffset + 14
                    ctx.restore()
                }

                ctx.fillStyle = 'black'
                ctx.textBaseline = 'top'
                ctx.font = '12px sans-serif'
                ctx.textAlign = 'left'

                ctx.save()
                ctx.translate(outerTextX, outerTextY)
                ctx.rotate((d.arcStart + d.arcEnd) / 2)

                ctx.fillText(d.formattedValue, 0, textOffset)
                ctx.restore()
            }.bind(this)
        )
    }

    @action
    drawAll(ctx, scaledElapsed) {
        ctx.rect(0, 0, this.width, this.height)
        ctx.fillStyle = 'white'
        ctx.fill()

        this.drawNodes(ctx, scaledElapsed)
    }

    @action
    drawCanvas(canvasContainer) {
        const canvas = canvasContainer.querySelector('canvas')
        const ctx = canvas.getContext('2d')

        const t = this.dataSelectedRoot

        const timeScale = d3.scaleLinear([0, 500], [0.0, 1.0]).clamp(true)

        if (this.timer) {
            this.timer.stop()
        }
        this.drawAll(ctx, 0)
        this.timer = d3.timer(
            function (elapsed) {
                var scaledElapsed = timeScale(elapsed)
                this.drawAll(ctx, scaledElapsed)
                if (scaledElapsed == 1) {
                    this.timer.stop()
                    this.shouldAnimate = false
                }
            }.bind(this),
            150
        )
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
    toggleEditMode() {
        this.editMode = !this.editMode
    }

    @action
    mouseClick(event) {
        var rect = event.target.getBoundingClientRect()
        var x = event.clientX - rect.left
        var y = event.clientY - rect.top

        var deltaX = this.width / 2 - x
        var deltaY = this.height / 2 - y
        var rad = Math.atan2(deltaY, deltaX) + Math.PI // In radians
        var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        let baseRadius = this.width / 6
        let baseOffset = this.width / 20

        if (!this.dataSelectedRoot.children) {
            return false
        }
        let selectedElement = this.animatedNodes.find(
            function (d) {
                let innerRadius = baseOffset + (d.levelStart - 1) * baseRadius
                let outerRadius = baseOffset + d.levelStart * baseRadius

                let startAngle = d.arcStart
                let endAngle = d.arcEnd
                console.log(innerRadius)
                if (
                    rad >= startAngle &&
                    rad <= endAngle &&
                    distance >= innerRadius &&
                    distance <= outerRadius
                ) {
                    return true
                } else {
                    return false
                }
            }.bind(this)
        )

        if (selectedElement) {
            this.selectedNode = selectedElement.node
            this.shouldAnimate = true
        }
    }

    @action
    back(node, event) {
        event.preventDefault()
        this.selectedNode = node
        this.shouldAnimate = false
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
			<div class="widget-back">
				{{#each this.dataAncenstors as |ancestor|}}
				/ <a href="#" {{on "click" (fn this.back ancestor)}}>{{ancestor.data.name}}</a> 
				{{/each}}
			</div>
			<div class="widget-canvas aspect-video">
				<div class="canvas-container" style="position: relative; width: 100%; height: 100%" {{canvasModifier this}}>
					<canvas class="canvas" class="cursor-pointer" {{on "click" this.mouseClick}}></canvas>
					<div class="data"></div>
				</div>
			</div>	
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
                fn,
                canvasModifier,
                valueFormatHelper,
                displayFormatHelper,
                dateFormatHelper,
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,

                InputComponent,
                TextareaComponent,
            },
        }
    ),
    PushSunburstComponent
)

export default PushSunburstComponent
