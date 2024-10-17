import json

# with open("app/public/data.json", "r", encoding="utf8") as f:
#     data = json.load(f)

# nodes = data["nodes"]
# edges = data["edges"]

# authors = [node for node in G.nodes() if G.nodes[node]["main_role"] == "autor"]
# translators = [node for node in G.nodes() if G.nodes[node]["main_role"] == "tõlkija"]

# total_works = 0
# for edge in edges:
#     works = edge["attributes"]["works"]
#     works_count = works.count("[")
#     total_works += works_count

# print(f"""Network has:
#       {len(nodes)} nodes, incl. {len(authors)} authors and {len(translators)} translators.
#       {len(edges)} edges with {total_works} works in total""")

import networkx as nx

G = nx.read_gexf("network/data/gephi/translators_1800_2025_fiction.gexf")
authors = [node for node in G.nodes() if G.nodes[node]["main_role"] == "autor"]
translators = [node for node in G.nodes() if G.nodes[node]["main_role"] == "tõlkija"]

# total_works = 0

def get_translator_language_counts(G):
    results = dict()
    for t in translators:
        languages = set()
        t_edges = G.edges(t)
        for edge in t_edges:
            languages.add(G.edges[edge]["language"])
        results[t] = languages
    results_sorted = sorted({translator: len(languages) for translator, languages in results.items()}.items(), key=lambda x: x[1], reverse=True)
    return results_sorted

translator_language_counts = get_translator_language_counts(G)

def get_translator_work_counts(G):
    results = dict()
    for t in translators:
        works = 0
        t_edges = G.edges(t)
        for edge in t_edges:
            works += len(G.edges[edge]["works"])
        results[t] = works
    results_sorted = sorted(results.items(), key=lambda x: x[1], reverse=True)
    return results_sorted

translator_work_counts = get_translator_work_counts(G)


density = nx.density(G)

LCC = G.subgraph(max(nx.connected_components(G), key=len))

