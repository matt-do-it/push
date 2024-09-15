import anywidget
import traitlets
import pandas
import ipywidgets
import pyarrow as pa

class PushSummaryWidget(anywidget.AnyWidget):
    _esm = "index.js"
    _css = "index.css"

    value = ipywidgets.widgets.trait_types.CByteMemoryView().tag(sync=True)


def serialize_table(table: pa.Table):
    sink = pa.BufferOutputStream()
    writer = pa.RecordBatchStreamWriter(sink, table.schema)
    writer.write_table(table)
    writer.close()
    return sink.getvalue().to_pybytes()
