// This variable will hold the default content from #browserContainer.
let defaultContent = "";

// When the DOM is loaded, capture the default content and set up the search input.
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("browserContainer");
  // Capture the default content (the code you originally had in the container)
  defaultContent = container.innerHTML;
  
  const input = document.querySelector(".input");
  input.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      handleInput();
    }
  });
});

// --- URL Normalization & Display Functions ---

// normalizeURL: If the user enters nothing or "asphalt://newtab", return a special marker ("default")
// Otherwise, if the input is a valid URL, return it; if not, treat it as a search query.
function normalizeURL(url) {
  if (!url || url.trim() === "" || url.toLowerCase() === "asphalt://newtab") {
    return "default"; // marker for default content
  }
  try {
    new URL(url);
    return url;
  } catch (e) { }
  return "https://google.com/search?q=" + encodeURIComponent(url);
}

// displayURL: When showing the URL in the search bar, hide the internal default.
function displayURL(url) {
  if (url === "default") {
    return "asphalt://newtab";
  }
  return url;
}

// --- Provided formatSearch Function ---
function formatSearch(query) {
  try {
    return new URL(query).toString();
  } catch (e) { }
  try {
    const url = new URL(`http://${query}`);
    if (url.hostname.includes('.')) return url.toString();
  } catch (e) { }
  return new URL(`https://google.com/search?q=${query}`).toString();
}

// --- Navigation Functions ---

// handleInput:
// - Reads the input from the search bar.
// - If the input is empty or "asphalt://newtab", restores the default content.
// - Otherwise, it formats the query and builds the final URL using your UV config,
//   then calls navigate(finalUrl).
function handleInput() {
  const input = document.querySelector(".input");
  let query = input.value.trim();
  
  if (query === "" || query.toLowerCase() === "asphalt://newtab") {
    // Restore default content
    document.getElementById("browserContainer").innerHTML = defaultContent;
    input.value = "asphalt://newtab";
    return;
  }
  
  const formatted = formatSearch(query);
  // Build the final URL using the UV config.
  const finalUrl = "https://asphalt-nine.vercel.app/" + __uv$config.prefix + __uv$config.encodeUrl(formatted);
  navigate(finalUrl);
}

// navigate:
// - Uses fetch() to load the HTML content from the provided URL.
// - On success, it replaces the innerHTML of #browserContainer with the fetched HTML
//   and updates the search input with the displayed URL.
function navigate(url) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    })
    .then(html => {
      document.getElementById("browserContainer").innerHTML = html;
      document.querySelector(".input").value = displayURL(url);
    })
    .catch(error => {
      console.error("Error loading page:", error);
      document.getElementById("browserContainer").innerHTML = "<p>Error loading page.</p>";
    });
}
