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

class PushTableComponent extends Component {
  @service data;

  get summarizedTable() {
    try {
      let summarizedTable = this.data.groupedTable;

      if (this.data.rollup) {
        summarizedTable = summarizedTable.rollup(this.data.rollup);
      }
      if (this.data.derive) {
        summarizedTable = summarizedTable.derive(this.data.derive);
      }
      return summarizedTable;
    } catch (error) {
      console.log("summarytable failed: " + error);
      return null;
    }
  }
}

setComponentTemplate(
  precompileTemplate(
    `<div class="widget">
    	<div class="widget-table">
	        {{this.summarizedTable}}
	    </div>
    </div>
    `,
    { strictMode: true, scope: { on } },
  ),
  PushTableComponent,
);

export default PushTableComponent;
