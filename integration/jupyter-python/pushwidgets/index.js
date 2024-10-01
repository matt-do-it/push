
var bundledUrl = "https://posit-connect-p.de.bosch.com/content/dc0e6746-ac8e-42da-b224-eeaf1e3f2d2c/standalone.js";

if (location.hostname == "127.0.0.1" || location.hostname == "localhost") {
	bundledUrl = "http://localhost:8080/standalone.js"; 
}

const { embed, PushSummaryComponent, DataService } = await import(bundledUrl);

function render({ model, el }) {
    let dataService = new DataService()

    let value_serialized = model.get('value')

    dataService.fromArrow(value_serialized)
    dataService.groupColumns = model.get('groupColumns')
    dataService.rollup = model.get('rollup')

    let embedded = embed(PushSummaryComponent, dataService, {
        title: model.get('title'),
        benchmarkTitle: model.get('benchmarkTitle'),
    })

    el.appendChild(embedded)
}

export default { render }
