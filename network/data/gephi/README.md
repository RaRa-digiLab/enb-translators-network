## Gephi data

This folder holds files that are associated with Gephi (used to adjust the layout of the network for the web app).

- `data.gexf` - a GEXF export from [`create_graph.py`](./network/src/create_graph.py) lands here. imported to Gephi and modified.
- `data.json` - the resulting graph as exported from Gephi (File -> Export -> Graph). Make sure to name this file according to your custom key ('data' by default)
- `network_layout.gephi` - a sample Gephi project that contains the layout and size and layout settings that are used in the app.