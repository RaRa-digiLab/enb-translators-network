import json
import sys
import os

# Constants for size coefficients and alpha transparency
node_size_coefficient = 1.0
edge_size_coefficient = 0.5
node_alpha = 0.8
edge_alpha = 0.9  # Corrected from 'edge_alpa'

# Load color scheme from 'languages.json'
with open("../data/languages.json", "r", encoding="utf8") as f:
    language_data = json.load(f)
    language_codes = language_data["codes"]
    language_colors = language_data["colors"]
    # Add a specific color for 'tlk' (translator)
    language_colors["tlk"] = "rgb(129, 129, 236)"

def add_alpha_to_color(rgb_code: str, alpha: float) -> str:
    """
    Adds alpha transparency to an RGB color string.

    Parameters:
    - rgb_code: The RGB color string (e.g., 'rgb(255, 0, 0)').
    - alpha: The alpha value (between 0 and 1).

    Returns:
    - The RGBA color string with the specified alpha.
    """
    return rgb_code[:-1] + f", {alpha})"

def update_graphology_with_gephi_layout(graphology_data, gephi_data):
    """
    Updates the nodes in the Graphology JSON format with the x, y, size, and color attributes from the Gephi JSON format.

    Parameters:
    - graphology_data: The Graphology format JSON object.
    - gephi_data: The Gephi-generated JSON object.

    Returns:
    - Updated graphology_data with new x, y, size, and color values.
    """
    # Create a lookup dictionary for Gephi nodes
    gephi_node_lookup = {node["key"]: node["attributes"] for node in gephi_data["nodes"]}

    # Update Graphology nodes with Gephi layout information
    for node in graphology_data["nodes"]:
        node_key = node["key"]

        if node_key in gephi_node_lookup:
            gephi_attrs = gephi_node_lookup[node_key]

            # Update attributes
            node["attributes"]["x"] = gephi_attrs.get("x", 0.0)
            node["attributes"]["y"] = gephi_attrs.get("y", 0.0)
            node["attributes"]["size"] = gephi_attrs.get("size", 1.0)
            node["attributes"]["color"] = gephi_attrs.get("color", "#000000")

    return graphology_data

def update_nodes(graphology_data, size_coefficient):
    """
    Adjusts node sizes based on the provided coefficient.

    Parameters:
    - graphology_data: The Graphology format JSON object.
    - size_coefficient: The coefficient to adjust node sizes.

    Returns:
    - Updated graphology_data with adjusted node sizes.
    """
    for node in graphology_data["nodes"]:
        node["attributes"]["size"] *= size_coefficient

    return graphology_data

def update_edges(graphology_data, size_coefficient):
    """
    Adjusts edge sizes based on the provided coefficient.

    Parameters:
    - graphology_data: The Graphology format JSON object.
    - size_coefficient: The coefficient to adjust edge sizes.

    Returns:
    - Updated graphology_data with adjusted edge sizes.
    """
    for edge in graphology_data["edges"]:
        edge_size = edge["attributes"].get("size", 1.0)
        edge["attributes"]["size"] = edge_size * size_coefficient

    return graphology_data

def update_languages_and_colors(graphology_data, language_codes, language_colors):
    """
    Updates node and edge colors based on language data.

    Parameters:
    - graphology_data: The Graphology format JSON object.
    - language_codes: A dictionary mapping language codes to language names.
    - language_colors: A dictionary mapping language codes to colors.

    Returns:
    - Updated graphology_data.
    """
    # Update node colors
    for node in graphology_data["nodes"]:
        node_lang = node["attributes"].get("author_lang", "other")
        if node_lang == "tõlkija":
            node_lang = "tlk"
            node["attributes"]["author_lang"] = "tlk"
        elif node_lang not in language_codes:
            node_lang = "other"
            node["attributes"]["author_lang"] = "other"

        # Update node color
        color = language_colors.get(node_lang, language_colors["other"])
        node["attributes"]["color"] = add_alpha_to_color(color, node_alpha)

    # Update edge colors
    for edge in graphology_data["edges"]:
        edge_lang = edge["attributes"].get("language", "other")
        if edge_lang not in language_colors:
            edge_lang = "other"

        color = language_colors.get(edge_lang, language_colors["other"])
        edge["attributes"]["color"] = add_alpha_to_color(color, edge_alpha)

    return graphology_data

if __name__ == "__main__":

    key = sys.argv[1]

    # Load the Graphology JSON file
    with open(f"../data/{key}.json", "r", encoding="utf8") as f:
        graphology_data = json.load(f)

    # Load the Gephi JSON file
    gephi_file = f"../data/gephi/{key}.json"
    if not os.path.isfile(gephi_file):
        raise FileNotFoundError(f"The file {gephi_file} does not exist. Use the export to JSON command in Gephi to create it.")
    with open(gephi_file, "r", encoding="utf8") as f:
        gephi_data = json.load(f)

    # Update the Graphology JSON with the Gephi layout
    graphology_data = update_graphology_with_gephi_layout(graphology_data, gephi_data)

    # Adjust node and edge sizes
    graphology_data = update_nodes(graphology_data, node_size_coefficient)
    graphology_data = update_edges(graphology_data, edge_size_coefficient)

    # Update languages and colors
    graphology_data = update_languages_and_colors(
        graphology_data, language_codes, language_colors
    )

    # Save the updated Graphology JSON file
    with open(f"../data/{key}_updated.json", "w", encoding="utf8") as f:
        json.dump(graphology_data, f, ensure_ascii=False, indent=4)

    print(f"Graph file with updated data saved to {key}_updated.json.\nRename this file 'data.json' and copy it to the app/public folder.")