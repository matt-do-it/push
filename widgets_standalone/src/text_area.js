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

class TextareaComponent extends Component {
    @action update(event) {
        if (this.args.onInput) {
            this.args.onInput(event.target.value)
        }
    }
}

setComponentTemplate(
    precompileTemplate(
        `
<label class="form-control">
  <div class="label">
    <span class="label-text">{{@title}}</span>
  </div>
  <textarea class="textarea textarea-bordered h-24" placeholder="" {{on "input" this.update}}>{{@value}}</textarea>
</label>`,
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
    TextareaComponent
)

export default TextareaComponent
