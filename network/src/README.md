## Source code

This folder includes Python scripts for creating the graph object and updating it with Gephi layout.

- `create_graph.py` - main script for creating the graph from bibliographical data. Outputs [`data.json`](../data/data.json) and [`data_for_gephi.gexf`](../data/gephi/data_for_gephi.gexf).
- `update_data.py` - combines the [`data.json`](../data/data.json) file with [layout data](../data/gephi/data.json) from Gephi.