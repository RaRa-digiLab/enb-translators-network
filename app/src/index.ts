import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import Graph from "graphology";
import { Attributes } from "graphology-types";

// Instantiate sigma:
const graph = new Graph();

// Retrieve some useful DOM elements:
const container = document.getElementById("sigma-container") as HTMLElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;
const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');

const minYearInput = document.getElementById("min-year") as HTMLInputElement;
const maxYearInput = document.getElementById("max-year") as HTMLInputElement;
const minYear = parseFloat(minYearInput.value)
const maxYear = parseFloat(maxYearInput.value)

async function loadGraphDataAndPopulateSuggestions() {
  const response = await fetch('data.json');
  const graphData = await response.json();
  
  // Assume graph is an instance of your graph library initialized elsewhere
  graph.import(graphData); // Load your graph data into the graph instance
  
  // Now that the data is loaded, populate the datalist
  searchSuggestions.innerHTML = graph.nodes().map(node => {
    const label = graph.getNodeAttribute(node, "label");
    return `<option value="${label}"></option>`;
  }).join("\n");
}

// Call the function to load data and populate suggestions
loadGraphDataAndPopulateSuggestions();
const renderer = new Sigma(graph, container);

// configure renderer settings
renderer.setSetting("labelRenderedSizeThreshold", 5)

// Type and declare internal state:
interface State {
  hoveredNode?: string;
  searchQuery: string;

  // State derived from query:
  selectedNode?: string;
  selectedNeighbors?: Set<string>;
  suggestions?: Set<string>;

  // State derived from hovered node:
  hoveredNeighbors?: Set<string>;

  // State derived from language selection:
  selectedLanguages: Set<string>;

  // State derived from range slider:
  minYear: number;
  maxYear: number;
}

const languageOptions = new Set<string>();
checkboxes.forEach((checkbox) => {
  if (checkbox.checked) {
    languageOptions.add(checkbox.value);
  }
});

// Declare application state
const state: State = { searchQuery: "",
  selectedLanguages: languageOptions,
  minYear: minYear,
  maxYear: maxYear };

// Actions:
function setSearchQuery(query: string) {
  state.searchQuery = query;

  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") as string }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    // If we have a single perfect match, them we remove the suggestions, and
    // we consider the user has selected a node through the datalist
    // autocomplete:
    if (suggestions.length === 1 && suggestions[0].label === query) {
      state.selectedNode = suggestions[0].id;
      state.selectedNeighbors = new Set(graph.neighbors(state.selectedNode))
      state.suggestions = undefined;

      // Move the camera to center it on the selected node:
      const nodePosition = renderer.getNodeDisplayData(state.selectedNode) as Coordinates;
      renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    }
    // Else, we display the suggestions list:
    else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  }
  // If the query is empty, then we reset the selectedNode / suggestions state:
  else {
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

// Function to handle input changes for both min and max year inputs
function handleYearInputChange(event: Event) {
  // Get the target input element that triggered the event
  const targetInput = event.target as HTMLInputElement;

  // Parse the input value as a number
  const yearValue = parseFloat(targetInput.value);

  // Update the appropriate state variable based on the input element's id
  if (targetInput.id === "min-year") {
    // Update min year state variable
    state.minYear = yearValue;
  } else if (targetInput.id === "max-year") {
    // Update max year state variable
    state.maxYear = yearValue;
  }
}

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
  renderer.refresh()
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
      // If "Deselect All" is clicked, remove all languages from selectedLanguages
      state.selectedLanguages.delete(language);
    }
  });
renderer.refresh()
}

// Function to check if any neighbor of a node has a language attribute present in the given set
function hasNeighborWithLanguages(graph: Graph, nodeKey: string, languages = state.selectedLanguages): boolean {
  return graph.someNeighbor(nodeKey, (neighbor: string, attributes: Attributes) => {
    return languages.has(attributes.author_lang);
  });
}

// Attach event listeners to handle input changes for both min and max year inputs
minYearInput.addEventListener("input", handleYearInputChange);
maxYearInput.addEventListener("input", handleYearInputChange);

// Attach event listeners to checkboxes
// const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", handleCheckboxChange);
});

// Attach event listeners to "Select All" and "Deselect All" buttons
const selectAllButton = document.getElementById("select-all") as HTMLButtonElement;
const deselectAllButton = document.getElementById("deselect-all") as HTMLButtonElement;

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
})


renderer.setSetting("nodeReducer", (node, data) => {
  const res: Partial<NodeDisplayData> = { ...data };

  // is the node hovered or neighbors a hovered node
  if (state.hoveredNeighbors && !state.hoveredNeighbors.has(node) && state.hoveredNode !== node) {
    res.label = "";
    res.color = "#f6f6f6";
  
    // highlight is the node selected (by clicking or search)
  } else if (state.selectedNode === node) {
    res.highlighted = true;

    // grey if the node is in the selectedNeighbors set    
  } else if (state.selectedNeighbors && !state.selectedNeighbors.has(node)) {
    res.label = "";
    res.color = "#f6f6f6";

    // grey if the node's activity is outside the selected timerange
  } else if (data.activity_end < state.minYear || data.activity_start > state.maxYear) {
    res.label = "";
    res.color = "#f6f6f6";

    // grey if the suggestion box is open and the node is not suggested
  } else if (state.suggestions && !state.suggestions.has(node)) {
    res.label = "";
    res.color = "#f6f6f6";

    // grey if the node is filtered out with language selection box
  } else if (data.author_lang !== 'tlk' && !state.selectedLanguages.has(data.author_lang)) {
    res.label = "";
    res.color = "#f6f6f6";
  
    // grey out translators who are not connected to authors of filtered languages
  } else if (data.author_lang === 'tlk' && !hasNeighborWithLanguages(graph, node, state.selectedLanguages)) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  return res;
});


renderer.setSetting("edgeReducer", (edge, data) => {
  const res: Partial<EdgeDisplayData> = { ...data };

  // hide edge if nodes are not hovered
  if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
    res.hidden = true;
  }

  // hide edge if nodes are not selected
  else if (state.selectedNode && !graph.hasExtremity(edge, state.selectedNode)) {
    res.hidden = true;
  }

  // grey if the node's activity is outside the selected timerange
  else if (data.activity_end < state.minYear || data.activity_start > state.maxYear) {
    res.hidden = true
  }

  // hide edge if nodes are not suggested
  else if (state.suggestions && (!state.suggestions.has(graph.source(edge)) || !state.suggestions.has(graph.target(edge)))) {
    res.hidden = true;
  }

  // hide edge if nodes are not in selected languages
  else {
    const sourceNodeLanguage = graph.getNodeAttribute(graph.source(edge), "author_lang");
    const targetNodeLanguage = graph.getNodeAttribute(graph.target(edge), "author_lang");
    
    // Check if either the source or target node's language is in selectedLanguages
    if (
      !state.selectedLanguages.has(sourceNodeLanguage) &&
      !state.selectedLanguages.has(targetNodeLanguage)
    ) {
      res.hidden = true;
    }
  }

  return res;
});


document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      console.log("clicked button")
      const panels = document.querySelectorAll('.small-panel');
      panels.forEach((panel) => {
        // Toggle a class that controls visibility
        panel.classList.toggle('is-visible');
      });
    });
  }
});
