// Global tab management
let tabs = [];
let activeTab = null;

// If the user enters nothing or "asphalt://newtab", map it to the internal default.
function normalizeURL(url) {
  if (!url || url.trim() === "" || url.toLowerCase() === "asphalt://newtab") {
    return "browser.html";
  }
  try {
    new URL(url);
    return url;
  } catch (e) { }
  return "https://google.com/search?q=" + encodeURIComponent(url);
}

// When displaying the URL in the search bar, hide the internal default.
function displayURL(url) {
  if (url === "browser.html" || url.endsWith("/browser.html")) {
    return "asphalt://newtab";
  }
  return url;
}

// Create a new tab. If the passed URL is "asphalt://newtab", use the default.
function createTab(url = "asphalt://newtab") {
  const finalUrl = (url.toLowerCase() === "asphalt://newtab") ? "browser.html" : url;
  const tabId = "tab-" + Date.now();
  
  // Create tab element.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  // Use a star icon.
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
  
  // When clicked, switch to this tab.
  tabElem.onclick = () => switchTab(tabId);
  
  // Insert before the New Tab button.
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);
  
  // Create iframe.
  const iframe = document.createElement("iframe");
  iframe.src = finalUrl;
  iframe.id = "iframe-" + tabId;
  iframe.style.opacity = 0;
  iframe.onload = function() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      let title = doc.title || "New Tab";
      titleSpan.innerText = title;
      // Try to update icon with favicon.
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

// Switch the active tab.
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

// Navigate in the active tab (or create one if none exists).
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

// Set up event listeners after DOM content is loaded.
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById("new-tab-button").addEventListener("click", () => {
    createTab("asphalt://newtab");
  });
  document.getElementById("back-btn").addEventListener("click", goBack);
  document.getElementById("forward-btn").addEventListener("click", goForward);
  document.getElementById("reload-btn").addEventListener("click", reloadPage);
  
  // Use your provided search container code.
  const input = document.querySelector(".input");
  input.addEventListener("keydown", handleInput);
});

// The search code you provided (modified to update the iframe rather than redirect)
function handleInput(e) {
  if (e.key !== 'Enter') return;
  const input = document.querySelector(".input");
  // Run the formatSearch function on the current input value.
  const query = formatSearch(input.value);
  let finalUrl;
  // If the query (after formatting) is the default, use the internal default.
  if (query.toLowerCase() === "asphalt://newtab" || query === "browser.html") {
    finalUrl = "browser.html";
  } else {
    // Join the base with the UV config.
    finalUrl = "https://asphalt-nine.vercel.app/" + __uv$config.prefix + __uv$config.encodeUrl(query);
  }
  navigate(finalUrl);
}

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
