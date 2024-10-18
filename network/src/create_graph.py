import pandas as pd
import json
import re
import networkx as nx
import itertools
from collections import Counter
import sys
from tqdm import tqdm

def extract_person_info(person_str, role=True):
    # Remove any titles enclosed in quotes
    person_str = re.sub(r': ".*?"', '', person_str)

    # Helper function to process individual dates
    def process_date(date_str):
        if not date_str:
            return None, False  # Return None and BC indicator as False
        date_str = date_str.strip()
        is_bc = False

        # Remove 'u. ' prefix indicating uncertainty
        date_str = re.sub(r'^u\. ?', '', date_str)

        # Check for 'e. Kr' (BC dates) and 'p. Kr' (AD dates)
        bc_match = re.search(r'e\. ?Kr\.?', date_str, re.IGNORECASE)
        ad_match = re.search(r'p\. ?Kr\.?', date_str, re.IGNORECASE)
        if bc_match:
            is_bc = True
        elif ad_match:
            is_bc = False  # Explicitly marked as AD

        # Remove 'e. Kr' or 'p. Kr' suffixes
        date_str = re.sub(r'(e\. ?Kr\.?|p\. ?Kr\.?)', '', date_str, flags=re.IGNORECASE).strip()

        # Convert date string to integer
        try:
            date_int = int(date_str)
            return date_int, is_bc
        except ValueError:
            return None, False  # Return None if the date is not a valid integer

    # Regular expression pattern to match the entire string
    # Matches: Name (birth_date - death_date) [role]
    pattern = r'^(.+?)\s*\((.*?)\)\s*(?:\[(.+?)\])?$'

    match = re.match(pattern, person_str)
    if match:
        name, date_range, role_str = match.groups()
        name = name.strip()
        role_str = role_str.strip().lower() if role_str and role else None

        # Split the date range into birth and death dates
        birth_date_str, _, death_date_str = date_range.partition('-')

        # Process birth and death dates
        birth_date, birth_is_bc = process_date(birth_date_str)
        death_date, death_is_bc = process_date(death_date_str)

        # If the death date is BC and the birth date is not explicitly AD, assume birth date is BC
        if death_is_bc and not birth_is_bc and birth_date is not None:
            birth_is_bc = True
            birth_date = -birth_date
        elif birth_is_bc and birth_date is not None:
            birth_date = -birth_date

        # If the death date is BC, make it negative
        if death_is_bc and death_date is not None:
            death_date = -death_date

        if role:
            return (name, birth_date, death_date, role_str)
        else:
            return (name, birth_date, death_date)

    # Handle cases with only the name and optional role
    # Matches: Name [role] or Name
    pattern_name_role = r'^(.+?)\s*(?:\[(.+?)\])?$'
    match = re.match(pattern_name_role, person_str)
    if match:
        name, role_str = match.groups()
        name = name.strip()
        role_str = role_str.strip().lower() if role_str and role else None

        if role:
            return (name, None, None, role_str)
        else:
            return (name, None, None)

    # Return None values if no pattern matched
    if role:
        return (None, None, None, None)
    else:
        return (None, None, None)
    

def create_graph(erb, min_year, max_year, id_to_int=False):
    """
    Create a graph from the 'erb' DataFrame filtered by publication year range.

    Parameters:
    - erb: pd.DataFrame containing publication data.
    - min_year: Minimum publication year.
    - max_year: Maximum publication year.

    Returns:
    - G: A NetworkX graph with nodes and edges representing authors and their collaborations.
    """

    # Helper function to process genres
    def process_genres(genre_str, to_remove=["ilukirjandus", "e-raamatud"]):
        if isinstance(genre_str, str):
            genres = genre_str.split("; ")
            genres = [genre.split(" [")[0].split(" (")[0] for genre in genres]
            if to_remove:
                genres = [genre for genre in genres if genre not in to_remove]
            return genres
        return [None]

    # Helper function to generate node identifiers
    def get_node_identifier(name, birth_date, death_date):
        if birth_date is not None and death_date is not None:
            return f"{name} ({birth_date}-{death_date})"
        elif birth_date is not None:
            return f"{name} ({birth_date}-)"
        elif death_date is not None:
            return f"{name} (-{death_date})"
        return name

    # Filter the DataFrame using query for better readability
    df = erb.query(
        'publication_date_cleaned >= @min_year and publication_date_cleaned <= @max_year and creator.notna() and contributor.notna()'
    )

    G = nx.Graph()
    
    for _, row in tqdm(df.iterrows()):
        # Extract and process person data from the dataframe row
        creators = [extract_person_info(name) for name in row['creator'].split('; ') if name.strip()]
        contributors = [extract_person_info(name) for name in row['contributor'].split('; ') if name.strip()]
        all_contributors = creators + contributors
        authors = [person for person in all_contributors if person[3] == "autor"]
        translators = [person for person in all_contributors if person[3] == "tõlkija"]
        
        if authors and translators:
            people = authors + translators
            # Get node identifiers for authors and translators
            author_names = [get_node_identifier(p[0], p[1], p[2]) for p in authors]
            translator_names = [get_node_identifier(p[0], p[1], p[2]) for p in translators]
            pairs = itertools.product(author_names, translator_names)
            current_year = row['publication_date_cleaned']  # The year of the current publication
            work_info = (row['title'], current_year)
            language = row["language_original"]
            genres = set(process_genres(row["genre_keyword"]))
            
            # Update edges between authors and translators
            for node_u, node_v in pairs:
                if G.has_edge(node_u, node_v):
                    edge = G.edges[node_u, node_v]
                    edge['weight'] += 1
                    edge['works'].append(work_info)
                    edge['languages'].append(language)
                    edge['genres'].update(genres)
                    edge['activity_end'] = max(edge['activity_end'], current_year)
                    edge['activity_start'] = min(edge['activity_start'], current_year)
                else:
                    G.add_edge(
                        node_u, node_v,
                        weight=1,
                        works=[work_info],
                        languages=[language],
                        genres=genres,
                        activity_start=current_year,
                        activity_end=current_year
                    )
                    
            # Process nodes (authors and translators)
            for person in people:
                name, birth_date, death_date, role = person if len(person) == 4 else (*person, None)
                node_id = get_node_identifier(name, birth_date, death_date)

                current_node = G.nodes.get(node_id, {})

                # Update node attributes once
                current_node.update({
                    "label": node_id,
                    #"label_short": name,
                    'date_of_birth': birth_date or 0,
                    'date_of_death': death_date or 0,
                })

                # Update role counts for "autor" and "tõlkija"
                if role == "autor":
                    current_node["autor_count"] = current_node.get("autor_count", 0) + 1
                elif role == "tõlkija":
                    current_node["tõlkija_count"] = current_node.get("tõlkija_count", 0) + 1

                # Update activity years
                current_node['activity_start'] = min(
                    current_node.get('activity_start', current_year), current_year
                )
                current_node['activity_end'] = max(
                    current_node.get('activity_end', current_year), current_year
                )

                G.add_node(node_id, **current_node)
                    
    # Remove self-loops (if any)
    G.remove_edges_from(nx.selfloop_edges(G))
    
    # Calculate and store the total_count and main_role for each node
    for node_id, attributes in G.nodes(data=True):
        # Calculate total role counts and determine the main role
        autor_count = attributes.get("autor_count", 0)
        tõlkija_count = attributes.get("tõlkija_count", 0)
        total_count = autor_count + tõlkija_count
        
        G.nodes[node_id]["total_count"] = total_count
        G.nodes[node_id]["main_role"] = "autor" if autor_count >= tõlkija_count else "tõlkija"
        
        # Set 'author_lang' based on the main role
        if G.nodes[node_id]["main_role"] == "autor":
            name = attributes.get('label_short', node_id)  # Use short label
            author_lang_series = df[df['creator'].str.contains(name, regex=False)]['language_original']
            author_lang = author_lang_series.mode()
            G.nodes[node_id]["author_lang"] = author_lang.iloc[0] if not author_lang.empty else "und"
        elif G.nodes[node_id]["main_role"] == "tõlkija":
            G.nodes[node_id]["author_lang"] = "tõlkija"
    
    # Update edge attributes
    for edge in G.edges:
        edge_data = G.edges[edge]
        language_counter = Counter(edge_data["languages"])
        edge_data["language"] = language_counter.most_common(1)[0][0]
        edge_data["genres"] = list(edge_data["genres"])  # Convert set to list for export
    
    # Optionally, replace node IDs with integers for better GEXF compatibility
    if id_to_int:
        G = nx.convert_node_labels_to_integers(G)

    print(f"Created graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges")
    return G


def nx_to_graphology(G):
    """
    Convert a NetworkX graph to a JSON format compatible with Graphology.js.

    Parameters:
    - G: NetworkX Graph object.

    Returns:
    - graph_data: A dictionary containing 'nodes' and 'edges' suitable for JSON serialization.
    """
    nodes = []
    edges = []

    # Process nodes
    for node_id, attrs in G.nodes(data=True):
        node = {
            'key': str(node_id),  # Ensure node_id is a string
            'attributes': attrs.copy()
        }
        node_attrs = node['attributes']

        # Add placeholder attributes if missing
        node_attrs.setdefault('x', 0.0)
        node_attrs.setdefault('y', 0.0)
        node_attrs.setdefault('size', 1.0)
        node_attrs.setdefault('color', '#000000')

        # Ensure all attribute values are JSON serializable
        for k, v in node_attrs.items():
            if isinstance(v, set):
                node_attrs[k] = list(v)
            elif isinstance(v, (tuple)):
                node_attrs[k] = list(v)
            elif isinstance(v, (nx.Graph, nx.DiGraph)):
                # Skip complex objects like graphs
                node_attrs[k] = None
            elif not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                # Convert numpy and other types to basic Python types
                node_attrs[k] = json.loads(json.dumps(v, default=str))

        nodes.append(node)

    # Process edges
    for i, (u, v, attrs) in enumerate(G.edges(data=True)):
        edge = {
            'source': str(u),
            'target': str(v),
            'key': str(i),  # Use index as key
            'attributes': attrs.copy()
        }
        edge_attrs = edge['attributes']

        # Add placeholder attributes if missing
        edge_attrs.setdefault('size', 1.0)
        edge_attrs.setdefault('color', '#000000')

        # Ensure 'works' is a parsable list
        if 'works' in edge_attrs:
            # Convert list of tuples to list of lists
            works_list = []
            for work in edge_attrs['works']:
                if isinstance(work, tuple):
                    works_list.append(list(work))
                else:
                    works_list.append(work)
            edge_attrs['works'] = works_list

        # Ensure all attribute values are JSON serializable
        for k, v in edge_attrs.items():
            if isinstance(v, set):
                edge_attrs[k] = list(v)
            elif isinstance(v, (tuple)):
                edge_attrs[k] = list(v)
            elif isinstance(v, (nx.Graph, nx.DiGraph)):
                # Skip complex objects like graphs
                edge_attrs[k] = None
            elif not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                # Convert numpy and other types to basic Python types
                edge_attrs[k] = json.loads(json.dumps(v, default=str))

        edges.append(edge)

    # Combine nodes and edges into graph data
    graph_data = {
        'nodes': nodes,
        'edges': edges
    }
    return graph_data


def simplify_graph_for_gexf(G):
    """
    Simplifies the NetworkX graph to make it GEXF-compatible by removing complex
    data types and keeping only necessary attributes for export to Gephi.

    Parameters:
    - G: NetworkX Graph object.

    Returns:
    - simplified_G: A simplified NetworkX Graph object ready for GEXF export.
    """
    # Create a copy of the graph to avoid mutating the original graph
    simplified_G = nx.Graph()

    # List of node attributes to keep
    node_attrs_to_keep = ['main_role', 'author_lang', 'total_count', 'label', 'label_short', 'activity_start', 'activity_end']

    # List of edge attributes to keep
    edge_attrs_to_keep = ['activity_start', 'activity_end', 'language']

    # Simplify nodes
    for node_id, attrs in G.nodes(data=True):
        simplified_node_attrs = {k: attrs[k] for k in node_attrs_to_keep if k in attrs}
        simplified_G.add_node(node_id, **simplified_node_attrs)

    # Simplify edges
    for u, v, attrs in G.edges(data=True):
        simplified_edge_attrs = {k: attrs[k] for k in edge_attrs_to_keep if k in attrs}
        simplified_G.add_edge(u, v, **simplified_edge_attrs)

    return simplified_G


if __name__ == "__main__":
    key = sys.argv[1]
    min_year = int(sys.argv[2])
    max_year = int(sys.argv[3])

    print("Loading data")
    erb_main = pd.read_parquet("../data/raw/erb_all_books.parquet")
    df = erb_main.query('is_fiction == True and language == "est" and language_original.notna()')

    print("Creating graph")
    G = create_graph(df, min_year, max_year, id_to_int=True)

    print("Converting to JSON")
    graph_data = nx_to_graphology(G)

    print("Writing JSON")
    with open(f"../data/{key}.json", "w", encoding="utf8") as f:
        json.dump(graph_data, f)

    print("Simplifying graph for Gephi")
    G_gephi = simplify_graph_for_gexf(G)
    nx.write_gexf(G_gephi, f"../data/gephi/{key}.gexf")

    print(f"Done! Check ../data/{key}.json and ../data/gephi/{key}.gexf")