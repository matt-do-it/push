import pyarrow as pa

def serialize_table(table: pa.Table):
    sink = pa.BufferOutputStream()
    writer = pa.RecordBatchStreamWriter(sink, table.schema)
    writer.write_table(table)
    writer.close()
    return sink.getvalue().to_pybytes()
