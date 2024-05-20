import Service from '@ember/service';
import * as d3 from 'd3';

export default class FormatterService extends Service {
  numberFormat = d3.format('.1f');

  number(value) {
    return this.numberFormat(value);
  }
}

// Don't remove this declaration: this is what enables TypeScript to resolve
// this service using `Owner.lookup('service:data-service')`, as well
// as to check when you pass the service name as an argument to the decorator,
// like `@service('data-service') declare altName: DataServiceService;`.
declare module '@ember/service' {
  interface Registry {
    'data-service': DataServiceService;
  }
}
