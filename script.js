// Global array for tabs and a variable for the active tab.
let tabs = [];
let activeTab = null;

/**
 * handleInput:
 *  - Grabs the search input.
 *  - If the query is empty or "asphalt://newtab" (case‑insensitive), it sets finalUrl to the default page ("browser.html").
 *  - Otherwise, it uses your provided formatSearch function to build the query.
 *  - Then it constructs the final URL by joining the base ("https://asphalt-nine.vercel.app/") with __uv$config.prefix and __uv$config.encodeUrl(formatted).
 *  - Finally, it calls navigate(finalUrl).
 */
function handleInput() {
  const input = document.querySelector(".input");
  let query = input.value.trim();
  let finalUrl;
  if (query.toLowerCase() === "asphalt://newtab" || query === "") {
    finalUrl = "browser.html";
  } else {
    // Use formatSearch to process the query.
    const formatted = formatSearch(query);
    // Build the final URL using the UV configuration.
    finalUrl = "https://asphalt-nine.vercel.app/" + __uv$config.prefix + __uv$config.encodeUrl(formatted);
  }
  navigate(finalUrl);
}

/**
 * navigate:
 *  - If no active tab exists, it creates one.
 *  - Otherwise, it updates the active tab's history and sets its iframe src to the given URL.
 *  - It also updates the search input to display the user-friendly version of the URL.
 */
function navigate(url) {
  if (!activeTab) {
    createTab(url);
    return;
  }
  activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
  activeTab.history.push(url);
  activeTab.historyIndex++;
  activeTab.iframe.src = url;
  document.querySelector(".input").value = displayURL(url);
}

/**
 * displayURL:
 *  - If the URL is the internal default page, returns "asphalt://newtab" so that it isn’t revealed.
 */
function displayURL(url) {
  if (url === "browser.html" || url.endsWith("/browser.html")) {
    return "asphalt://newtab";
  }
  return url;
}

/**
 * createTab:
 *  - Creates a new tab with an iframe.
 *  - The default parameter "asphalt://newtab" maps to the internal default ("browser.html").
 */
function createTab(url = "asphalt://newtab") {
  const finalUrl = (url.toLowerCase() === "asphalt://newtab") ? "browser.html" : url;
  const tabId = "tab-" + Date.now();

  // Create the tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;

  // Use a star icon (change if desired).
  const iconElem = document.createElement("i");
  iconElem.className = "fa fa-star";
  tabElem.appendChild(iconElem);

  // Tab title.
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

  // Switch to this tab on click.
  tabElem.onclick = () => switchTab(tabId);

  // Insert the tab element before the New Tab button.
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);

  // Create the iframe.
  const iframe = document.createElement("iframe");
  iframe.src = finalUrl;
  iframe.id = "iframe-" + tabId;
  iframe.style.opacity = 0;
  iframe.onload = function() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      let title = doc.title || "New Tab";
      titleSpan.innerText = title;
      // Update icon using the page's favicon if available.
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

  // Set up per‑tab history.
  const tabHistory = [finalUrl];
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
  // Search input and Go button.
  const input = document.querySelector(".input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleInput();
    }
  });
  document.querySelector(".go-btn").addEventListener("click", handleInput);
});

/**
 * formatSearch:
 *  - Converts the input into a URL. If it isn’t a valid URL, it returns a Google search URL.
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
