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
        <p>
          Võrgustiku avastamiseks saab suumida sisse ja välja. Sõlmel klikkimine toob esile tema seosed teiste sõlmedega.
          Otsingu abil saab leida konkreetse autori või tõlkija. Samuti on võimalik vaadelda vaid soovitud
          keeli, žanre või kitsamat ajavahemikku.
        </p>
        <p>
          Rakendus põhineb
          <a href="https://doi.org/10.5281/zenodo.14708287">
            Eesti Rahvusbibliograafia
          </a>
          andmetel, lähtekood on leitav
          <a href="https://github.com/RaRa-digiLab/erb-translators-network/tree/main">
            GitHubis
          </a>
        </p>
        <p>
          <i>
            Krister Kruusmaa, <a href="https://digilab.rara.ee/">RaRa digilabor</a> 2024
          </i>
        </p>
        <p>
        </p>
      `
    },
    eng: {
      showDescription: "show description",
      hideDescription: "hide description",
      headingTitle: "Network of Translated Estonian Literature",
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
      <p>
        To explore the network, you can zoom in and out. Clicking on a node reveals its connections to other nodes.
        You can search for a specific author or translator, and it's also possible to filter by desired languages and genres, or narrow the time range.
      </p>
        <p>
          The app is based on data from
          <a href="https://doi.org/10.5281/zenodo.14708287">
            The Estonian National Bibliography
          </a>
          source code can be found on
          <a href="https://github.com/RaRa-digiLab/erb-translators-network/tree/main">
            GitHub
          </a>
        </p>
        <p>
          <i>
            Krister Kruusmaa,
            <a href="https://digilab.rara.ee/en">RaRa Digilab</a> 2024
          </i>
        </p>
        <p>
        </p>
      `
    },
  };

  // Application state interface
  interface State {
    hoveredNode?: string;
    searchQuery: string;
    selectedNode?: string;
    selectedNeighbors?: Set<string>;
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
      mainTitle.textContent = translations[lang].headingTitle;
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

  // Generate Genre Checkboxes
  function generateGenreCheckboxes() {
    const genreCounts: { [genre: string]: number } = {};
    let totalGenres = 0;

    graph.forEachEdge((edge, attributes) => {
      const genres = attributes.genres as string[] | undefined;
      if (genres && genres.length > 0) {
        genres.forEach((genre) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalGenres++;
        });
      } else {
        // Handle edges with no genres
        genreCounts["other"] = (genreCounts["other"] || 0) + 1;
        totalGenres++;
      }
    });

    // Sort genres by count descending
    const sortedGenres = Object.entries(genreCounts).sort(
      (a, b) => b[1] - a[1]
    );

    // Generate HTML for checkboxes
    let htmlString = "";
    sortedGenres.forEach(([genre, count]) => {
      const genrePercentage =
        totalGenres > 0 ? (count / totalGenres) * 100 : 0;
      const genreLabel = genre; // You can map to display names if needed

      htmlString += `
        <label>
          <input type="checkbox" value="${genre}" checked />
          <span class="item-name">${genreLabel}</span>
          <span class="percentage">${genrePercentage.toFixed(2)}%</span>
        </label>
      `;
    });

    // Insert into container
    genreCheckboxesContainer.innerHTML = htmlString;

    // Select checkboxes and initialize state
    const genreCheckboxes =
      genreCheckboxesContainer.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]'
      );
    state.genreCheckboxes = genreCheckboxes;

    genreCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        state.selectedGenres.add(checkbox.value);
      }
      // Attach event listener
      checkbox.addEventListener("change", handleGenreCheckboxChange);
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

  // Bind search input interactions
  searchInput.addEventListener("input", () => {
    setSearchQuery(searchInput.value.trim());
  });

  searchInput.addEventListener("blur", () => {
    setSearchQuery("");
  });

  // Bind graph interactions
  renderer.on("enterNode", ({ node }) => {
    if (!state.selectedNode && !state.selectedNeighbors) {
      setHoveredNode(node);
    }
  });

  renderer.on("leaveNode", () => {
    setHoveredNode(undefined);
  });

  renderer.on("clickNode", ({ node }) => {
    state.selectedNode = node;
    state.selectedNeighbors = getVisibleNeighbors(state.selectedNode);
    setHoveredNode(undefined);
    renderer.refresh();
  });

  renderer.on("clickStage", () => {
    state.selectedNode = undefined;
    state.selectedNeighbors = undefined;
    setHoveredNode(undefined);
    renderer.refresh();
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

    // Time range filtering based on works
    const works = edgeAttributes.works as [string, number][] | undefined;
    const hasWorkInTimeRange = works
      ? works.some((work) => work[1] >= state.minYear && work[1] <= state.maxYear)
      : false;

    if (!hasWorkInTimeRange) {
      res.hidden = true;
      return res;
    }

    // Genre filtering
    if (state.selectedGenres.size > 0) {
      const edgeGenres = edgeAttributes.genres as string[] | undefined;
      const hasSelectedGenre = edgeGenres
        ? edgeGenres.some((genre) => state.selectedGenres.has(genre))
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

    // Language filtering
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

    // Selection and Search Suggestions
    if (state.selectedNode) {
      if (!graph.hasExtremity(edge, state.selectedNode)) {
        res.hidden = true;
        return res;
      }
    }

    if (state.suggestions) {
      const source = graph.source(edge);
      const target = graph.target(edge);
      if (!state.suggestions.has(source) || !state.suggestions.has(target)) {
        res.hidden = true;
        return res;
      }
    }

    // Do not hide edges on hover
    res.hidden = false;
    return res;
  });

  // Configure Node Reducer
  renderer.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };

    // Check if node has any visible edges
    if (!nodeHasVisibleEdges(node)) {
      res.label = "";
      res.color = "#f6f6f6";
      return res;
    }

    // Hovered Node
    if (state.hoveredNode === node) {
      res.label = graph.getNodeAttribute(node, "label") as string;
      res.color = data.color;
      return res;
    }

    // Selected Node
    if (state.selectedNode) {
      if (state.selectedNode === node) {
        res.highlighted = true;
        res.label = graph.getNodeAttribute(node, "label") as string;
      } else if (state.selectedNeighbors?.has(node)) {
        // Neighbor of selected node
        res.label = graph.getNodeAttribute(node, "label") as string;
        res.color = data.color;
      } else {
        // Non-neighbor nodes when a node is selected
        res.label = "";
        res.color = "#f6f6f6";
      }
      return res;
    }

    // Search Suggestions
    if (state.suggestions) {
      if (!state.suggestions.has(node)) {
        res.label = "";
        res.color = "#f6f6f6";
        return res;
      }
    }

    return res;
  });

  // Load graph data and initialize UI
  await loadGraphDataAndInitialize();

});