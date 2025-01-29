## Source code

This folder includes Python scripts for creating the graph object and updating it with Gephi layout, as well as a notebook for analyses.

- `create_graph.py` - main script for creating the graph from bibliographical data. Outputs [`data.json`](./network/data/data.json) and [`data_for_gephi.gexf`](./network/data/gephi/data_for_gephi.gexf).
- `update_data.py` - combines the [`data.json`](./network/data/data.json) file with [layout data](./network/data/gephi/data.json) from Gephi.
- `analyses.ipynb` - notebook for quantitative analyses on the graph. Meant for the paper, but can easily be adjusted for other ends. Outputs diagrams into the `plots/` folder.