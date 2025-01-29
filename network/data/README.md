## Data

This folder holds data files.
- `data.json` (default name) - This is the main output of [`create_graph.py`](./network/data/data_updated.json) and is suitable for quantitative analysis.
- `data_updated.json` (default name) - This is the output of [`update_data.py`](./network/src/update_data.py), the final data file for use with Graphology in the application.
- `languages.json` - color and language mappings for the language ISO codes in the data (for English mappings, see [`index.ts`](`./app/src/index.ts`))