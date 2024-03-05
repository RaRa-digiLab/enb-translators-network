## Eesti tõlkekirjanduse võrgustik

Valmis rakendus asub siin: https://data.digar.ee/tkirjandus/index.html

![alt](https://github.com/RaRa-digiLab/erb-translators-network/blob/main/demo.png)

Rakenduse andmestruktuuri loob kood kaustas network. Aluseks on töödeldud väljavõte Eesti Rahvusbibliograafia raamatute osast ([`erb_translators.tsv`](https://github.com/RaRa-digiLab/erb-translators-network/blob/main/network/data/raw/erb_translators.tsv)). Sellest konstrueeritakse võrgustik Pythoni mooduli NetworkX abil ([`create_graph.py`](https://github.com/RaRa-digiLab/erb-translators-network/blob/main/network/src/create_graph.py)) ja eksporditakse Gephi jaoks sobilikku formaati. Gephis saab hõlpsasti muuta paigutust jm parameetreid, misjärel seal eksporditud andmed kohandatakse siinsele rakendusele sobivaks ([`update_data.py`](https://github.com/RaRa-digiLab/erb-translators-network/blob/main/network/src/update_data.py)).

Rakendus jookseb Typescriptil ja kasutab Javascripti teeke `graphology` ja `sigma`. Paigaldusvalmis versioon asub kaustas [`build`](https://github.com/RaRa-digiLab/erb-translators-network/tree/main/app/build).
