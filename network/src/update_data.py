import sys
import json
from bs4 import BeautifulSoup

node_size_coefficient = 1.0
edge_size_coefficient = 0.5
node_alpha = 0.8
edge_alpa = 0.9

# load color scheme
with open("../data/languages.json", "r", encoding="utf8") as f:
    language_data = json.load(f)
    language_codes = language_data["codes"]
    language_colors = language_data["colors"]
    language_colors["tlk"] = "rgb(129, 129, 236)"

# adding transparency to nodes or edges
def add_alpha_to_color(rgb_code: str, alpha):
    return rgb_code[:-1] + ", " + str(alpha) + ")"

# restructure nodes data for graphology.js
def update_nodes(data, size_coefficient):
    for node in data["nodes"]:
        node_key = node.pop("id")
        node["key"] = node_key

        for val in ["activity_start", "activity_end"]:
            node["attributes"][val] = int(float(node["attributes"][val]))

        for val in ["x", "y", "color", "size", "label"]:
            node["attributes"][val] = node[val]
            del node[val]

        node["attributes"]["size"] = node["attributes"]["size"]*size_coefficient

    return data

# restructure edges data for graphology.js
def update_edges(data, size_coefficient):
    for edge in data["edges"]:
        edge_key = edge.pop("id")
        edge["key"] = edge_key

        for val in ["activity_start", "activity_end"]:
            edge["attributes"][val] = int(float(edge["attributes"][val]))

        for val in ["color", "size"]:
            edge["attributes"][val] = edge[val]
            del edge[val] 
        edge["attributes"]["size"] = edge["attributes"]["size"]*size_coefficient
    
    return data

# update languages and match them with colors
def update_languages_and_colors(data, language_colors):
    language_counts = dict(zip(language_codes.keys(), [0]*len(language_codes)))
    for node in data["nodes"]:
        node_lang = node["attributes"]["author_lang"]
        if node_lang == "tõlkija": # replace tõlkija -> tlk
             node["attributes"]["author_lang"] = "tlk"
        elif node_lang in language_codes.keys():
            language_counts[node_lang] += 1
        else:
            # if language is not in the languages dict, categorize it as other
            language_counts["other"] += 1

    # total count for calculating %
    all_langs = sum(language_counts.values())

    # match node colors with languages
    for node in data["nodes"]:
        node_lang = node["attributes"]["author_lang"]
        if node_lang != "tlk":
            if node_lang not in language_codes.keys():
                node["attributes"]["author_lang"] = "other"
        if node_lang in language_colors.keys():
            node["attributes"]["color"] = add_alpha_to_color(language_colors[node_lang], node_alpha)
        else:
            node["attributes"]["color"] = add_alpha_to_color(language_colors["other"], node_alpha)

    # match edge colors with languages
    for edge in data["edges"]:
        edge_lang = edge["attributes"]["language"]
        if edge_lang in language_colors.keys():
            edge["attributes"]["color"] = add_alpha_to_color(language_colors[edge_lang], edge_alpa)
        else:
            edge["attributes"]["color"] = add_alpha_to_color(language_colors["other"], edge_alpa)
    
    return data, language_counts, all_langs

# write html structure for language checkboxes
def write_language_checkboxes(language_counts, all_langs, language_colors):
    checkbox_values = [lang for lang, count in sorted(language_counts.items(), key=lambda item: item[1], reverse=True)]
    checkbox_values.remove("other")
    checkbox_values.append("other")

    html_string = '<div id="checkboxes">\n'

    for lang in checkbox_values:
        lang_share = format(round((language_counts[lang] / all_langs * 100), 2), ".2f")
        html_string += f"""    <label>
            <input type="checkbox" id="category-{lang}" value="{lang}" checked />
                <span class="language-name" style="color: {language_colors[lang]};"> {language_codes[lang]}</span>
                <span class="percentage">{lang_share} %</span>
    </label>
    """
        
    html_string += '</div>'
    return html_string


def replace_html_tag(file_path, tag_name, tag_attributes, new_content_string):
    with open(file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    tag_to_replace = soup.find(tag_name, tag_attributes)
    new_content = BeautifulSoup(new_content_string, 'html.parser')
    
    if tag_to_replace:
        tag_to_replace.replace_with(new_content)
    
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(soup.prettify())


if __name__ == "__main__":

    #filepath = sys.argv[1]
    filepath = "../data/gephi/data_from_gephi.json"

    with open(filepath, "r", encoding="utf8") as f:
        data = json.load(f)

    data = update_nodes(data, node_size_coefficient)
    data = update_edges(data, edge_size_coefficient)
    data, language_counts, all_langs = update_languages_and_colors(data, language_colors)

    with open("../../app/public/data.json", "w", encoding="utf8") as f:
        data = json.dump(data, f)

    checkboxes_html_string = write_language_checkboxes(language_counts, all_langs, language_colors)
    replace_html_tag("../../app/public/index.html", "div", {"id": "checkboxes"}, checkboxes_html_string)