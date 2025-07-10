import Component, { tracked, hbs } from '@glimmerx/component'
import { service } from '@glimmerx/service'
import { on, action } from '@glimmer/modifier'
import { table, agg, op } from 'arquero'
import { helper } from '@glimmerx/helper'
import { cached } from '@glimmer/tracking'

import vegaModifier from './vega_modifier'
import dateFormatHelper from './date_format_helper'
import rootUrlHelper from './root_url_helper'

import InputComponent from './input_component'
import TextareaComponent from './text_area'

import {
    precompileTemplate,
    setComponentTemplate,
    getOwner,
    templateOnlyComponent,
} from '@glimmer/core'

const formatDisplay = helper(([name], { greeting }) => {
    return `${greeting} ${name}`
})

class SlideComponent extends Component {
    @service data

    get currentYear() {
        return 2025
    }
}

setComponentTemplate(
    precompileTemplate(
        `
        <div class="push">
<div class="w-[1920px] h-[1080px] border-solid border break-after-page" >
  <div class="w-[1920px] h-[140px] pl-8 pt-4">
    <h1 class="text-[44px] leading-[1.3]">{{@title1}}</h1>
    <h2 class="text-[44px] leading-none text-primary">{{@title2}}</h2>
  </div>
  <div class="w-[1920px] h-[860px] bg-base-200 pt-2 pb-2 pl-8 pr-8 flex flex-col">
      {{yield}}
  </div>
  <div class="w-[1920px] h-[80px] text-base-300 relative">
    <div class="page text-[22px] absolute top-4 left-8 text-base-300">
      {{@pageNr}} 
    </div>
    <div class="copy absolute top-4 left-16 text-[12px]">
      <span class="text-base-content">Building Technologies | BT-IE/MKC | {{this.currentYear}}</span><br>
      © Robert Bosch GmbH {{this.currentYear}}. Alle Rechte vorbehalten, auch bzgl. jeder Verfügung, Verwertung, Reproduktion, Bearbeitung, Weitergabe sowie für den Fall von Schutzrechtsanmeldungen.
    </div>

    <div class="absolute w-[1920px] h-[16px] bottom-0 left-0 bg-[url(supergraphic.svg)] bg-cover bg-center">
    </div>

  </div>
</div>
</div>
    `,
        {
            strictMode: true,
            scope: {
                on,
                formatDisplay,
                dateFormatHelper,
                vegaModifier,
                InputComponent,
                rootUrlHelper,
            },
        }
    ),
    SlideComponent
)

export default SlideComponent
