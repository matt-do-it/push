import anywidget
import traitlets
import pandas
import ipywidgets
import pyarrow as pa
import pathlib

bundled_assets_dir = pathlib.Path(__file__).parent

class PushSummaryWidget(anywidget.AnyWidget):
    _esm = bundled_assets_dir / "index.js"
    _css = bundled_assets_dir / "index.css"
    
    title = traitlets.Unicode("Zusammenfassung").tag(sync=True)
    benchmarkTitle = traitlets.Unicode("benchmarkTitle").tag(sync=True)

    value = ipywidgets.widgets.trait_types.CByteMemoryView().tag(sync=True)
    groupColumns = traitlets.List(['date']).tag(sync=True)
    rollup = traitlets.Dict({ "value": 'op.sum(d.value)' }).tag(sync=True)
