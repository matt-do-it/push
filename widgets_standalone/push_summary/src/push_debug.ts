import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

const formatDisplay = helper(([name], { greeting }) => {
    return `${greeting} ${name}`
})

class PushDebugComponent extends Component {
    @service data

    get filter() {
        return this.data.filter
    }

    get groupColumns() {
        return this.data.groupColumns
    }

    get groupNames() {
        return ''
        return this.data.groupNames
    }

    get columnNames() {
        return this.data.filteredTable.columnNames()
    }

    get derive() {
        return JSON.stringify(this.data.derive)
    }

    get rollup() {
        return JSON.stringify(this.data.rollup)
    }
}

setComponentTemplate(
    precompileTemplate(
        `
      <div class="push widget">
      	<div class="widget-view">
			<div class="widget-title">DEBUG</div>
			<div class="">
				Filter:
				{{this.filter}}
			</div>
			<div class="">
				Group:
				{{this.groupColumns}}
			</div>
			<div class="">
				Column names:
				{{this.columnNames}}
			</div>
			<div class="">
				Rollup:
				{{this.rollup}}
			</div>
			<div class="">
				Derive:
				{{this.derive}}
			</div>
		</div>
  	</div>
    `,
        { strictMode: true, scope: { on, formatDisplay } }
    ),
    PushDebugComponent
)

export default PushDebugComponent
