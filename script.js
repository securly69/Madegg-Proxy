// Global variables for tab management.
let tabs = [];
let activeTab = null;

/**
 * normalizeURL:
 *  - If empty or "asphalt://newtab", returns "browser.html" (the default proxy page).
 *  - Otherwise, if the text isn’t a valid URL, treats it as a search query.
 */
function normalizeURL(url) {
  if (!url || url.trim() === "" || url.toLowerCase() === "asphalt://newtab") {
    return "browser.html";
  }
  try {
    new URL(url);
    return url;
  } catch (e) {
    // Not a valid URL, so treat as search query.
  }
  return "https://google.com/search?q=" + encodeURIComponent(url);
}

/**
 * displayURL:
 *  - Converts internal URLs to the user-friendly version.
 *  - If the internal URL is the default proxy ("browser.html" or ending with "/browser.html"),
 *    shows "asphalt://newtab" instead.
 */
function displayURL(url) {
  if (url === "browser.html" || url.endsWith("/browser.html")) {
    return "asphalt://newtab";
  }
  return url;
}

/**
 * createTab:
 *  - Creates a new tab using an iframe.
 *  - The default parameter "asphalt://newtab" maps to the default page.
 */
function createTab(url = "asphalt://newtab") {
  const normalizedUrl = normalizeURL(url);
  const tabId = "tab-" + Date.now();

  // Create tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;

  // Use a star icon (change if desired).
  const iconElem = document.createElement("i");
  iconElem.className = "fa fa-star";
  tabElem.appendChild(iconElem);

  // Title element.
  const titleSpan = document.createElement("span");
  titleSpan.className = "tab-title";
  titleSpan.innerText = "New Tab";
  tabElem.appendChild(titleSpan);

  // Close button.
  const closeBtn = document.createElement("span");
  closeBtn.className = "close-tab";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    closeTab(tabId);
  };
  tabElem.appendChild(closeBtn);

  // Switch to this tab when clicked.
  tabElem.onclick = () => switchTab(tabId);

  // Insert tab element before the New Tab button.
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);

  // Create the iframe.
  const iframe = document.createElement("iframe");
  iframe.src = normalizedUrl;
  iframe.id = "iframe-" + tabId;
  iframe.style.opacity = 0;
  iframe.onload = function() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      let title = doc.title || "New Tab";
      titleSpan.innerText = title;
      // Update icon with favicon if available.
      const faviconLink = doc.querySelector("link[rel*='icon']");
      if (faviconLink && faviconLink.href) {
        iconElem.className = "";
        iconElem.style.backgroundImage = `url(${faviconLink.href})`;
        iconElem.style.width = "16px";
        iconElem.style.height = "16px";
        iconElem.style.backgroundSize = "16px 16px";
        iconElem.style.display = "inline-block";
      }
    } catch (e) {
      console.log("Error updating tab title or favicon:", e);
    }
    if (activeTab && activeTab.id === tabId) {
      document.querySelector(".input").value = displayURL(iframe.src);
      iframe.style.opacity = 1;
    }
  };

  // Position the iframe absolutely.
  iframe.style.position = "absolute";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100%";
  iframe.style.height = "100%";

  document.getElementById("browserContainer").appendChild(iframe);

  // Set up per-tab history.
  const tabHistory = [normalizedUrl];
  let historyIndex = 0;

  const tabObject = {
    id: tabId,
    tabElem: tabElem,
    iframe: iframe,
    history: tabHistory,
    historyIndex: historyIndex
  };

  tabs.push(tabObject);
  switchTab(tabId);
}

/**
 * switchTab:
 *  - Displays the iframe of the selected tab and updates the search input.
 */
function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.iframe.style.display = "block";
      tab.tabElem.classList.add("active");
      activeTab = tab;
      document.querySelector(".input").value = displayURL(tab.iframe.src);
    } else {
      tab.iframe.style.display = "none";
      tab.tabElem.classList.remove("active");
    }
  });
}

/**
 * closeTab:
 *  - Removes a tab and its iframe.
 */
function closeTab(tabId) {
  const index = tabs.findIndex(tab => tab.id === tabId);
  if (index !== -1) {
    const tab = tabs[index];
    tab.tabElem.parentNode.removeChild(tab.tabElem);
    tab.iframe.parentNode.removeChild(tab.iframe);
    tabs.splice(index, 1);
    if (activeTab.id === tabId) {
      if (tabs.length > 0) {
        switchTab(tabs[0].id);
      } else {
        activeTab = null;
        document.querySelector(".input").value = "";
      }
    }
  }
}

/**
 * navigate:
 *  - Changes the active tab’s iframe src and updates its history.
 */
function navigate(url) {
  if (!activeTab) return;
  const normalizedUrl = normalizeURL(url);
  activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
  activeTab.history.push(normalizedUrl);
  activeTab.historyIndex++;
  activeTab.iframe.src = normalizedUrl;
  document.querySelector(".input").value = displayURL(normalizedUrl);
}

/**
 * Navigation commands.
 */
function goBack() {
  if (!activeTab) return;
  if (activeTab.historyIndex > 0) {
    activeTab.historyIndex--;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.iframe.src = url;
    document.querySelector(".input").value = displayURL(url);
  }
}
function goForward() {
  if (!activeTab) return;
  if (activeTab.historyIndex < activeTab.history.length - 1) {
    activeTab.historyIndex++;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.iframe.src = url;
    document.querySelector(".input").value = displayURL(url);
  }
}
function reloadPage() {
  if (!activeTab) return;
  activeTab.iframe.src = activeTab.iframe.src;
}

/**
 * Set up event listeners after DOM content is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  // New Tab button.
  document.getElementById("new-tab-button").addEventListener("click", () => {
    createTab("asphalt://newtab");
  });
  // Navigation buttons.
  document.getElementById("back-btn").addEventListener("click", goBack);
  document.getElementById("forward-btn").addEventListener("click", goForward);
  document.getElementById("reload-btn").addEventListener("click", reloadPage);
  
  // Set up search input and Go button.
  const input = document.querySelector(".input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleInput();
    }
  });
  document.querySelector(".go-btn").addEventListener("click", handleInput);
});

/**
 * handleInput:
 *  - Uses your provided formatSearch code.
 *  - Instead of redirecting the whole window, constructs a URL by joining
 *    "https://asphalt-nine.vercel.app/" with __uv$config.prefix and __uv$config.encodeUrl(query),
 *    then calls navigate() on that URL.
 */
function handleInput() {
  const input = document.querySelector(".input");
  let query = input.value.trim();
  if (query === "") {
    query = "asphalt://newtab";
  }
  // Use the provided formatSearch function.
  const formatted = formatSearch(query);
  let finalUrl;
  // If the query is the default, load the internal default page.
  if (query.toLowerCase() === "asphalt://newtab" || formatted === "browser.html") {
    finalUrl = "browser.html";
  } else {
    // Build the final URL from the UV config.
    finalUrl = "https://asphalt-nine.vercel.app/" + __uv$config.prefix + __uv$config.encodeUrl(formatted);
  }
  navigate(finalUrl);
}

/**
 * formatSearch:
 *  - Converts an input into a URL; if it isn’t a URL, turns it into a Google search.
 */
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

function Redir(url) {
  window.location.href = url;
}

// Create the initial tab.
createTab("asphalt://newtab");
