// Global variables for tab management.
let tabs = [];
let activeTab = null;

// Normalize URL input:
// • Empty or "asphalt://newtab" maps to "browser.html" (default page).
// • Non-URL text is treated as a search query (using Google).
function normalizeURL(url) {
  if (!url || url.trim() === "") {
    return "browser.html";
  }
  if (url.toLowerCase() === "asphalt://newtab") {
    return "browser.html";
  }
  if (!/^https?:\/\//i.test(url) && !/^asphalt:\/\//i.test(url)) {
    return "https://www.google.com/search?q=" + encodeURIComponent(url);
  }
  return url;
}

// Convert internal URL to display version.
function displayURL(url) {
  return url === "browser.html" ? "asphalt://newtab" : url;
}

// Create a new tab using an iframe.
// The default parameter "asphalt://newtab" will show the default page.
function createTab(url = "asphalt://newtab") {
  const normalizedUrl = normalizeURL(url);
  const tabId = "tab-" + Date.now();
  
  // Create the tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  // Use a star icon (change to any Font Awesome icon if desired).
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
  
  // Switch to tab when clicked.
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

// Switch active tab.
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

// Close a tab.
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

// Navigate in the active tab and update history.
function navigate(url) {
  if (!activeTab) return;
  const normalizedUrl = normalizeURL(url);
  activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
  activeTab.history.push(normalizedUrl);
  activeTab.historyIndex++;
  activeTab.iframe.src = normalizedUrl;
  document.querySelector(".input").value = displayURL(normalizedUrl);
}

// Navigation commands.
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

// Set up event listeners when the DOM is ready.
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
  input.addEventListener("keydown", handleInput);
  document.querySelector(".go-btn").addEventListener("click", () => {
    handleInput({ key: 'Enter' });
  });
  
  function handleInput(e) {
    if (e.key !== 'Enter') return;
    let query = input.value;
    if (query.trim() === "") {
      query = "asphalt://newtab";
    }
    // Use the provided formatSearch function.
    query = formatSearch(query);
    let finalUrl = query;
    if (typeof __uv$config !== "undefined") {
      finalUrl = __uv$config.prefix + __uv$config.encodeUrl(query);
    }
    navigate(finalUrl);
  }
});

// Provided formatSearch function.
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
