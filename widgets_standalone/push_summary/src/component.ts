import Component, { tracked, hbs } from '@glimmerx/component';
import { service } from '@glimmerx/service';
import { on, action } from '@glimmer/modifier';
import { table, agg, op } from 'arquero';
import { helper } from '@glimmerx/helper';

import {
  precompileTemplate,
  setComponentTemplate,
  getOwner,
  templateOnlyComponent,
} from '@glimmer/core';

const formatDisplay = helper(([name], { greeting }) => {
  return `${greeting} ${name}`;
});


class SummaryComponent extends Component {
  	@service data;
	@service formatter;
	
	@tracked date; 
	@tracked display; 
	
	get agg_op() {
		return op.sum;
	}
		
	get value() {
		return agg(this.data.dataTable, this.agg_op(this.args.column));
	}
	
	get trend() {
	}
	
	get previous() {
	
	}
}

setComponentTemplate(
  precompileTemplate(
    `
      <div class="stat">
    	<div class="stat-title">{{@title}}</div>
    	<div class="stat-value">{{this.value}}</div>
    	<div class="stat-desc">21% more than last month</div>
  	</div>
    `,
    { strictMode: true, scope: { on, formatDisplay } }
  ),
  SummaryComponent
);

export default SummaryComponent;