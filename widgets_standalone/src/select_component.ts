import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'

import valueFormatHelper from './value_format_helper'
import displayFormatHelper from './display_format_helper'
import canvasModifier from './canvas_modifier'
import trendColorHelper from './trend_color_helper'
import trendFormatHelper from './trend_format_helper'
import dateFormatHelper from './date_format_helper'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

import * as d3 from 'd3'

class SelectComponent extends Component {
    get options() {
        return this.args.options.map(
            function (e) {
                return {
                    title: e,
                    selected: e == this.args.value,
                }
            }.bind(this)
        )
    }

    @action update(event) {
        if (this.args.onInput) {
            this.args.onInput(event.target.value)
        }
    }
}

setComponentTemplate(
    precompileTemplate(
        `
<label class="form-control w-full max-w-xs">
  <div class="label">
    <span class="label-text">{{@title}}</span>
  </div>
  <select class="select select-bordered"  {{on "input" this.update}}>
    <option disabled>Please select</option>
    {{#each this.options as |o|}}
    	{{#if o.selected}}
	    	<option selected="selected">{{o.title}}</option>
	    {{else}}
	    	<option>{{o.title}}</option>
	    
	    {{/if}}
    {{/each}}
  </select>
</label>
`,
        {
            strictMode: true,
            scope: {
                on,
                canvasModifier,
                valueFormatHelper,
                displayFormatHelper,
                dateFormatHelper,
                trendFormatHelper,
                trendColorHelper,
                dateFormatHelper,
            },
        }
    ),
    SelectComponent
)

export default SelectComponent
