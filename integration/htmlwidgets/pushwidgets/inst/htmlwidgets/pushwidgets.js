HTMLWidgets.widget({
  name: "pushwidgets",
  type: "output",
  
  factory: function(el, width, height) {
  	var inited = false; 
  	
	let dataService = new push.DataService();

   
    return {
      	renderValue: function(x) {
      		if (!inited) {
    			push.renderComponent(push.PushSummaryComponent, {
        			element: el,
        			args: x.componentArgs || {},
        			services: {
            			data: dataService,
            			dateCalc: new push.DateCalcService(),
        			}
    			});
    			inited = true; 
    		}
        
			   		 	
	  		let value_serialized = Uint8Array.from(atob(x.data), c => c.charCodeAt(0));;
    		dataService.fromArrow(value_serialized)
    	
			dataService.groupColumns = x.groupColumns
			dataService.rollup = x.rollup
      	},
      
      	resize: function(width, height) {
       
      	}
      
    };
  }
});
