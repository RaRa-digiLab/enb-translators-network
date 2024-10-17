import Sigma from "sigma";
import {
  Coordinates,
  EdgeDisplayData,
  NodeDisplayData,
} from "sigma/types";
import Graph from "graphology";
import { Attributes } from "graphology-types";

document.addEventListener('DOMContentLoaded', async () => {
  // Instantiate sigma:
  const graph = new Graph();

  // Retrieve some useful DOM elements:
  const container = document.getElementById("sigma-container") as HTMLElement;
  const searchInput = document.getElementById("search-input") as HTMLInputElement;
  const searchSuggestions = document.getElementById(
    "suggestions"
  ) as HTMLDataListElement;
  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '#language-tab input[type="checkbox"]'
  );

  const minYearInput = document.getElementById("min-year") as HTMLInputElement;
  const maxYearInput = document.getElementById("max-year") as HTMLInputElement;
  const timerangeButton = document.getElementById(
    "timerange-button"
  ) as HTMLButtonElement;
  const timerangeResetButton = document.getElementById(
    "timerange-reset-button"
  ) as HTMLButtonElement;

  const genreSelect = document.getElementById(
    "genre-select"
  ) as HTMLSelectElement;

  // Declare application state with selectedGenre
  interface State {
    hoveredNode?: string;
    searchQuery: string;
    selectedNode?: string;
    selectedNeighbors?: Set<string>;
    suggestions?: Set<string>;
    hoveredNeighbors?: Set<string>;
    selectedLanguages: Set<string>;
    minYear: number;
    maxYear: number;
    selectedGenre?: string | null; // Add selectedGenre to state
  }

  // Initialize minYear and maxYear from inputs
  const minYear = parseInt(minYearInput.value);
  const maxYear = parseInt(maxYearInput.value);

  const languageOptions = new Set<string>();
  checkboxes.forEach((checkbox) => {
    if (checkbox.checked) {
      languageOptions.add(checkbox.value);
    }
  });

  // Initialize state with selectedGenre
  const state: State = {
    searchQuery: "",
    selectedLanguages: languageOptions,
    minYear: minYear,
    maxYear: maxYear,
    selectedGenre: null,
  };

  // Function to load graph data and populate suggestions and genres
  async function loadGraphDataAndPopulateSuggestions() {
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

    // Collect unique genres from edges
    const genreSet = new Set<string>();
    graph.forEachEdge((edge) => {
      const genres = graph.getEdgeAttribute(edge, "genres") as string[];
      genres.forEach((genre) => genreSet.add(genre));
    });

    // Sort genres alphabetically
    const genreList = Array.from(genreSet).sort();

    // Populate the genre select element
    genreList.forEach((genre) => {
      const option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreSelect.appendChild(option);
    });
  }

  await loadGraphDataAndPopulateSuggestions();

  const renderer = new Sigma(graph, container);
  // Configure renderer settings
  renderer.setSetting("labelRenderedSizeThreshold", 5);

  // Add event listener for the genre select element
  genreSelect.addEventListener("change", () => {
    const selectedGenre = genreSelect.value;
    if (selectedGenre === "") {
      state.selectedGenre = null; // No genre selected
    } else {
      state.selectedGenre = selectedGenre;
    }
    renderer.refresh();
  });

  // Tab switching logic
  const tabButtons = document.querySelectorAll(".tablinks");
  const tabContents = document.querySelectorAll<HTMLElement>(".tabcontent");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");

      // Remove 'active' class from all buttons and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) =>
        content.classList.remove("active")
      );

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

  // Clear filters button logic
  const clearFiltersButton = document.getElementById(
    "clear-filters"
  ) as HTMLButtonElement;
  clearFiltersButton.addEventListener("click", () => {
    // Reset language selections
    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
      state.selectedLanguages.add(checkbox.value);
    });

    // Reset genre selection
    genreSelect.value = "";
    state.selectedGenre = null;

    // Refresh the renderer
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

  // Function to handle checkbox changes
  function handleCheckboxChange(event: Event) {
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
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleCheckboxChange);
  });

  // Function to handle the "Select All" and "Deselect All" buttons
  function handleSelectAllDeselectAllClick(selectAll: boolean) {
    // Loop through checkboxes and set their checked state
    checkboxes.forEach((checkbox) => {
      const language = checkbox.value;
      checkbox.checked = selectAll;

      if (selectAll) {
        // If "Select All" is clicked, add all languages to selectedLanguages
        state.selectedLanguages.add(language);
      } else {
        // If "Deselect All" is clicked, remove all languages
        state.selectedLanguages.delete(language);
      }
    });
    renderer.refresh();
  }

  // Attach event listeners to "Select All" and "Deselect All" buttons
  const selectAllButton = document.getElementById(
    "select-all"
  ) as HTMLButtonElement;
  const deselectAllButton = document.getElementById(
    "deselect-all"
  ) as HTMLButtonElement;

  selectAllButton?.addEventListener("click", () => {
    handleSelectAllDeselectAllClick(true);
  });

  deselectAllButton?.addEventListener("click", () => {
    handleSelectAllDeselectAllClick(false);
  });

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
    state.selectedNeighbors = new Set(graph.neighbors(node));
    setHoveredNode(undefined);
  });
  renderer.on("clickStage", () => {
    state.selectedNode = undefined;
    state.selectedNeighbors = undefined;
    setHoveredNode(undefined);
  });

  // Function to check if any neighbor of a node has a language in the set
  function hasNeighborWithLanguages(
    graph: Graph,
    nodeKey: string,
    languages = state.selectedLanguages
  ): boolean {
    return graph.someNeighbor(
      nodeKey,
      (neighbor: string, attributes: Attributes) => {
        return languages.has(attributes.author_lang);
      }
    );
  }

  renderer.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };

    // Existing logic for time range
    if (
      data.activity_end < state.minYear ||
      data.activity_start > state.maxYear
    ) {
      res.label = "";
      res.color = "#f6f6f6";
    } else {
      const hasEdgeActivityInRange = graph
        .edges(node)
        .some((edge) => {
          const edgeData = graph.getEdgeAttributes(edge);
          return (
            edgeData.activity_start <= state.maxYear &&
            edgeData.activity_end >= state.minYear
          );
        });

      // Grey out the node if none of its edges are in range
      if (!hasEdgeActivityInRange) {
        res.label = "";
        res.color = "#f6f6f6";
      }
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
    } else if (
      data.author_lang !== "tlk" &&
      !state.selectedLanguages.has(data.author_lang)
    ) {
      res.label = "";
      res.color = "#f6f6f6";
    } else if (
      data.author_lang === "tlk" &&
      !hasNeighborWithLanguages(graph, node, state.selectedLanguages)
    ) {
      res.label = "";
      res.color = "#f6f6f6";
    }

    // Apply genre filtering
    if (state.selectedGenre) {
      const hasEdgeWithGenre = graph
        .edges(node)
        .some((edge) => {
          const edgeGenres = graph.getEdgeAttribute(
            edge,
            "genres"
          ) as string[];
          return edgeGenres.includes(state.selectedGenre!);
        });
      if (!hasEdgeWithGenre) {
        res.label = "";
        res.color = "#f6f6f6";
      }
    }

    return res;
  });

  renderer.setSetting("edgeReducer", (edge, data) => {
    const res: Partial<EdgeDisplayData> = { ...data };

    // Existing logic for time range
    if (
      data.activity_end < state.minYear ||
      data.activity_start > state.maxYear
    ) {
      res.hidden = true;
    }

    // Existing logic for hover and selection
    if (
      state.hoveredNode &&
      !graph.hasExtremity(edge, state.hoveredNode)
    ) {
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
      const sourceNodeLanguage = graph.getNodeAttribute(
        graph.source(edge),
        "author_lang"
      );
      const targetNodeLanguage = graph.getNodeAttribute(
        graph.target(edge),
        "author_lang"
      );

      if (
        !state.selectedLanguages.has(sourceNodeLanguage) &&
        !state.selectedLanguages.has(targetNodeLanguage)
      ) {
        res.hidden = true;
      }
    }

    // Apply genre filtering
    if (state.selectedGenre) {
      const edgeGenres = graph.getEdgeAttribute(
        edge,
        "genres"
      ) as string[];
      if (!edgeGenres.includes(state.selectedGenre)) {
        res.hidden = true;
      }
    }

    return res;
  });
});