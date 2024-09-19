import { DataService, PushSummaryComponent, embed } from "http://localhost:8080/standalone.js"

function render({ model, el }) {
    let dataService = new DataService()

    let value_serialized = model.get("value"); 
    
    dataService.fromArrow(value_serialized)
    dataService.groupColumns = model.get("groupColumns"); 
    dataService.rollup = model.get("rollup"); 

    let embedded = embed(PushSummaryComponent, dataService, {
        title: model.get("title"),
        benchmarkTitle: model.get("benchmarkTitle")
    });
    
    el.appendChild(embedded);
}

export default { render };
