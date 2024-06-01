import Component, { tracked, hbs } from "@glimmerx/component";
import { service } from "@glimmerx/service";
import { on, action } from "@glimmer/modifier";
import { table, agg, op } from "arquero";
import { helper } from "@glimmerx/helper";

import vegaModifier from "./vega_modifier";

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from "@glimmer/core";

const formatDisplay = helper(([name], { greeting }) => {
  return `${greeting} ${name}`;
});

class PushHistogramComponent extends Component {
  @service data;

  get values() {
    return this.data.filteredTable.objects();
  }

  get columns() {
    if (this.args.columns) {
      return this.args.columns;
    } else {
      return this.data.getNumberColumns();
    }
  }

  get specs() {
    return this.columns.map((c) => this.vegaSpec(c));
  }

  vegaSpec(column) {
    return {
      data: {
        values: this.values,
      },
      mark: "bar",
      encoding: {
        x: { field: column, bin: "true", axis: { labelAngle: 0 } },
        y: { aggregate: "count" },
      },
    };
  }
}

setComponentTemplate(
  precompileTemplate(
    `
      <div class="widget">
    	<div class="widget-title">Histogram</div>
  			{{#each this.specs as |col|}}
    	<div class="render" {{vegaModifier col}}></div>
    	{{/each}}
  	</div>
    `,
    { strictMode: true, scope: { on, formatDisplay, vegaModifier } },
  ),
  PushHistogramComponent,
);

export default PushHistogramComponent;
