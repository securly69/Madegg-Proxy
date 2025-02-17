// Store tab objects; each tab will have its own history.
let tabs = [];
let activeTab = null;

// Normalize the user input URL:
// • If empty, default to browser.html (displayed as asphalt://newtab)
// • If it doesn’t start with "http(s)://" or "asphalt://", treat it as a search query (Google)
// • If the input is "asphalt://newtab", map to browser.html.
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

// When displaying the URL in the address bar, convert "browser.html" to "asphalt://newtab".
function displayURL(url) {
  return url === "browser.html" ? "asphalt://newtab" : url;
}

// Create a new tab using an iframe.
function createTab(url = "browser.html") {
  const normalizedUrl = normalizeURL(url);
  const tabId = "tab-" + Date.now();
  
  // Create the tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  // Default icon.
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
  
  // Switch to this tab when clicked.
  tabElem.onclick = () => switchTab(tabId);
  
  // Insert the tab element before the new-tab button.
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);
  
  // Create the iframe.
  const iframe = document.createElement("iframe");
  iframe.src = normalizedUrl;
  iframe.id = "iframe-" + tabId;
  // Start hidden (we’ll show it when this tab becomes active)
  iframe.style.opacity = 0;
  iframe.onload = function() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      let title = doc.title || "New Tab";
      titleSpan.innerText = title;
      // Attempt to update the icon from a favicon, if available.
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
      document.getElementById("url-input").value = displayURL(iframe.src);
      iframe.style.opacity = 1;
    }
  };
  
  // Position the iframe absolutely within the container.
  iframe.style.position = "absolute";
  iframe.style.top = 0;
  iframe.style.left = 0;
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  
  document.getElementById("browserContainer").appendChild(iframe);
  
  // Set up a per‑tab history.
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

// Switch the active tab.
function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.iframe.style.display = "block";
      tab.tabElem.classList.add("active");
      activeTab = tab;
      document.getElementById("url-input").value = displayURL(tab.iframe.src);
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
        document.getElementById("url-input").value = "";
      }
    }
  }
}

// Navigate to a new URL in the active tab and update its history.
function navigate(url) {
  if (!activeTab) return;
  const normalizedUrl = normalizeURL(url);
  activeTab.history = activeTab.history.slice(0, activeTab.historyIndex + 1);
  activeTab.history.push(normalizedUrl);
  activeTab.historyIndex++;
  activeTab.iframe.src = normalizedUrl;
  document.getElementById("url-input").value = displayURL(normalizedUrl);
}

// Back, forward, and reload functions using the per‑tab history.
function goBack() {
  if (!activeTab) return;
  if (activeTab.historyIndex > 0) {
    activeTab.historyIndex--;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.iframe.src = url;
    document.getElementById("url-input").value = displayURL(url);
  }
}
function goForward() {
  if (!activeTab) return;
  if (activeTab.historyIndex < activeTab.history.length - 1) {
    activeTab.historyIndex++;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.iframe.src = url;
    document.getElementById("url-input").value = displayURL(url);
  }
}
function reloadPage() {
  if (!activeTab) return;
  activeTab.iframe.src = activeTab.iframe.src;
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

// Create the initial tab on page load.
createTab("browser.html");
