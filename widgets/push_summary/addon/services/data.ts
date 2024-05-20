import Service from '@ember/service';
import { all, desc, op, table } from 'arquero';

export default class DataService extends Service {
  dataTable = table({
    Seattle: [69, 108, 178, 207, 253, 268, 312, 281, 221, 142, 72, 52],
    Chicago: [135, 136, 187, 215, 281, 311, 318, 283, 226, 193, 113, 106],
    'San Francisco': [
      165, 182, 251, 281, 314, 330, 300, 272, 267, 243, 189, 156,
    ],
  });

  filter = '';

  get filteredTable() {
    return this.dataTable;
  }

  get groupNames() {
    return [];
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
