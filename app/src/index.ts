import Sigma from "sigma";
import {
  Coordinates,
  EdgeDisplayData,
  NodeDisplayData,
} from "sigma/types";
import Graph from "graphology";
import { Attributes } from "graphology-types";

document.addEventListener("DOMContentLoaded", async () => {
  // Instantiate sigma:
  const graph = new Graph();

  // Retrieve some useful DOM elements:
  const container = document.getElementById("sigma-container") as HTMLElement;
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const searchSuggestions = document.getElementById(
    "suggestions"
  ) as HTMLDataListElement;

  // Language checkboxes container
  const languageCheckboxesContainer = document.getElementById(
    "checkboxes"
  ) as HTMLElement;

  // Genre checkboxes container
  const genreCheckboxesContainer = document.getElementById(
    "genre-checkboxes"
  ) as HTMLElement;

  const minYearInput = document.getElementById("min-year") as HTMLInputElement;
  const maxYearInput = document.getElementById("max-year") as HTMLInputElement;
  const timerangeButton = document.getElementById(
    "timerange-button"
  ) as HTMLButtonElement;
  const timerangeResetButton = document.getElementById(
    "timerange-reset-button"
  ) as HTMLButtonElement;

  // Declare application state
  interface State {
    hoveredNode?: string;
    searchQuery: string;
    selectedNode?: string;
    selectedNeighbors?: Set<string>;
    suggestions?: Set<string>;
    hoveredNeighbors?: Set<string>;
    selectedLanguages: Set<string>;
    selectedGenres: Set<string>;
    minYear: number;
    maxYear: number;
    languageCheckboxes?: NodeListOf<HTMLInputElement>;
    genreCheckboxes?: NodeListOf<HTMLInputElement>;
  }

  // Initialize minYear and maxYear from inputs
  const minYear = parseInt(minYearInput.value);
  const maxYear = parseInt(maxYearInput.value);

  // Initialize state with empty selectedLanguages and selectedGenres
  const state: State = {
    searchQuery: "",
    selectedLanguages: new Set<string>(),
    selectedGenres: new Set<string>(),
    minYear: minYear,
    maxYear: maxYear,
  };

  // Define language colors mapping
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

  // Language codes mapping
  const languageCodes: { [code: string]: string } = {
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
    "bel": "valgevene",
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

  // Function to load graph data and populate suggestions, languages, and genres
  async function loadGraphDataAndPopulate() {
    const response = await fetch("data.json");
    const graphData = await response.json();

    graph.import(graphData);

    // Populate the search suggestions
    searchSuggestions.innerHTML = graph
      .nodes()
      .map((node) => {
        const label = graph.getNodeAttribute(node, "label");
        return `<option value="${label}"></option>`;
      })
      .join("\n");

    // Now, count the languages and generate the checkboxes
    generateLanguageCheckboxes();

    // Count genres and generate genre checkboxes
    generateGenreCheckboxes();
  }

  await loadGraphDataAndPopulate();

  const renderer = new Sigma(graph, container);
  // Configure renderer settings
  renderer.setSetting("labelRenderedSizeThreshold", 5);

  // Function to count languages and generate checkboxes
  function generateLanguageCheckboxes() {
    // Count the languages from edge attributes
    const languageCounts: { [code: string]: number } = {};
    let totalLanguages = 0;

    // Iterate over all edges to extract languages
    graph.forEachEdge((edge, attributes) => {
      const languages = attributes.languages as string[];
      if (Array.isArray(languages) && languages.length > 0) {
        languages.forEach((lang) => {
          languageCounts[lang] = (languageCounts[lang] || 0) + 1;
          totalLanguages++;
        });
      } else {
        // Handle edges with no languages (optional)
        languageCounts["other"] = (languageCounts["other"] || 0) + 1;
        totalLanguages++;
      }
    });

    // Sort languages by count in descending order
    const sortedLanguages = Object.entries(languageCounts).sort(
      (a, b) => b[1] - a[1]
    );

    // Ensure 'other' is added at the end if it exists
    const checkboxValues = sortedLanguages
      .map(([lang, _]) => lang)
      .filter((lang) => lang !== "other");
    if (languageCounts["other"]) {
      checkboxValues.push("other");
    }

    // Generate the HTML for checkboxes
    let htmlString = "";

    checkboxValues.forEach((lang) => {
      const langCount = languageCounts[lang];
      const langPercentage =
        totalLanguages > 0 ? (langCount / totalLanguages) * 100 : 0;
      const langName = languageCodes[lang] || lang;
      const color = languageColors[lang] || languageColors["other"];

      htmlString += `
      <label>
        <input type="checkbox" value="${lang}" checked />
        <span class="item-name" style="color: ${color};">${langName}</span>
        <span class="percentage">${langPercentage.toFixed(2)}%</span>
      </label>
      `;
    });

    // Insert the HTML into the container
    languageCheckboxesContainer.innerHTML = htmlString;

    // After adding the checkboxes to the DOM, select them for event listeners
    const languageCheckboxes =
      languageCheckboxesContainer.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]'
      );

    // Initialize selectedLanguages state
    languageCheckboxes.forEach((checkbox) => {
      const language = checkbox.value;
      if (checkbox.checked) {
        state.selectedLanguages.add(language);
      }
    });

    // Attach event listeners to the checkboxes
    languageCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleLanguageCheckboxChange);
    });

    // Save the checkboxes for later use
    state.languageCheckboxes = languageCheckboxes;
  }

  // Function to count genres and generate checkboxes
  function generateGenreCheckboxes() {
    // Count the genres
    const genreCounts: { [genre: string]: number } = {};
    let totalGenres = 0;

    // Iterate over all edges to extract genres
    graph.forEachEdge((edge, attributes) => {
      const genres = attributes.genres as string[];
      if (Array.isArray(genres) && genres.length > 0) {
        genres.forEach((genre) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          totalGenres++;
        });
      } else {
        // Handle edges with no genres (optional)
        genreCounts["other"] = (genreCounts["other"] || 0) + 1;
        totalGenres++;
      }
    });

    // Sort genres by count in descending order
    const sortedGenres = Object.entries(genreCounts).sort(
      (a, b) => b[1] - a[1]
    );

    // Generate the HTML for checkboxes
    let htmlString = "";

    sortedGenres.forEach(([genre, count]) => {
      const genreCount = count;
      const genrePercentage =
        totalGenres > 0 ? (genreCount / totalGenres) * 100 : 0;

      // Use genre as the label (you can map to display names if needed)
      const genreLabel = genre;

      htmlString += `
      <label>
        <input type="checkbox" value="${genre}" checked />
        <span class="item-name">${genreLabel}</span>
        <span class="percentage">${genrePercentage.toFixed(2)}%</span>
      </label>
      `;
    });

    // Insert the HTML into the container
    genreCheckboxesContainer.innerHTML = htmlString;

    // After adding the checkboxes to the DOM, select them for event listeners
    const genreCheckboxes =
      genreCheckboxesContainer.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]'
      );

    // Initialize selectedGenres state
    genreCheckboxes.forEach((checkbox) => {
      const genre = checkbox.value;
      if (checkbox.checked) {
        state.selectedGenres.add(genre);
      }
    });

    // Attach event listeners to the checkboxes
    genreCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleGenreCheckboxChange);
    });

    // Save the checkboxes for later use
    state.genreCheckboxes = genreCheckboxes;
  }

  // Function to handle language checkbox changes
  function handleLanguageCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const language = checkbox.value;

    if (checkbox.checked) {
      // Checkbox is checked, add the language to selectedLanguages
      state.selectedLanguages.add(language);
    } else {
      // Checkbox is unchecked, remove the language from selectedLanguages
      state.selectedLanguages.delete(language);
    }
    renderer.refresh();
  }

  // Function to handle genre checkbox changes
  function handleGenreCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const genre = checkbox.value;

    if (checkbox.checked) {
      // Checkbox is checked, add the genre to selectedGenres
      state.selectedGenres.add(genre);
    } else {
      // Checkbox is unchecked, remove the genre from selectedGenres
      state.selectedGenres.delete(genre);
    }
    renderer.refresh();
  }

  // Function to handle the "Select All" and "Deselect All" buttons for languages
  function handleSelectAllDeselectAllLanguages(selectAll: boolean) {
    // Loop through language checkboxes and set their checked state
    const languageCheckboxes = state.languageCheckboxes!;
    languageCheckboxes.forEach((checkbox) => {
      const language = checkbox.value;
      checkbox.checked = selectAll;

      if (selectAll) {
        state.selectedLanguages.add(language);
      } else {
        state.selectedLanguages.delete(language);
      }
    });
    renderer.refresh();
  }

  // Attach event listeners to "Select All" and "Deselect All" buttons for languages
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

  // Function to handle the "Select All" and "Deselect All" buttons for genres
  function handleSelectAllDeselectAllGenres(selectAll: boolean) {
    // Loop through genre checkboxes and set their checked state
    const genreCheckboxes = state.genreCheckboxes!;
    genreCheckboxes.forEach((checkbox) => {
      const genre = checkbox.value;
      checkbox.checked = selectAll;

      if (selectAll) {
        state.selectedGenres.add(genre);
      } else {
        state.selectedGenres.delete(genre);
      }
    });
    renderer.refresh();
  }

  // Attach event listeners to "Select All" and "Deselect All" buttons for genres
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

  // Tab switching logic
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

  // Event listener for the apply button
  timerangeButton.addEventListener("click", function () {
    // Get the values from the input elements
    const minYear = parseInt(minYearInput.value);
    const maxYear = parseInt(maxYearInput.value);
    state.minYear = minYear;
    state.maxYear = maxYear;

    // Refresh rendering:
    renderer.refresh();
  });

  // Event listener for the reset button
  timerangeResetButton.addEventListener("click", function () {
    // Reset the time range inputs
    minYearInput.value = "1800";
    maxYearInput.value = "2024";
    state.minYear = 1800;
    state.maxYear = 2024;

    // Refresh rendering:
    renderer.refresh();
  });

  // Actions:
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

      // If we have a single perfect match, consider it selected
      if (suggestions.length === 1 && suggestions[0].label === query) {
        state.selectedNode = suggestions[0].id;
        state.selectedNeighbors = new Set(
          graph.neighbors(state.selectedNode)
        );
        state.suggestions = undefined;

        // Move the camera to center it on the selected node:
        const nodePosition = renderer.getNodeDisplayData(
          state.selectedNode
        ) as Coordinates;
        renderer.getCamera().animate(nodePosition, {
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

    // Refresh rendering:
    renderer.refresh();
  }

  function setHoveredNode(node?: string) {
    if (node) {
      state.hoveredNode = node;
      state.hoveredNeighbors = new Set(graph.neighbors(node));
    } else {
      state.hoveredNode = undefined;
      state.hoveredNeighbors = undefined;
    }

    // Refresh rendering:
    renderer.refresh();
  }

  // Bind search input interactions:
  searchInput.addEventListener("input", () => {
    setSearchQuery(searchInput.value || "");
  });
  searchInput.addEventListener("blur", () => {
    setSearchQuery("");
  });

  // Bind graph interactions:
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
    state.selectedNeighbors = new Set(graph.neighbors(state.selectedNode));
    setHoveredNode(undefined);
  });
  renderer.on("clickStage", () => {
    state.selectedNode = undefined;
    state.selectedNeighbors = undefined;
    setHoveredNode(undefined);
  });

  // Function to check if node has any visible edges based on current state
  function nodeHasVisibleEdges(node: string): boolean {
    return graph.someEdge(node, (edge, attributes, source, target) => {
      const edgeAttributes = graph.getEdgeAttributes(edge);

      // Time range filtering
      if (
        edgeAttributes.activity_end < state.minYear ||
        edgeAttributes.activity_start > state.maxYear
      ) {
        return false;
      }

      // Genre filtering
      if (state.selectedGenres.size === 0) {
        // No genres selected; hide all edges
        return false;
      } else {
        const edgeGenres = edgeAttributes.genres as string[];
        const hasSelectedGenre = edgeGenres.some((genre) =>
          state.selectedGenres.has(genre)
        );
        if (!hasSelectedGenre) {
          return false;
        }
      }

      // Language filtering
      const edgeLanguages = edgeAttributes.languages as string[];
      const hasSelectedLanguage = edgeLanguages.some((lang) =>
        state.selectedLanguages.has(lang)
      );
      if (!hasSelectedLanguage) {
        return false;
      }

      return true;
    });
  }

  renderer.setSetting("edgeReducer", (edge, data) => {
    const res: Partial<EdgeDisplayData> = { ...data };

    const edgeAttributes = graph.getEdgeAttributes(edge);

    // Existing logic for time range
    if (
      edgeAttributes.activity_end < state.minYear ||
      edgeAttributes.activity_start > state.maxYear
    ) {
      res.hidden = true;
      return res;
    }

    // Apply genre filtering
    if (state.selectedGenres.size === 0) {
      // No genres selected; hide all edges
      res.hidden = true;
      return res;
    } else {
      const edgeGenres = edgeAttributes.genres as string[];
      const hasSelectedGenre = edgeGenres.some((genre) =>
        state.selectedGenres.has(genre)
      );
      if (!hasSelectedGenre) {
        res.hidden = true;
        return res;
      }
    }

    // Apply language filtering based on edge languages
    const edgeLanguages = edgeAttributes.languages as string[];
    const hasSelectedLanguage = edgeLanguages.some((lang) =>
      state.selectedLanguages.has(lang)
    );
    if (!hasSelectedLanguage) {
      res.hidden = true;
      return res;
    }

    // Existing logic for hover and selection
    if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
      res.hidden = true;
    } else if (
      state.selectedNode &&
      !graph.hasExtremity(edge, state.selectedNode)
    ) {
      res.hidden = true;
    } else if (
      state.suggestions &&
      (!state.suggestions.has(graph.source(edge)) ||
        !state.suggestions.has(graph.target(edge)))
    ) {
      res.hidden = true;
    } else {
      res.hidden = false;
    }

    return res;
  });

  renderer.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };

    const nodeAttributes = graph.getNodeAttributes(node);

    // Existing logic for time range
    if (
      nodeAttributes.activity_end < state.minYear ||
      nodeAttributes.activity_start > state.maxYear
    ) {
      res.label = "";
      res.color = "#f6f6f6";
      return res;
    }

    // Check if node has any visible edges
    if (!nodeHasVisibleEdges(node)) {
      res.label = "";
      res.color = "#f6f6f6";
      return res;
    }

    // Existing logic for hover and selection
    if (
      state.hoveredNeighbors &&
      !state.hoveredNeighbors.has(node) &&
      state.hoveredNode !== node
    ) {
      res.label = "";
      res.color = "#f6f6f6";
    } else if (state.selectedNode === node) {
      res.highlighted = true;
    } else if (
      state.selectedNeighbors &&
      !state.selectedNeighbors.has(node)
    ) {
      res.label = "";
      res.color = "#f6f6f6";
    } else if (state.suggestions && !state.suggestions.has(node)) {
      res.label = "";
      res.color = "#f6f6f6";
    }

    return res;
  });
});