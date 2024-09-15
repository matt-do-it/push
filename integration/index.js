import {
        DataService,
        PushSummaryComponent,
        embed,
} from "http://localhost:8080/standalone.js"
 
let dataServiceTotal = new DataService(); 
      
dataServiceTotal.groupColumns = ["date"];
dataServiceTotal.rollup = { value: "op.sum(d.value)" };
          
function render({ model, el }) {
    dataServiceTotal.fromArrow(model.get("value").buffer);
    
    let totals = embed(PushSummaryComponent, dataServiceTotal, {
          title: "Zusammenfassung",
          benchmarkTitle: "Groups",
    });
    el.appendChild(totals);
}

export default { render };
