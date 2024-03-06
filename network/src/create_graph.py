import pandas as pd
import networkx as nx
import json
import re
import itertools
from collections import Counter


def tidy_translators(contributors):
    contributors = contributors.replace("; ", ";").split(";")
    translators = []
    for person in contributors:
        if extract_person_info(person)[2] == "tõlkija":
            translators.append(person)
    return translators


def extract_person_info(person_str):
    # Remove any titles enclosed in quotes
    person_str = re.sub(r': ".*?"', '', person_str)

    # Regular expression patterns
    pattern_with_role = r'^(.+?) \(([\d?]+)?-([\d?]+)?\) \[([\w\s]+)\]$'
    pattern_only_date = r'^(.+?) \(([\d?]+)?-([\d?]+)?\)$'
    pattern_only_role = r'^(.+?) \[([\w\s]+)\]$'
    pattern_name_only = r'^(.+?)$'

    # Extract name, birth dates, and role
    match = re.match(pattern_with_role, person_str)
    if match:
        name, birth_date, death_date, role = match.groups()
        birth_date = birth_date or "0000"
        death_date = death_date or "9999"
        return name.strip(), (birth_date, death_date), role.strip().lower()
    
    # Handle the case where the role is missing but date exists
    match = re.match(pattern_only_date, person_str)
    if match:
        name, birth_date, death_date = match.groups()
        birth_date = birth_date or "0000"
        death_date = death_date or "9999"
        return name.strip(), (birth_date, death_date), None
    
    # Handle the case where the date is missing but role exists
    match = re.match(pattern_only_role, person_str)
    if match:
        name, role = match.groups()
        return name.strip(), ("0000", "9999"), role.strip().lower()

    # Handle the case where only the name exists
    match = re.match(pattern_name_only, person_str)
    if match:
        name = match.group(1)
        return name.strip(), ("0000", "9999"), None

    # Return an error if no pattern matched
    print(f"Error: '{person_str}' doesn't match expected patterns.")
    return None


def create_translations_graph(erb, timerange, min_count=1, only_living=True, only_to_estonian=False, allowed_genres=None):
    """
    Create a graph based on the provided dataframe `erb` within a given `timerange`.
    Nodes represent authors, and edges represent co-authorship.
    """

    # Filter the dataframe based on timerange and existence of creator or contributor
    df = erb.loc[(erb.year >= timerange[0]) & (erb.year <= timerange[-1])]
    df = df.loc[(df.creator.notna()) & (df.translators.notna())]
    if only_to_estonian:
        df = df.loc[df.language_original != "est"]
    if allowed_genres:
        df = df.loc[df.subject_genre.notna()].copy()
        mask = df.subject_genre.str.replace("; ", ";").str.split(";").apply(lambda x: any(g in allowed_genres for g in x))
        df = df[mask]

    G = nx.Graph()

    for _, row in df.iterrows():
        # Extract and process person data from the dataframe row
        creators = [extract_person_info(name.strip()) for name in row['creator'].split(';') if name.strip() != '']
        translators = [extract_person_info(person) for person in row["translators"]]
        if len(translators) > 0:
            people = creators + translators
            pairs = list(itertools.product([p[0] for p in creators], [p[0] for p in translators]))
            #print(pairs)

            for pair in pairs:
                current_year = row['year']  # The year of the current publication
                
                if G.has_edge(pair[0], pair[1]):
                    G[pair[0]][pair[1]]['weight'] += 1
                    G[pair[0]][pair[1]]['works'].append((row['title'], current_year, current_year))
                    G[pair[0]][pair[1]]["languages"].append(row["language_original"])    # LANGUAGE
                    
                    # Update the activity_end for the edge
                    G[pair[0]][pair[1]]['activity_end'] = max(G[pair[0]][pair[1]].get('activity_end', current_year), current_year)
                    
                    # Ensure the activity_start is the smallest value
                    G[pair[0]][pair[1]]['activity_start'] = min(G[pair[0]][pair[1]].get('activity_start', current_year), current_year)
                    
                else:
                    G.add_edge(pair[0], pair[1], weight=1, activity_start=current_year, activity_end=current_year)
                    G[pair[0]][pair[1]]['works'] = [(row['title'], current_year, current_year)]
                    G[pair[0]][pair[1]]["languages"] = [row["language_original"]]

            # Process nodes (authors)
            for person in people:
                name, dates, role = person
                if G.has_node(name):
                    if role:
                        if role in roles.keys():
                            role_count_key = f"{roles[role]}_count"
                        else:
                            role_count_key = "muu_count"
                        G.nodes[name][role_count_key] = G.nodes[name].get(role_count_key, 0) + 1
                    G.nodes[name]['activity_end'] = max(G.nodes[name].get('activity_end', row['year']), row['year'])
                    G.nodes[name]['activity_start'] = min(G.nodes[name].get('activity_start', row['year']), row['year'])
                else:
                    node_attrs = {
                        'date_of_birth': int(dates[0]) if dates[0].isnumeric() else dates[0],
                        'date_of_death': int(dates[1]) if dates[1].isnumeric() else dates[1],
                        'activity_start': row['year'],
                        'activity_end': row['year']
                    }
                    if role:
                        node_attrs[f"{roles[role]}_count"] = 1
                    G.add_node(name, **node_attrs)

    # Remove self-loops (if any)
    G.remove_edges_from(list(nx.selfloop_edges(G)))

    # Calculate and store the total_count for each node, define the main role
    for name, attributes in G.nodes(data=True):
        node_roles = dict(zip(roles_compact, [attributes.get(f"{role}_count", 0) for role in roles_compact]))
        G.nodes[name]["total_count"] = sum(node_roles.values())
        G.nodes[name]["main_role"] = max(node_roles, key=node_roles.get)
        
        if G.nodes[name]["main_role"] == "autor":
            G.nodes[name]["author_lang"] = df.loc[df.creator.str.contains(name, regex=False)].language_original.mode().values[0]
        elif G.nodes[name]["main_role"] == "tõlkija":
            G.nodes[name]["author_lang"] = "tõlkija"
        else:
            G.nodes[name]["author_lang"] = "other"

        # Limit years active to period when the author was alive
        if only_living:
            if "date_of_death" in G.nodes[name] and type(G.nodes[name]["date_of_death"]) == int:
                G.nodes[name]["activity_end"] = min(G.nodes[name]["date_of_death"], G.nodes[name]["activity_end"])

    # Set the proportion of Estonian works in each edge
    for edge in G.edges:
        G.edges[edge]["language"] = Counter(G.edges[edge]["languages"]).most_common(1)[0][0]
        G.edges[edge].pop("languages")

    # Remove nodes below the specified min_count
    if min_count > 1:
        nodes_to_remove = [node for node, attributes in G.nodes(data=True) if attributes['total_count'] < min_count]
        G.remove_nodes_from(nodes_to_remove)

    print(f"Created graph with {len(G.nodes)} nodes and {len(G.edges)} edges")
    return G


if __name__ == "__main__":

    print("Loading data")

    with open("../data/roles.json", "r", encoding="utf8") as f:
        roles = json.load(f)
        roles_compact = list(set(roles.values()))

    with open("../data/genres.json", "r", encoding="utf8") as f:
        genres = json.load(f)
        fiction = genres["fiction"]

    erb = pd.read_csv("../data/raw/erb_translators.tsv", sep="\t", encoding="utf8")

    erb["translators"] = erb.contributor.apply(tidy_translators)

    print("Creating graph")
    G = create_translations_graph(erb, timerange=range(1800, 2025), min_count=1,
                              only_living=False, only_to_estonian=True, allowed_genres=fiction)
    
    print("Writing file")
    nx.write_gexf(G, "../data/gephi/translators_1800_2025_fiction.gexf")

    print("Finished")