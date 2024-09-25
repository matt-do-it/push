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

class InputComponent extends Component {
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
  <input type="text" value={{@value}} autocomplete='off' spellcheck='false' autocorrect='off' placeholder="" class="input input-bordered w-full max-w-xs" {{on "input" this.update}}/>
</label>    `,
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
    InputComponent
)

export default InputComponent
