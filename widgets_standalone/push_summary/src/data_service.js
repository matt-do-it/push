import { tracked } from '@glimmerx/component';
import { table, op } from 'arquero';

export default class DataService {
  @tracked dataTable;
  @tracked groupColumns; 
  
  @tracked filterColumns;
  @tracked filterParams;
  
  constructor() {
  	this.dataTable = table({ 
		date: ['2024-01-01', '2024-04-01', '2024-07-01'],
		impressions: [1, 2, 3]
	}); 
	
	this.groupColumns = ["date"];
  }

  get dataTable() {
    return this.dataTable;
  }
  
  get filteredTable() {
  	return this.dataTable;
  }
  
  get groupedTables() {
  	return this.dataTable;
  }
}
