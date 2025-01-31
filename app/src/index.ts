import Sigma from "sigma";
import {
  Coordinates,
  EdgeDisplayData,
  NodeDisplayData,
} from "sigma/types";
import Graph from "graphology";
import { Attributes } from "graphology-types";

document.addEventListener("DOMContentLoaded", async () => {
  // Instantiate Graphology graph
  const graph = new Graph();

  // Retrieve DOM elements
  const container = document.getElementById("sigma-container") as HTMLElement;
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const searchSuggestions = document.getElementById(
    "suggestions"
  ) as HTMLDataListElement;

  // Hamburger menu toggle
  const menuButton = document.querySelector(".menu-button");
  menuButton?.addEventListener("click", () => {
    const panels = document.querySelectorAll(".small-panel");
    panels.forEach(panel => {
      panel.classList.toggle("is-visible");
    });
  });

  // "näita kirjeldust" toggle
  const descriptionToggle = document.getElementById("description-toggle");
  const descriptionContent = document.getElementById("description-content");
  descriptionToggle?.addEventListener("click", function () {
    if (!descriptionContent) return;

    // Toggle the descriptionContent's visibility
    if (descriptionContent.style.display === "none") {
      descriptionContent.style.display = "block";
    } else {
      descriptionContent.style.display = "none";
    }

    // Now set the correct text, but use currentLanguage plus hidden vs shown:
    if (descriptionContent.style.display === "none") {
      descriptionToggle.innerHTML = `<u>${translations[currentLanguage].showDescription}</u>`;
    } else {
      descriptionToggle.innerHTML = `<u>${translations[currentLanguage].hideDescription}</u>`;
    }
  });

  // Language and Genre checkboxes containers
  const languageCheckboxesContainer = document.getElementById(
    "checkboxes"
  ) as HTMLElement;
  const genreCheckboxesContainer = document.getElementById(
    "genre-checkboxes"
  ) as HTMLElement;

  // Time range input elements and buttons
  const minYearInput = document.getElementById("min-year") as HTMLInputElement;
  const maxYearInput = document.getElementById("max-year") as HTMLInputElement;
  const timerangeButton = document.getElementById(
    "timerange-button"
  ) as HTMLButtonElement;
  const timerangeResetButton = document.getElementById(
    "timerange-reset-button"
  ) as HTMLButtonElement;

  // "Select All" and "Deselect All" buttons
  const selectAllButton = document.getElementById("select-all") as HTMLButtonElement;
  const deselectAllButton = document.getElementById("deselect-all") as HTMLButtonElement;

  let currentLanguage: "est" | "eng" = "est";
  const languageSelect = document.getElementById("language-select") as HTMLSelectElement;

  // 1. Create a dictionary of UI strings in both languages
  const translations = {
    est: {
      showDescription: "näita kirjeldust",
      hideDescription: "peida kirjeldus",
      headingTitle: "Eesti tõlkekirjanduse võrgustik",
      periodLabel: "Periood:",
      timerangeApply: "vali",
      timerangeReset: "lähtesta",
      searchHeading: "Otsi isikut",
      searchPlaceholder: "Sisesta nimi...",
      filterHeading: "Filtreeri",
      tabLanguage: "Keele järgi",
      tabGenre: "Žanri järgi",
      selectAllLangs: "vali kõik",
      clearAllLangs: "tühjenda kõik",
      descriptionContent: `
      <p>
          See rakendus visualiseerib võrgustiku kujul eesti tõlkekirjandust 19. sajandi algusest tänapäevani.
          Võrgustik koosneb 9807 võõrkeelsest autorist ja 4027 tõlkijast, kes nende ilukirjanduslikku loomingut on eestindanud.
          Tõlkijaid ja autoreid ühendavad kaared kujutavad tõlgitud teoseid, värvid sümboliseerivad erinevaid keeli.
        </p>
        <p>Võrgustiku avastamiseks:</p>
        <ul>
          <li>Kliki ja lohista liikumiseks</li>
          <li>Keri hiirega suumimiseks</li>
          <li>Kliki isikul, et esile tuua tema seosed</li>
          <li>Mitme isiku valimiseks hoia all Ctrl ja kliki</li>
          <li>Kasuta otsingut konkreetse isiku leidmiseks</li>
          <li>Filtreeri ajavahemiku, keele ja žanri järgi</li>
        </ul>
        <p>
          Rakendus põhineb <a href="https://doi.org/10.5281/zenodo.14708287">Eesti Rahvusbibliograafia</a><br>andmetel,
          lähtekood on leitav <a href="https://github.com/RaRa-digiLab/erb-translators-network/tree/main">GitHubis</a>.
        </p>
        <p><i>Krister Kruusmaa, <a href="https://digilab.rara.ee/">RaRa digilabor</a> 2024</i></p>
        <p></p>
      `
    },
    eng: {
      showDescription: "show description",
      hideDescription: "hide description",
      headingTitle: "Network of Translated<br> Estonian Literature",
      periodLabel: "Time range:",
      timerangeApply: "apply",
      timerangeReset: "reset",
      searchHeading: "Search",
      searchPlaceholder: "Enter a name...",
      filterHeading: "Filter",
      tabLanguage: "Languages",
      tabGenre: "Genres",
      selectAllLangs: "select all",
      clearAllLangs: "clear all",
      descriptionContent: `
      <p>
        This application visualizes Estonian translated literature in the form of a network, spanning from the early 19th century to the present day.
        The network consists of 9,807 foreign authors and 4,027 translators who have translated their literary works into Estonian.
        The connections between translators and authors represent translated works, while the colors symbolize different languages.
      </p>
      <p>Explore the network:</p>
      <ul>
        <li>Click and drag to move</li>
        <li>Scroll to zoom</li>
        <li>Click on a person to highlight connections</li>
        <li>Hold Ctrl and click to select multiple people</li>
        <li>Use search to find a specific person</li>
        <li>Filter by time period, language, and genre</li>
      </ul>
      <p>The app is based on data from<a href="https://doi.org/10.5281/zenodo.14708287">The Estonian National Bibliography</a>,
        source code can be found on <a href="https://github.com/RaRa-digiLab/erb-translators-network/tree/main">GitHub</a>.
      </p>
      <p><i>Krister Kruusmaa, <a href="https://digilab.rara.ee/en">RaRa Digilab</a> 2024</i></p>
      <p></p>
      `
    },
  };

  // Application state interface
  interface State {
    hoveredNode?: string;
    searchQuery: string;
    selectedNode?: string;
    selectedNeighbors?: Set<string>;
    multiSelectedNodes: Set<string>;
    multiSelectedNeighbors?: Set<string>;
    suggestions?: Set<string>;
    selectedLanguages: Set<string>;
    selectedGenres: Set<string>;
    minYear: number;
    maxYear: number;
    languageCheckboxes?: NodeListOf<HTMLInputElement>;
    genreCheckboxes?: NodeListOf<HTMLInputElement>;
  }

  // Initialize minYear and maxYear from inputs
  const initialMinYear = parseInt(minYearInput.value) || 1800;
  const initialMaxYear = parseInt(maxYearInput.value) || 2024;

  // Initialize state
  const state: State = {
    searchQuery: "",
    selectedLanguages: new Set<string>(),
    selectedGenres: new Set<string>(),
    minYear: initialMinYear,
    maxYear: initialMaxYear,
    multiSelectedNodes: new Set<string>(),
    multiSelectedNeighbors: new Set<string>(),
  };

  // Language colors mapping
  const languageColors: { [code: string]: string } = {
    "eng": "rgb(0, 221, 235)",
    "rus": "rgb(255, 111, 36)",
    "ger": "rgb(255, 130, 255)",
    "fre": "rgb(54, 224, 0)",
    "fin": "rgb(223, 170, 0)",
    "swe": "rgb(152, 204, 243)",
    "spa": "rgb(255, 163, 139)",
    "ita": "rgb(139, 216, 144)",
    "pol": "rgb(255, 91, 190)",
    "lav": "rgb(167, 165, 255)",
    "nor": "rgb(95, 80, 137)",
    "hun": "rgb(255, 172, 226)",
    "dan": "rgb(0, 211, 151)",
    "cze": "rgb(66, 117, 5)",
    "lit": "rgb(168, 50, 83)",
    "dut": "rgb(0, 109, 76)",
    "jpn": "rgb(255, 81, 114)",
    "rum": "rgb(125, 83, 0)",
    "ukr": "rgb(185, 171, 153)",
    "gre": "rgb(0, 184, 255)",
    "ice": "rgb(235, 190, 95)",
    "heb": "rgb(0, 86, 111)",
    "por": "rgb(0, 229, 255)",
    "bul": "rgb(161, 195, 0)",
    "bel": "rgb(216, 76, 32)",
    "lat": "rgb(255, 146, 0)",
    "geo": "rgb(0, 209, 69)",
    "slo": "rgb(203, 83, 192)",
    "udm": "rgb(0, 186, 205)",
    "tur": "rgb(178, 47, 33)",
    "arm": "rgb(230, 17, 3)",
    "chi": "rgb(27, 177, 255)",
    "ara": "rgb(118, 255, 118)",
    "cat": "rgb(156, 0, 206)",
    "slv": "rgb(0, 57, 243)",
    "kom": "rgb(255, 193, 148)",
    "hin": "rgb(101, 185, 207)",
    "yid": "rgb(202, 119, 197)",
    "san": "rgb(83, 255, 151)",
    "grc": "rgb(250, 253, 154)",
    "per": "rgb(119, 133, 81)",
    "srp": "rgb(162, 233, 187)",
    "fiu": "rgb(181, 4, 54)",
    "chm": "rgb(60, 0, 133)",
    "kor": "rgb(74, 190, 158)",
    "epo": "rgb(129, 0, 39)",
    "hrv": "rgb(95, 219, 196)",
    "aze": "rgb(15, 54, 131)",
    "mac": "rgb(167, 182, 202)",
    "tgk": "rgb(255, 70, 0)",
    "smi": "rgb(90, 127, 207)",
    "pro": "rgb(125, 38, 13)",
    "uzb": "rgb(206, 21, 0)",
    "peo": "rgb(54, 23, 198)",
    "kaz": "rgb(25, 144, 182)",
    "oss": "rgb(28, 125, 255)",
    "tat": "rgb(184, 0, 123)",
    "krl": "rgb(57, 189, 69)",
    "other": "rgb(150, 150, 150)",
  };

  // Language codes mapping to display names
  const languageCodesEst: { [code: string]: string } = {
    "eng": "inglise",
    "rus": "vene",
    "ger": "saksa",
    "fre": "prantsuse",
    "fin": "soome",
    "swe": "rootsi",
    "spa": "hispaania",
    "ita": "itaalia",
    "pol": "poola",
    "lav": "läti",
    "nor": "norra",
    "hun": "ungari",
    "dan": "taani",
    "cze": "tšehhi",
    "lit": "leedu",
    "dut": "hollandi",
    "jpn": "jaapani",
    "rum": "rumeenia",
    "ukr": "ukraina",
    "gre": "kreeka",
    "ice": "islandi",
    "heb": "heebrea",
    "por": "portugali",
    "bul": "bulgaaria",
    "bel": "belgia",
    "lat": "ladina",
    "geo": "gruusia",
    "slo": "slovakkia",
    "udm": "udmurdi",
    "tur": "türgi",
    "arm": "armeenia",
    "chi": "hiina",
    "ara": "araabia",
    "cat": "katalaani",
    "slv": "sloveeni",
    "kom": "komi",
    "hin": "hindi",
    "yid": "jidiš",
    "san": "sanskriti",
    "grc": "vanakreeka",
    "per": "pärsia",
    "srp": "serbia",
    "fiu": "soomeugri (muu)",
    "chm": "mari",
    "kor": "korea",
    "epo": "esperanto",
    "hrv": "horvaadi",
    "aze": "aserbaidžaani",
    "mac": "makedoonia",
    "tgk": "tadžiki",
    "smi": "saami",
    "pro": "provansaali",
    "uzb": "usbeki",
    "peo": "vanapärsia",
    "kaz": "kasahhi",
    "oss": "osseedi",
    "tat": "tatari",
    "krl": "karjala",
    "other": "muu/puuduv",
  };

  const languageCodesEng: { [code: string]: string } = {
    "eng": "English",
    "rus": "Russian",
    "ger": "German",
    "fre": "French",
    "fin": "Finnish",
    "swe": "Swedish",
    "spa": "Spanish",
    "ita": "Italian",
    "pol": "Polish",
    "lav": "Latvian",
    "nor": "Norwegian",
    "hun": "Hungarian",
    "dan": "Danish",
    "cze": "Czech",
    "lit": "Lithuanian",
    "dut": "Dutch",
    "jpn": "Japanese",
    "rum": "Romanian",
    "ukr": "Ukrainian",
    "gre": "Greek",
    "ice": "Icelandic",
    "heb": "Hebrew",
    "por": "Portuguese",
    "bul": "Bulgarian",
    "bel": "Belarusian",
    "lat": "Latin",
    "geo": "Georgian",
    "slo": "Slovak",
    "udm": "Udmurt",
    "tur": "Turkish",
    "arm": "Armenian",
    "chi": "Chinese",
    "ara": "Arabic",
    "cat": "Catalan",
    "slv": "Slovenian",
    "kom": "Komi",
    "hin": "Hindi",
    "yid": "Yiddish",
    "san": "Sanskrit",
    "grc": "Ancient Greek",
    "per": "Persian",
    "srp": "Serbian",
    "fiu": "Finno-Ugric (other)",
    "chm": "Mari",
    "kor": "Korean",
    "epo": "Esperanto",
    "hrv": "Croatian",
    "aze": "Azerbaijani",
    "mac": "Macedonian",
    "tgk": "Tajik",
    "smi": "Sami",
    "pro": "Provençal",
    "uzb": "Uzbek",
    "peo": "Old Persian",
    "kaz": "Kazakh",
    "oss": "Ossetian",
    "tat": "Tatar",
    "krl": "Karelian",
    "other": "Other / Missing",
  };

  // English mapping object for known genres.
  // Everything else falls back to the original Estonian label (italicized).
  const genreLabelsEng: { [genre: string]: string } = {
    "romaanid": "Novels",
    "lastekirjandus": "Children's Literature",
    "jutustused": "Narratives",
    "armastusromaanid": "Romance Novels",
    "põnevusromaanid": "Thriller Novels",
    "kriminaalromaanid": "Crime Novels",
    "jutud": "Stories",
    "noorsookirjandus": "Young Adult Literature",
    "luuletused": "Poems",
    "ajaloolised romaanid": "Historical Novels",
    "näidendid": "Plays",
    "novellid": "Short Stories",
    "pildiraamatud": "Picture Books",
    "muinasjutud": "Fairy Tales",
    "fantaasiaromaanid": "Fantasy Novels",
    "ulmeromaanid": "Science Fiction Novels",
    "biograafilised romaanid": "Biographical Novels",
    "komöödiad": "Comedies",
    "mugandused": "Adaptations",
    "rööptekstid": "Parallel Texts",
    "loomajutud": "Animal Stories",
    "mälestused": "Memoirs",
    "suurtähtraamatud": "Large Print Books",
    "psühholoogilised romaanid": "Psychological Novels",
    "seiklusromaanid": "Adventure Novels",
    "sõjaromaanid": "War Novels",
    "lühiromaanid": "Short Novels",
    "perekonnaromaanid": "Family Novels",
    "huumor": "Humor",
    "dokumentaalkirjandus": "Documentary Literature",
    "vigurraamatud": "Trick Books",
    "biograafiad": "Biographies",
    "poeemid": "Poems (Epics)",
    "õudusromaanid": "Horror Novels",
    "ulmejutud": "Science Fiction Stories",
    "autobiograafilised romaanid": "Autobiographical Novels",
    "vaimulik ilukirjandus": "Religious Fiction",
    "esseed": "Essays",
    "autobiograafiad": "Autobiographies",
    "satiirilised romaanid": "Satirical Novels",
    "spiooniromaanid": "Spy Novels",
    "reisikirjad": "Travel Writings",
    "antoloogiad": "Anthologies",
    "õudusjutud": "Horror Stories",
    "värssjutud": "Verse Stories",
    "päevikud": "Diaries",
    "kriminaaljutud": "Crime Stories",
    "tõlked": "Translations",
    "päevikromaanid": "Diary Novels",
    "tragöödiad": "Tragedies",
    "unejutud": "Bedtime Stories",
    "aforismid": "Aphorisms",
    "värssdraamad": "Verse Dramas",
    "koomiksid": "Comics",
    "olukirjeldused": "Situational Descriptions",
    "legendid": "Legends",
    "tsitaadid": "Quotations",
    "kommentaarid": "Commentaries",
    "kogutud teosed": "Collected Works",
    "graafilised romaanid": "Graphic Novels",
    "poliitilised romaanid": "Political Novels",
    "toiduretseptid": "Recipes",
    "mereromaanid": "Maritime Novels",
    "haikud": "Haikus",
    "koolijutud": "School Stories",
    "düstoopiad": "Dystopias",
    "valmid": "Fables",
    "satiir": "Satire",
    "aimekirjandus": "Popular Science Literature",
    "miniatuurid": "Miniatures",
    "lood": "Tales",
    "libretod": "Librettos",
    "lühinäidendid": "Short Plays",
    "kiriromaanid": "Epistolary Novels",
    "katkendid": "Excerpts",
    "loomamuinasjutud": "Animal Fairy Tales",
    "illustratsioonid": "Illustrations",
    "proosaluuletused": "Prose Poems",
    "filmistsenaariumid": "Screenplays",
    "autobiograafilised jutustused": "Autobiographical Narratives",
    "följetonid": "Feuilletons",
    "kirjad": "Letters",
    "armastusluule": "Love Poetry",
    "eeposed": "Epics",
    "paroodiad": "Parodies",
    "ballaadid": "Ballads",
    "nõuanded": "Advice",
    "haiglaromaanid": "Hospital Novels",
    "pusled": "Puzzles",
    "autograafid": "Autographs",
    "nuputamisülesanded": "Brain Teasers",
    "müüdid": "Myths",
    "ajaloolised näidendid": "Historical Plays",
    "humoreskid": "Humorous Sketches",
    "anekdoodid": "Anecdotes",
    "lastenäidendid": "Children's Plays",
    "valitud teosed": "Selected Works",
    "üliõpilastööd": "Student Papers",
    "arenguromaanid": "Bildungsromans (Coming-of-Age Novels)",
    "muistendid": "Folktales",
    "käsiraamatud": "Handbooks",
    "kõned": "Speeches",
    "dialoogid": "Dialogues",
    "laulumängud": "Singing Games",
    "loodusjutud": "Nature Stories",
    "laastud": "Sketches",
    "laulutekstid": "Song Lyrics",
    "diplomitööd": "Theses",
    "värvimisraamatud": "Coloring Books",
    "rüütliromaanid": "Chivalric Novels",
    "õppematerjalid": "Study Materials",
    "publitsistika": "Journalistic Literature",
    "fantaasiakirjandus": "Fantasy Literature",
    "harduskirjandus": "Devotional Literature",
    "sketšid": "Sketches",
    "mõtisklused": "Reflections",
    "intervjuud": "Interviews",
    "operetid": "Operettas",
    "mõistujutud": "Allegories",
    "muu": "Other",
    "teadmata žanr": "Unknown Genre",
  }


  // Function to load graph data and initialize UI components
  async function loadGraphDataAndInitialize() {
    try {
      const response = await fetch("data.json");
      if (!response.ok) {
        throw new Error(`Failed to load data.json: ${response.statusText}`);
      }
      const graphData = await response.json();
      graph.import(graphData);

      // Populate search suggestions
      populateSearchSuggestions();

      // Generate checkboxes
      generateLanguageCheckboxes();
      generateGenreCheckboxes();
    } catch (error) {
      console.error("Error loading graph data:", error);
    }
  }

  function setLanguage(lang: "est" | "eng") {
    currentLanguage = lang;
    // Update the title
    const mainTitle = document.querySelector("#title-container h2");
    if (mainTitle) {
      mainTitle.innerHTML = translations[lang].headingTitle;
    }

    // Update the description toggle text based on visibility
    if (descriptionToggle && descriptionContent) {
      if (descriptionContent.style.display === "none") {
        descriptionToggle.innerHTML = `<u>${translations[lang].showDescription}</u>`;
      } else {
        descriptionToggle.innerHTML = `<u>${translations[lang].hideDescription}</u>`;
      }
    }

    // Update the description contents
    if (descriptionContent) {
      descriptionContent.innerHTML = translations[lang].descriptionContent;
    }

    // Update the period label
    const sliderContainer = document.getElementById("slider-container");
    if (sliderContainer) {
      const labelSpan = sliderContainer.querySelector("span");
      if (labelSpan) {
        labelSpan.textContent = translations[lang].periodLabel;
      }
    }

    // Update the timerange buttons
    if (timerangeButton) {
      timerangeButton.textContent = translations[lang].timerangeApply;
    }
    if (timerangeResetButton) {
      timerangeResetButton.textContent = translations[lang].timerangeReset;
    }

    // Update the search panel heading
    const searchHeading = document.querySelector("#search-box h3");
    if (searchHeading) {
      searchHeading.textContent = translations[lang].searchHeading;
    }

    // Update the search input placeholder
    if (searchInput) {
      searchInput.placeholder = translations[lang].searchPlaceholder;
    }

    // Update the filter panel heading
    const filterHeading = document.querySelector("#filter-panel h3");
    if (filterHeading) {
      filterHeading.textContent = translations[lang].filterHeading;
    }

    // Update tab labels (language and genre)
    const langTabButton = document.querySelector('.tablinks[data-tab="language-tab"]') as HTMLButtonElement;
    if (langTabButton) {
      langTabButton.textContent = translations[lang].tabLanguage;
    }
    const genreTabButton = document.querySelector('.tablinks[data-tab="genre-tab"]') as HTMLButtonElement;
    if (genreTabButton) {
      genreTabButton.textContent = translations[lang].tabGenre;
    }

    // Update "Select All" / "Clear All" buttons for languages
    if (selectAllButton) {
      selectAllButton.textContent = translations[lang].selectAllLangs;
    }
    if (deselectAllButton) {
      deselectAllButton.textContent = translations[lang].clearAllLangs;
    }

    // Update "Select All" / "Clear All" buttons for genres
    const selectAllGenresButton = document.getElementById("select-all-genres") as HTMLButtonElement;
    const deselectAllGenresButton = document.getElementById("deselect-all-genres") as HTMLButtonElement;
    if (selectAllGenresButton) {
      selectAllGenresButton.textContent = translations[lang].selectAllLangs;
    }
    if (deselectAllGenresButton) {
      deselectAllGenresButton.textContent = translations[lang].clearAllLangs;
    }

    // Update description toggle
    if (descriptionToggle && descriptionContent) {
      if (descriptionContent.style.display === "none") {
        descriptionToggle.innerHTML = `<u>${translations[currentLanguage].showDescription}</u>`;
      } else {
        descriptionToggle.innerHTML = `<u>${translations[currentLanguage].hideDescription}</u>`;
      }
    }

    // update the existing language checkbox labels:
    updateLanguageCheckboxLabels();

    // update the existing genre checkbox labels:
    updateGenreCheckboxLabels();
  }

  // Attach an event listener
  languageSelect?.addEventListener("change", () => {
    const choice = languageSelect.value as "est" | "eng"; // "est" or "eng"
    setLanguage(choice);
  });

  // Function to populate search suggestions
  function populateSearchSuggestions() {
    const options = graph.nodes().map((node) => {
      const label = graph.getNodeAttribute(node, "label") as string;
      return `<option value="${label}"></option>`;
    });
    searchSuggestions.innerHTML = options.join("\n");
  }

  // Generate Language Checkboxes
  function generateLanguageCheckboxes() {
    const languageCounts: { [code: string]: number } = {};
    let totalLanguages = 0;

    graph.forEachEdge((edge, attributes) => {
      const langs = attributes.languages as string[] | undefined;
      if (langs && langs.length) {
        langs.forEach((lang) => {
          const mapped = languageCodesEst.hasOwnProperty(lang) ? lang : "other";
          languageCounts[mapped] = (languageCounts[mapped] || 0) + 1;
          totalLanguages++;
        });
      } else {
        languageCounts["other"] = (languageCounts["other"] || 0) + 1;
        totalLanguages++;
      }
    });

    // Sort languages
    const sortedLanguages = Object.entries(languageCounts).sort((a, b) => {
      if (a[0] === "other") return 1;
      if (b[0] === "other") return -1;
      return b[1] - a[1];
    });

    // Build the checkboxes (Estonian labels by default)
    let htmlString = "";
    sortedLanguages.forEach(([code, count]) => {
      const langPercentage = totalLanguages ? (count / totalLanguages) * 100 : 0;
      const langNameEst = languageCodesEst[code] || languageCodesEst["other"];
      const color = languageColors[code] || languageColors["other"];

      htmlString += `
        <label>
          <input type="checkbox" value="${code}" checked />
          <span class="item-name" style="color: ${color};">${langNameEst}</span>
          <span class="percentage">${langPercentage.toFixed(2)}%</span>
        </label>
      `;
    });

    // Insert into container
    languageCheckboxesContainer.innerHTML = htmlString;

    // Attach to state
    const languageCheckboxes = languageCheckboxesContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    state.languageCheckboxes = languageCheckboxes;

    // Initialize the selectedLanguages set
    languageCheckboxes.forEach((cb) => {
      if (cb.checked) state.selectedLanguages.add(cb.value);
      cb.addEventListener("change", handleLanguageCheckboxChange);
    });
  }

  function updateLanguageCheckboxLabels() {
    const currentLangMap =
      currentLanguage === "eng" ? languageCodesEng : languageCodesEst;

    // Go through all existing checkboxes
    const checkboxes = languageCheckboxesContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );

    checkboxes.forEach((cb) => {
      // The language code (like "eng", "rus", etc.) is in cb.value
      const code = cb.value;

      // The next sibling .item-name is the text span
      const labelSpan = cb.parentElement?.querySelector(".item-name") as HTMLElement;
      if (labelSpan) {
        labelSpan.textContent = currentLangMap[code] || currentLangMap["other"];
      }
    });
  }

  function generateGenreCheckboxes() {
    const genreCounts: { [genre: string]: number } = {};
    let totalGenres = 0;

    graph.forEachEdge((edge, attributes) => {
      const genres = attributes.genres as string[] | undefined;
      if (genres && genres.length) {
        genres.forEach((g) => {
          // If null/undefined/empty or "null", rename to "teadmata žanr"
          if (!g || g.toLowerCase() === "null") {
            g = "teadmata žanr";
          }
          genreCounts[g] = (genreCounts[g] || 0) + 1;
          totalGenres++;
        });
      } else {
        // No genres array => lump into "teadmata žanr"
        const key = "teadmata žanr";
        genreCounts[key] = (genreCounts[key] || 0) + 1;
        totalGenres++;
      }
    });

    // Sort genres by descending frequency
    const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);

    // Lump anything below 0.15% into "muu"
    const threshold = 0.15; // 0.2%
    let leftoverCount = 0;
    const finalGenres: [string, number][] = [];

    sortedGenres.forEach(([genre, count]) => {
      const percentage = (count / totalGenres) * 100;
      if (percentage < threshold) {
        leftoverCount += count;
      } else {
        finalGenres.push([genre, count]);
      }
    });

    // Add a single "muu" if leftoverCount > 0
    if (leftoverCount > 0) {
      finalGenres.push(["muu", leftoverCount]);
    }

    // Build the HTML for each final genre
    let htmlString = "";
    finalGenres.forEach(([genre, count]) => {
      const percent = (count / totalGenres) * 100;
      // Display the raw genre text for now (or a default language)
      // You can store it in data attributes for dynamic on-the-fly translations
      htmlString += `
        <label>
          <input type="checkbox" value="${genre}" checked />
          <span class="item-name">${genre}</span>
          <span class="percentage">${percent.toFixed(2)}%</span>
        </label>
      `;
    });

    // Insert into container
    genreCheckboxesContainer.innerHTML = htmlString;

    // Attach to state and set up event listeners
    const genreCheckboxes = genreCheckboxesContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    state.genreCheckboxes = genreCheckboxes;

    genreCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        state.selectedGenres.add(checkbox.value);
      }
      checkbox.addEventListener("change", handleGenreCheckboxChange);
    });
  }

  function updateGenreCheckboxLabels() {
    // Only run if the checkboxes are present
    if (!state.genreCheckboxes) return;

    // Decide which dictionary to use
    const useEnglish = (currentLanguage === "eng");

    // Loop through existing checkboxes
    state.genreCheckboxes.forEach((cb) => {
      // The "value" is something like "luule", "muu", or "other"
      const genreCode = cb.value;
      // The Estonian label is stored in data-est-label (the original text from generation)
      const estLabel = cb.getAttribute("data-est-label") || genreCode;

      // Find the text span
      const labelSpan = cb.parentElement?.querySelector(".item-name") as HTMLElement;
      if (!labelSpan) return;

      if (useEnglish) {
        // If we have an English translation, use it
        if (genreLabelsEng[genreCode]) {
          labelSpan.textContent = genreLabelsEng[genreCode];
        } else {
          // fallback: italicize the Estonian label
          labelSpan.innerHTML = `<i>${estLabel}</i>`;
        }
      } else {
        // Switch back to Estonian label
        labelSpan.textContent = estLabel;
      }
    });
  }

  // Handle Language Checkbox Changes
  function handleLanguageCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const language = checkbox.value;

    if (checkbox.checked) {
      state.selectedLanguages.add(language);
    } else {
      state.selectedLanguages.delete(language);
    }

    // Recompute selectedNeighbors if a node is selected
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // Recompute selections so out-of-range nodes are dropped
    recomputeSelections();
    renderer.refresh();
  }

  // Handle Genre Checkbox Changes
  function handleGenreCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const genre = checkbox.value;

    if (checkbox.checked) {
      state.selectedGenres.add(genre);
    } else {
      state.selectedGenres.delete(genre);
    }

    // Recompute selectedNeighbors if a node is selected
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // Recompute selections so out-of-range nodes are dropped
    recomputeSelections();
    renderer.refresh();
  }

  // Handle "Select All" / "Deselect All" for Languages
  function handleSelectAllDeselectAllLanguages(selectAll: boolean) {
    const languageCheckboxes = state.languageCheckboxes!;
    languageCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAll;
      if (selectAll) {
        state.selectedLanguages.add(checkbox.value);
      } else {
        state.selectedLanguages.delete(checkbox.value);
      }
    });

    // Recompute selectedNeighbors if a node is selected
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // Recompute selections so out-of-range nodes are dropped
    recomputeSelections();
    renderer.refresh();
  }

  // Attach event listeners to "Select All" and "Deselect All" for Languages
  function attachLanguageSelectDeselectEventListeners() {
    const selectAllButton = document.getElementById(
      "select-all"
    ) as HTMLButtonElement;
    const deselectAllButton = document.getElementById(
      "deselect-all"
    ) as HTMLButtonElement;

    selectAllButton?.addEventListener("click", () => {
      handleSelectAllDeselectAllLanguages(true);
    });

    deselectAllButton?.addEventListener("click", () => {
      handleSelectAllDeselectAllLanguages(false);
    });
  }

  attachLanguageSelectDeselectEventListeners();

  // Handle "Select All" / "Deselect All" for Genres
  function handleSelectAllDeselectAllGenres(selectAll: boolean) {
    const genreCheckboxes = state.genreCheckboxes!;
    genreCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectAll;
      if (selectAll) {
        state.selectedGenres.add(checkbox.value);
      } else {
        state.selectedGenres.delete(checkbox.value);
      }
    });

    // Recompute selectedNeighbors if a node is selected
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // Recompute selections so out-of-range nodes are dropped
    recomputeSelections();
    renderer.refresh();
  }

  // Attach event listeners to "Select All" and "Deselect All" for Genres
  function attachGenreSelectDeselectEventListeners() {
    const selectAllGenresButton = document.getElementById(
      "select-all-genres"
    ) as HTMLButtonElement;
    const deselectAllGenresButton = document.getElementById(
      "deselect-all-genres"
    ) as HTMLButtonElement;

    selectAllGenresButton?.addEventListener("click", () => {
      handleSelectAllDeselectAllGenres(true);
    });

    deselectAllGenresButton?.addEventListener("click", () => {
      handleSelectAllDeselectAllGenres(false);
    });
  }

  attachGenreSelectDeselectEventListeners();

  // Initialize Sigma renderer
  const renderer = new Sigma(graph, container);
  // Configure renderer settings
  renderer.setSetting("labelRenderedSizeThreshold", 5.5); // Adjust threshold as needed

  // Tab Switching Logic (if applicable)
  const tabButtons = document.querySelectorAll(".tablinks");
  const tabContents = document.querySelectorAll<HTMLElement>(".tabcontent");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      // Remove 'active' class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add 'active' class to the selected tab and content
      button.classList.add("active");
      document.getElementById(tabId!)?.classList.add("active");
    });
  });

  // Initialize to show the language tab by default
  document
    .querySelector('.tablinks[data-tab="language-tab"]')
    ?.classList.add("active");
  document.getElementById("language-tab")?.classList.add("active");

  // Event listener for the Apply Time Range button
  timerangeButton.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default form submission
    const minYear = parseInt(minYearInput.value) || 1800;
    const maxYear = parseInt(maxYearInput.value) || 2024;
    state.minYear = minYear;
    state.maxYear = maxYear;

    // Recompute selectedNeighbors if a node is selected
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // Recompute selections so out-of-range nodes are dropped
    recomputeSelections();
    renderer.refresh();
  });

  // Event listener for the Reset Time Range button
  timerangeResetButton.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent default form submission
    minYearInput.value = "1800";
    maxYearInput.value = "2024";
    state.minYear = 1800;
    state.maxYear = 2024;

    // Recompute selectedNeighbors if a node is selected
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // Recompute selections so out-of-range nodes are dropped
    recomputeSelections();
    renderer.refresh();
  });

  // Function to set search query and handle suggestions
  function setSearchQuery(query: string) {
    state.searchQuery = query;

    if (searchInput.value !== query) searchInput.value = query;

    if (query) {
      const lcQuery = query.toLowerCase();
      const suggestions = graph
        .nodes()
        .map((n) => ({
          id: n,
          label: graph.getNodeAttribute(n, "label") as string,
        }))
        .filter(({ label }) => label.toLowerCase().includes(lcQuery));

      // If single perfect match, select it
      if (suggestions.length === 1 && suggestions[0].label === query) {
        state.selectedNode = suggestions[0].id;
        state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
        state.suggestions = undefined;

        // Move camera to selected node
        const nodeDisplayData = renderer.getNodeDisplayData(
          state.selectedNode
        ) as Coordinates;
        renderer.getCamera().animate(nodeDisplayData, {
          duration: 500,
        });
      } else {
        state.selectedNode = undefined;
        state.suggestions = new Set(suggestions.map(({ id }) => id));
      }
    } else {
      state.selectedNode = undefined;
      state.suggestions = undefined;
      state.selectedNeighbors = undefined;
    }

    renderer.refresh();
  }

  // Function to set hovered node
  function setHoveredNode(node?: string) {
    if (node) {
      state.hoveredNode = node;
    } else {
      state.hoveredNode = undefined;
    }

    renderer.refresh();
  }

  // Function to get visible neighbors based on current filters
  function getVisibleNeighbors(node: string): Set<string> {
    const neighbors = new Set<string>();

    graph.forEachNeighbor(node, (neighbor, attributes) => {
      const edge = graph.edge(node, neighbor) || graph.edge(neighbor, node);
      if (edge) {
        const edgeAttributes = graph.getEdgeAttributes(edge);

        // Time range filtering based on works
        const works = edgeAttributes.works as [string, number][] | undefined;
        const hasWorkInTimeRange = works
          ? works.some((work) => work[1] >= state.minYear && work[1] <= state.maxYear)
          : false;

        if (!hasWorkInTimeRange) {
          return;
        }

        // Genre filtering
        if (state.selectedGenres.size > 0) {
          const edgeGenres = edgeAttributes.genres as string[] | undefined;
          const hasSelectedGenre = edgeGenres
            ? edgeGenres.some((genre) => state.selectedGenres.has(genre))
            : false;
          if (!hasSelectedGenre) {
            return;
          }
        } else {
          // If no genres selected, do not include edges
          return;
        }

        // Language filtering
        if (state.selectedLanguages.size > 0) {
          const edgeLanguages = edgeAttributes.languages as string[] | undefined;
          const hasSelectedLanguage = edgeLanguages
            ? edgeLanguages.some((lang) => state.selectedLanguages.has(lang))
            : false;
          if (!hasSelectedLanguage) {
            return;
          }
        } else {
          // If no languages selected, do not include edges
          return;
        }

        // If edge passes all filters, add neighbor
        neighbors.add(neighbor);
      }
    });

    return neighbors;
  }

  // Function to recompute node/edge selections after applying filters
  function recomputeSelections() {
    // 1) If we have a single selected node, recompute its neighbors
    if (state.selectedNode) {
      state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    }

    // 2) If we have multiple selected nodes, union their neighbors again
    if (state.multiSelectedNodes && state.multiSelectedNodes.size > 0) {
      const newSet = new Set<string>();
      for (const node of state.multiSelectedNodes) {
        for (const neigh of getVisibleNeighbors(node)) {
          newSet.add(neigh);
        }
      }
      state.multiSelectedNeighbors = newSet;
    } else {
      state.multiSelectedNeighbors = undefined;
    }
  }

  // Bind search input interactions
  searchInput.addEventListener("input", () => {
    setSearchQuery(searchInput.value.trim());
  });

  searchInput.addEventListener("blur", () => {
    // Instead of clearing the entire query & deselecting the node, 
    // just hide suggestions (or set state.suggestions = undefined).
    state.suggestions = undefined;
    renderer.refresh();
  });

  searchInput.addEventListener("focus", () => {
    // Automatically select all text, so one keystroke replaces it
    searchInput.select();
  });

  // Bind graph interactions
  renderer.on("enterNode", ({ node }) => {
    // if (!state.selectedNode && !state.selectedNeighbors) {
    setHoveredNode(node);
    // }
  });

  renderer.on("leaveNode", () => {
    setHoveredNode(undefined);
  });

  renderer.on("clickNode", (e) => {
    // Check if Ctrl or Meta is pressed
    const domEvent = e.event.original as MouseEvent;
    const isCtrlClick = domEvent.ctrlKey || domEvent.metaKey;
    const node = e.node;

    if (isCtrlClick) {
      // 1) Toggle the node in state.multiSelectedNodes
      if (state.multiSelectedNodes.has(node)) {
        state.multiSelectedNodes.delete(node);
      } else {
        state.multiSelectedNodes.add(node);
      }
      // 2) Recompute neighbors for multiSelectedNodes
      //    The simplest approach: union of neighbors for each multi-selected node
      //    We'll store them in a new property, e.g., multiSelectedNeighbors
      state.multiSelectedNeighbors = new Set<string>();
      for (const n of state.multiSelectedNodes) {
        for (const neighbor of getVisibleNeighbors(n)) {
          state.multiSelectedNeighbors.add(neighbor);
        }
      }

      // Do NOT modify state.selectedNode or state.selectedNeighbors
      // so single-click logic remains intact.
    } else {
      // Original single-node logic
      state.selectedNode = node;
      state.selectedNeighbors = getVisibleNeighbors(node);
      setHoveredNode(undefined);

      // Clear any old multi-selections
      state.multiSelectedNodes.clear();
      state.multiSelectedNeighbors = undefined;
    }

    renderer.refresh();
  });


  renderer.on("clickStage", () => {
    searchInput.value = "";          // Clear the search field
    state.searchQuery = "";          // Clear internal state
    state.selectedNode = undefined;
    state.selectedNeighbors = undefined;
    state.multiSelectedNodes.clear();
    state.multiSelectedNeighbors?.clear();
    setHoveredNode(undefined);
    renderer.refresh();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      state.searchQuery = "";
      state.selectedNode = undefined;
      state.selectedNeighbors = undefined;
      state.multiSelectedNodes.clear();
      state.multiSelectedNeighbors?.clear();
      renderer.refresh();
    }
  });

  // Function to check if a node has any visible edges based on current state
  function nodeHasVisibleEdges(node: string): boolean {
    return graph.someEdge(node, (edge, attributes, source, target) => {
      // Time range filtering based on works
      const works = attributes.works as [string, number][] | undefined;
      const hasWorkInTimeRange = works
        ? works.some((work) => work[1] >= state.minYear && work[1] <= state.maxYear)
        : false;
      if (!hasWorkInTimeRange) {
        return false;
      }

      // Genre filtering
      if (state.selectedGenres.size > 0) {
        const edgeGenres = attributes.genres as string[] | undefined;
        const hasSelectedGenre = edgeGenres
          ? edgeGenres.some((genre) => state.selectedGenres.has(genre))
          : false;
        if (!hasSelectedGenre) {
          return false;
        }
      } else {
        // If no genres selected, do not include edges
        return false;
      }

      // Language filtering
      if (state.selectedLanguages.size > 0) {
        const edgeLanguages = attributes.languages as string[] | undefined;
        const hasSelectedLanguage = edgeLanguages
          ? edgeLanguages.some((lang) => state.selectedLanguages.has(lang))
          : false;
        if (!hasSelectedLanguage) {
          return false;
        }
      } else {
        // If no languages selected, do not include edges
        return false;
      }

      return true;
    });
  }

  // Configure Edge Reducer
  renderer.setSetting("edgeReducer", (edge, data) => {
    const res: Partial<EdgeDisplayData> = { ...data };
    const edgeAttributes = graph.getEdgeAttributes(edge);

    // 1. Time range filtering
    const works = edgeAttributes.works as [string, number][] | undefined;
    const hasWorkInTimeRange = works
      ? works.some(([_, year]) => year >= state.minYear && year <= state.maxYear)
      : false;
    if (!hasWorkInTimeRange) {
      res.hidden = true;
      return res;
    }

    // 2. Genre filtering
    if (state.selectedGenres.size > 0) {
      const edgeGenres = edgeAttributes.genres as string[] | undefined;
      const hasSelectedGenre = edgeGenres
        ? edgeGenres.some((g) => state.selectedGenres.has(g))
        : false;
      if (!hasSelectedGenre) {
        res.hidden = true;
        return res;
      }
    } else {
      // If no genres selected, hide all edges
      res.hidden = true;
      return res;
    }

    // 3. Language filtering
    if (state.selectedLanguages.size > 0) {
      const edgeLanguages = edgeAttributes.languages as string[] | undefined;
      const hasSelectedLanguage = edgeLanguages
        ? edgeLanguages.some((lang) => state.selectedLanguages.has(lang))
        : false;
      if (!hasSelectedLanguage) {
        res.hidden = true;
        return res;
      }
    } else {
      // If no languages selected, hide all edges
      res.hidden = true;
      return res;
    }

    // 4. Combine single and multi-selected nodes
    const selectedSet = new Set<string>();
    if (state.selectedNode) {
      selectedSet.add(state.selectedNode);
    }
    if (state.multiSelectedNodes && state.multiSelectedNodes.size > 0) {
      for (const nd of state.multiSelectedNodes) {
        selectedSet.add(nd);
      }
    }

    const source = graph.source(edge);
    const target = graph.target(edge);

    // 5. If there's at least one selected node...
    if (selectedSet.size > 0) {
      // Show edge only if it connects to at least one selected node
      const connectsToSelection = selectedSet.has(source) || selectedSet.has(target);
      if (!connectsToSelection) {
        res.hidden = true;
        return res;
      }
    }
    // 6. Otherwise, if we have suggestions...
    else if (state.suggestions) {
      // Show edge only if both endpoints are in suggestions
      if (!state.suggestions.has(source) || !state.suggestions.has(target)) {
        res.hidden = true;
        return res;
      }
    }

    // If none of the above hid the edge, show it
    res.hidden = false;
    return res;
  });

  // Configure Node Reducer
  renderer.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };

    // 1) If this node has no visible edges under current filters,
    //    hide it right away.
    if (!nodeHasVisibleEdges(node)) {
      res.label = "";
      res.color = "#f6f6f6";
      return res;
    }

    // 2) Handle "hoveredNode" (unchanged logic).
    if (state.hoveredNode === node) {
      res.label = graph.getNodeAttribute(node, "label") as string;
      res.color = data.color;
      return res;
    }

    // 3) Combine single- and multi-selected sets
    const selectedSet = new Set<string>();
    if (state.selectedNode) {
      selectedSet.add(state.selectedNode);
    }
    if (state.multiSelectedNodes && state.multiSelectedNodes.size > 0) {
      for (const m of state.multiSelectedNodes) {
        selectedSet.add(m);
      }
    }

    // 4) Also combine their neighbors
    const neighborSet = new Set<string>();
    if (state.selectedNeighbors) {
      for (const n of state.selectedNeighbors) {
        neighborSet.add(n);
      }
    }
    if (state.multiSelectedNeighbors) {
      for (const n of state.multiSelectedNeighbors) {
        neighborSet.add(n);
      }
    }

    // 5) If any nodes are selected:
    if (selectedSet.size > 0) {
      if (selectedSet.has(node)) {
        // Highlight the selected node
        res.highlighted = true;
        res.label = graph.getNodeAttribute(node, "label") as string;
      } else if (neighborSet.has(node)) {
        // A neighbor of one or more selected nodes
        res.label = graph.getNodeAttribute(node, "label") as string;
        res.color = data.color;
      } else {
        // Not selected, nor a neighbor of selected
        res.label = "";
        res.color = "#f6f6f6";
      }
      return res;
    }

    // 6) If there are search suggestions, apply that
    if (state.suggestions) {
      if (!state.suggestions.has(node)) {
        res.label = "";
        res.color = "#f6f6f6";
        return res;
      }
    }

    // If no filters are excluding it, return as-is
    return res;
  });

  // Load graph data and initialize UI
  await loadGraphDataAndInitialize();

});