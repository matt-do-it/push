import Component, { tracked, hbs } from "@glimmerx/component";
import { service } from "@glimmerx/service";
import { on, action } from "@glimmer/modifier";
import { table, agg, op } from "arquero";
import { helper } from "@glimmerx/helper";

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from "@glimmer/core";

const formatDisplay = helper(([name], { greeting }) => {
  return `${greeting} ${name}`;
});

class PushTimeComponent extends Component {
  get time() {
    return "time";
  }
}

setComponentTemplate(
  precompileTemplate(
    `
      <div class="widget">
    	<div class="widget-title">Current time</div>
    	{{this.time}}
  	</div>
    `,
    { strictMode: true, scope: { on, formatDisplay } },
  ),
  PushTimeComponent,
);

export default PushTimeComponent;
