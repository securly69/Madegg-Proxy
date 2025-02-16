// Each tab will hold an embed element plus its own history.
let tabs = [];
let activeTab = null;

// Normalize user input URL:
// – If empty, default to browser.html (displayed as asphalt://newtab)
// – If not starting with http(s) or asphalt:// then assume a search query (Google used here)
// – If input is "asphalt://newtab", map to browser.html.
function normalizeURL(url) {
  if (!url || url.trim() === "") {
    return "browser.html";
  }
  if (!/^https?:\/\//i.test(url) && !/^asphalt:\/\//i.test(url)) {
    return "https://www.google.com/search?q=" + encodeURIComponent(url);
  }
  if (url.toLowerCase() === "asphalt://newtab") {
    return "browser.html";
  }
  return url;
}

// When displaying the URL in the address bar, convert "browser.html" to "asphalt://newtab"
function displayURL(url) {
  return (url === "browser.html") ? "asphalt://newtab" : url;
}

// Create a new tab with an embed element.
function createTab(url = "browser.html") {
  const normalizedUrl = normalizeURL(url);
  const tabId = "tab-" + Date.now();
  
  // Create the tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  // Default icon element.
  const iconElem = document.createElement("i");
  iconElem.className = "fa fa-globe";
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
  
  // Clicking the tab switches to it.
  tabElem.onclick = () => switchTab(tabId);
  
  // Insert the tab element before the new-tab button.
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);
  
  // Create the embed element.
  const embedElem = document.createElement("embed");
  embedElem.src = normalizedUrl;
  embedElem.type = "text/html";
  embedElem.id = "embed-" + tabId;
  embedElem.style.display = "none";
  
  // Set up a simple per‑tab history.
  const tabHistory = [normalizedUrl];
  let historyIndex = 0;
  
  // When the embed loads, try to update the title and favicon.
  // (Due to cross-origin restrictions this may not always work.)
  embedElem.addEventListener("load", function() {
    try {
      // Attempt to get the loaded document.
      const doc = embedElem.getSVGDocument ? embedElem.getSVGDocument() : embedElem.contentDocument;
      let title = doc ? doc.title : "New Tab";
      if (!title || title.trim() === "") title = "New Tab";
      titleSpan.innerText = title;
      
      // Attempt to update the icon from a favicon link.
      let faviconLink = doc ? doc.querySelector("link[rel*='icon']") : null;
      if (faviconLink && faviconLink.href) {
        iconElem.className = "";
        iconElem.style.backgroundImage = `url(${faviconLink.href})`;
        iconElem.style.width = "16px";
        iconElem.style.height = "16px";
        iconElem.style.backgroundSize = "16px 16px";
        iconElem.style.display = "inline-block";
      }
    } catch (e) {
      console.log("Unable to update tab title or favicon:", e);
    }
    if (activeTab && activeTab.id === tabId) {
      document.getElementById("url-input").value = displayURL(embedElem.src);
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

// Navigate to a new URL in the active tab and update its history.
function navigate(url) {
  if (!activeTab) return;
  const normalizedUrl = normalizeURL(url);
  // Update history: drop any "forward" history then push new URL.
  activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
  activeTab.history.push(normalizedUrl);
  activeTab.historyIndex++;
  activeTab.embedElem.src = normalizedUrl;
  document.getElementById("url-input").value = displayURL(normalizedUrl);
}

// Back/forward/reload functions using tab history.
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

// Set up event listeners for navigation controls.
document.getElementById("back-btn").addEventListener("click", goBack);
document.getElementById("forward-btn").addEventListener("click", goForward);
document.getElementById("reload-btn").addEventListener("click", reloadPage);
document.getElementById("go-btn").addEventListener("click", function() {
  const url = document.getElementById("url-input").value;
  navigate(url);
});
document.getElementById("url-input").addEventListener("keyup", function(e) {
  if (e.key === "Enter") {
    navigate(document.getElementById("url-input").value);
  }
});
document.getElementById("new-tab-button").addEventListener("click", function() {
  createTab("browser.html");
});

// Create the initial tab on load.
createTab("browser.html");
