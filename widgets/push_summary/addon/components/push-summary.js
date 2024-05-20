import Component from '@glimmer/component';
import { service } from '@ember/service';
import { agg, all, desc, op, table } from 'arquero';

export default class PushSummaryComponent extends Component {
  @service data;

  get summaryValue() {
    return agg(this.data.dataTable, op.sum(this.args.column));
  }
}
