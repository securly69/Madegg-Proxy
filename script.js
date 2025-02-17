let tabs = [];
let activeTab = null;

function normalizeURL(url) {
  url = url.trim();
  if (!url) return "browser.html";
  if (url.toLowerCase() === "asphalt://newtab") return "browser.html";
  if (!/^https?:\/\//i.test(url) && !/^asphalt:\/\//i.test(url)) {
    return "https://www.google.com/search?q=" + encodeURIComponent(url);
  }
  return url;
}

function displayURL(url) {
  return (url === "browser.html") ? "asphalt://newtab" : url;
}

function encodeURL(url) {
  if (typeof __uv$config !== "undefined") {
    return __uv$config.prefix + __uv$config.encodeUrl(url);
  }
  return url;
}

function createTab(url = "browser.html") {
  const normalizedUrl = normalizeURL(url);
  const encodedUrl = encodeURL(normalizedUrl);
  const tabId = "tab-" + Date.now();
  
  // Create the tab button.
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  const iconElem = document.createElement("i");
  iconElem.className = "fa-solid fa-window-maximize";
  tabElem.appendChild(iconElem);
  
  const titleSpan = document.createElement("span");
  titleSpan.className = "tab-title";
  titleSpan.innerText = "New Tab";
  tabElem.appendChild(titleSpan);
  
  const closeBtn = document.createElement("span");
  closeBtn.className = "close-tab";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    closeTab(tabId);
  };
  tabElem.appendChild(closeBtn);
  
  tabElem.onclick = () => switchTab(tabId);
  
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);
  
  // Create the iframe.
  const iframeElem = document.createElement("iframe");
  iframeElem.src = encodedUrl;
  iframeElem.id = "iframe-" + tabId;
  iframeElem.style.display = "none"; // Only active tab is shown
  
  // Per-tab history.
  const tabHistory = [encodedUrl];
  let historyIndex = 0;
  
  iframeElem.addEventListener("load", function() {
    try {
      const doc = iframeElem.contentDocument;
      let title = doc ? doc.title : "New Tab";
      titleSpan.innerText = title || "New Tab";
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
  
  document.getElementById("browserContainer").appendChild(iframeElem);
  
  const tabObject = { 
    id: tabId, 
    tabElem: tabElem, 
    iframeElem: iframeElem, 
    history: tabHistory, 
    historyIndex: historyIndex 
  };
  tabs.push(tabObject);
  switchTab(tabId);
}

function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.iframeElem.style.display = "block";
      tab.tabElem.classList.add("active");
      activeTab = tab;
      document.getElementById("url-input").value = displayURL(tab.iframeElem.src);
    } else {
      tab.iframeElem.style.display = "none";
      tab.tabElem.classList.remove("active");
    }
  });
}

function closeTab(tabId) {
  const index = tabs.findIndex(tab => tab.id === tabId);
  if (index !== -1) {
    const tab = tabs[index];
    tab.tabElem.parentNode.removeChild(tab.tabElem);
    tab.iframeElem.parentNode.removeChild(tab.iframeElem);
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

// Instead of performing UV navigation here, send a message to the active iframe.
function navigate(url) {
  if (!activeTab) return;
  activeTab.iframeElem.contentWindow.postMessage({ type: "navigate", url: url }, "*");
}

function goBack() {
  if (!activeTab) return;
  if (activeTab.historyIndex > 0) {
    activeTab.historyIndex--;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.iframeElem.src = url;
    document.getElementById("url-input").value = displayURL(url);
  }
}

function goForward() {
  if (!activeTab) return;
  if (activeTab.historyIndex < activeTab.history.length - 1) {
    activeTab.historyIndex++;
    const url = activeTab.history[activeTab.historyIndex];
    activeTab.iframeElem.src = url;
    document.getElementById("url-input").value = displayURL(url);
  }
}

function reloadPage() {
  if (!activeTab) return;
  activeTab.iframeElem.src = activeTab.iframeElem.src;
}

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
