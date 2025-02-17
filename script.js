// Each tab will hold an embed element plus its own history.
let tabs = [];
let activeTab = null;

// Normalize input URL:
//  - If empty, default to the new tab page ("browser.html")
//  - If not starting with "http://" or "https://" or "asphalt://", treat as search query (Google)
//  - "asphalt://newtab" maps to browser.html
function normalizeURL(url) {
  url = url.trim();
  if (!url) return "browser.html";
  if (url.toLowerCase() === "asphalt://newtab") return "browser.html";
  if (!/^https?:\/\//i.test(url) && !/^asphalt:\/\//i.test(url)) {
    // Treat input as a search query.
    return "https://www.google.com/search?q=" + encodeURIComponent(url);
  }
  return url;
}

// When displaying URL in the address bar, convert "browser.html" to "asphalt://newtab"
function displayURL(url) {
  return (url === "browser.html") ? "asphalt://newtab" : url;
}

// If __uv$config exists, encode URL using the proxy.
function encodeURL(url) {
  if (typeof __uv$config !== "undefined") {
    return __uv$config.prefix + __uv$config.encodeUrl(url);
  }
  return url;
}

// Create a new tab with an embed element.
function createTab(url = "browser.html") {
  const normalizedUrl = normalizeURL(url);
  const encodedUrl = encodeURL(normalizedUrl);
  const tabId = "tab-" + Date.now();
  
  // Create the tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  // Use a different default icon (e.g. window icon).
  const iconElem = document.createElement("i");
  iconElem.className = "fa-solid fa-window-maximize";
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
  
  // Switch to this tab on click.
  tabElem.onclick = () => switchTab(tabId);
  
  // Insert the new tab before the new-tab button.
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);
  
  // Create the embed element.
  const embedElem = document.createElement("embed");
  embedElem.src = encodedUrl;
  embedElem.type = "text/html";
  embedElem.id = "embed-" + tabId;
  embedElem.style.display = "none";
  
  // Set up per‑tab history.
  const tabHistory = [encodedUrl];
  let historyIndex = 0;
  
  // When the embed loads, attempt to update the tab title and icon.
  embedElem.addEventListener("load", function() {
    try {
      // Accessing the embed's content may be blocked by cross-origin restrictions.
      const doc = embedElem.getSVGDocument ? embedElem.getSVGDocument() : embedElem.contentDocument;
      let title = doc ? doc.title : "New Tab";
      titleSpan.innerText = title || "New Tab";
      
      // Try to update the icon from a favicon link if available.
      const favicon = doc ? doc.querySelector("link[rel*='icon']") : null;
      if (favicon && favicon.href) {
        iconElem.className = "";
        iconElem.style.backgroundImage = `url(${favicon.href})`;
        iconElem.style.width = "16px";
        iconElem.style.height = "16px";
        iconElem.style.backgroundSize = "16px 16px";
        iconElem.style.display = "inline-block";
      }
    } catch (e) {
      console.log("Unable to update tab title or favicon:", e);
    }
    if (activeTab && activeTab.id === tabId) {
      document.getElementById("url-input").value = displayURL(normalizedUrl);
    }
  });
  
  document.getElementById("browserContainer").appendChild(embedElem);
  
  const tabObject = { 
    id: tabId, 
    tabElem, 
    embedElem, 
    history: tabHistory, 
    historyIndex: historyIndex 
  };
  tabs.push(tabObject);
  switchTab(tabId);
}

// Switch the active tab.
function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.embedElem.style.display = "block";
      tab.tabElem.classList.add("active");
      activeTab = tab;
      // Update the URL bar.
      // (Reconvert from proxied URL if needed.)
      document.getElementById("url-input").value = displayURL(tab.embedElem.src);
    } else {
      tab.embedElem.style.display = "none";
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
    tab.embedElem.parentNode.removeChild(tab.embedElem);
    tabs.splice(index, 1);
    if (activeTab.id === tabId) {
      if (tabs.length > 0) {
        switchTab(tabs[0].id);
      } else {
        activeTab = null;
        document.getElementById("url-input").value = "";
      }
    }
  }
}

// Navigate in the active tab using the outer search bar.
function navigate(url) {
  if (!activeTab) return;
  const normalizedUrl = normalizeURL(url);
  const encodedUrl = encodeURL(normalizedUrl);
  // Update history (drop any forward history).
  activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
  activeTab.history.push(encodedUrl);
  activeTab.historyIndex++;
  activeTab.embedElem.src = encodedUrl;
  document.getElementById("url-input").value = displayURL(normalizedUrl);
}

// Back, forward, reload functions.
function goBack() {
  if (!activeTab) return;
  if (activeTab.historyIndex > 0) {
    activeTab.historyIndex--;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.embedElem.src = url;
    document.getElementById("url-input").value = displayURL(url);
  }
}
function goForward() {
  if (!activeTab) return;
  if (activeTab.historyIndex < activeTab.history.length - 1) {
    activeTab.historyIndex++;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.embedElem.src = url;
    document.getElementById("url-input").value = displayURL(url);
  }
}
function reloadPage() {
  if (!activeTab) return;
  activeTab.embedElem.src = activeTab.embedElem.src;
}

// Event listeners for navigation controls.
document.getElementById("back-btn").addEventListener("click", goBack);
document.getElementById("forward-btn").addEventListener("click", goForward);
document.getElementById("reload-btn").addEventListener("click", reloadPage);
document.getElementById("go-btn").addEventListener("click", function() {
  navigate(document.getElementById("url-input").value);
});
document.getElementById("url-input").addEventListener("keyup", function(e) {
  if (e.key === "Enter") {
    navigate(document.getElementById("url-input").value);
  }
});
document.getElementById("new-tab-button").addEventListener("click", function() {
  createTab("browser.html");
});

// Create the initial tab on page load.
createTab("browser.html");
