import Helper from '@ember/component/helper';
import { service } from '@ember/service';

export default class FormatNumberHelper extends Helper {
  @service formatter;

  compute([value, ...rest], hash) {
    return this.formatter.number(value);
  }
}
