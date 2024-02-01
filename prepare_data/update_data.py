import sys
import json

node_size_coefficient = 0.8
edge_size_coefficient = 1.2
node_alpha = 0.8
edge_alpa = 0.9

languages = {
    "eng": "inglise",
    "rus": "vene",
    "ger": "saksa",
    "fre": "prantsuse",
    "fin": "soome",
    "swe": "rootsi",
    "lav": "läti",
    "hun": "ungari",
    "pol": "poola",
    "spa": "hispaania",
    "cze": "tšehhi",
    "dan": "taani",
    "ita": "itaalia",
    "nor": "norra",
    "lit": "leedu",
    "rum": "rumeenia",
    "dut": "hollandi",
    "ukr": "ukraina",
    "bul": "bulgaaria",
    "geo": "gruusia",
    "gre": "kreeka",
    "bel": "belgia",
    "slo": "slovakkia",
    "arm": "armeenia",
    "lat": "ladina",
    "jpn": "jaapani",
    "ice": "islandi",
    "heb": "heebrea",
    "por": "portugali",
    "other": "muu",
}

# adding transparency to nodes or edges
def add_alpha_to_color(rgb_code: str, alpha):
    return rgb_code[:-1] + ", " + str(alpha) + ")"

# restructure nodes data for graphology.js
def update_nodes(data, size_coefficient):
    for node in data["nodes"]:
        node_key = node.pop("id")
        node["key"] = node_key

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

        for val in ["color", "size"]:
            edge["attributes"][val] = edge[val]
            del edge[val] 
        edge["attributes"]["size"] = edge["attributes"]["size"]*size_coefficient
    
    return data

# update languages and match them with colors
def update_languages_and_colors(data, language_colors):
    language_counts = dict(zip(languages.keys(), [0]*len(languages)))
    for node in data["nodes"]:
        node_lang = node["attributes"]["author_lang"]
        if node_lang == "tõlkija": # replace tõlkija -> tlk
             node["attributes"]["author_lang"] = "tlk"
        elif node_lang in languages.keys():
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
            if node_lang not in languages.keys():
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
def write_language_checkboxes(language_counts, all_langs):
    checkbox_values = [lang for lang, count in sorted(language_counts.items(), key=lambda item: item[1], reverse=True)]
    checkbox_values.remove("other")
    checkbox_values.append("other")

    with open("checkboxes.html", "w", encoding="utf8") as f:
        f.write('<div id="checkboxes">\n')
        for lang in checkbox_values:
            lang_share = round((language_counts[lang] / all_langs * 100), 2)
            f.write(
                f"""    <label>
        <input type="checkbox" id="category-{lang}" value="{lang}" checked />
            <span class="language-name"> {languages[lang]}</span>
            <span class="percentage">{lang_share} %</span>
    </label>
"""
                )
        f.write('</div>')


if __name__ == "__main__":

    filepath = sys.argv[1]

    with open(filepath, "r", encoding="utf8") as f:
        data = json.load(f)

    # load color scheme
    with open("language_rgb_codes.txt", "r", encoding="utf8") as f:
        colors = [line.strip() for line in f.readlines()]
        language_colors = dict(zip(languages.keys(), colors))
        language_colors["tlk"] = "rgb(129, 129, 236)"

    data = update_nodes(data, node_size_coefficient)
    data = update_edges(data, edge_size_coefficient)
    data, language_counts, all_langs = update_languages_and_colors(data, language_colors)

    with open("../app/data/data.json", "w", encoding="utf8") as f:
        data = json.dump(data, f)

    write_language_checkboxes(language_counts, all_langs)





# languages = {
#     "eng": "inglise",
#     "rus": "vene",
#     "ger": "saksa",
#     "fre": "prantsuse",
#     "fin": "soome",
#     "swe": "rootsi",
#     "lav": "läti",
#     "hun": "ungari",
#     "pol": "poola",
#     "spa": "hispaania",
#     "cze": "tšehhi",
#     "dan": "taani",
#     "ita": "itaalia",
#     "nor": "norra",
#     "lit": "leedu",
#     "rum": "rumeenia",
#     "dut": "hollandi",
#     "ukr": "ukraina",
#     "bul": "bulgaaria",
#     "geo": "gruusia",
#     "gre": "kreeka",
#     "bel": "belgia",
#     "slo": "slovakkia",
#     "arm": "armeenia",
#     "lat": "ladina",
#     "jpn": "jaapani",
#     "ice": "islandi",
#     "heb": "heebrea",
#     "por": "portugali",
#     "tur": "türgi",
#     "yid": "jidiš",
#     "slv": "sloveenia",
#     "aze": "azerbaidžaani",
#     "oss": "osseedi",
#     "srp": "serbia",
#     "per": "pärsia",
#     "peo": "vana-pärsia",
#     "san": "sanskriti",
#     "hin": "hindi",
#     "ara": "araabia",
#     "mul": "mitmekeelne",
#     "epo": "esperanto",
#     "uzb": "usbeki",
#     "other": "muu",
#     "und": "muu",
# }