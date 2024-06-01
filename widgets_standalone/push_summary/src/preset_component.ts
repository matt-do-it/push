import Component, { tracked, hbs } from "@glimmerx/component";
import { service } from "@glimmerx/service";
import { on, action } from "@glimmer/modifier";
import { table, agg, op } from "arquero";
import { helper, fn } from "@glimmerx/helper";

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from "@glimmer/core";

class PresetComponent extends Component {
  @service preset;
  @service data;

  get presets() {
    return this.preset.presets;
  }

  @action
  async loadPreset(preset, event) {
    this.preset.load(this.data, preset);
  }
}

setComponentTemplate(
  precompileTemplate(
    `    
    <h3>Datasets</h3>
    <ul class="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
    	{{#each this.presets as |preset|}}
      		<li><a {{on "click" (fn this.loadPreset preset)}}>{{preset.title}}</a></li>
    	{{/each}}
    </ul>

    `,
    { strictMode: true, scope: { on, fn } },
  ),
  PresetComponent,
);

export default PresetComponent;
