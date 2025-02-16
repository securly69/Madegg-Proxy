let tabs = [];
let activeTab = null;

// Create a new tab loading browser.html by default.
function createTab(url = "browser.html") {
  const tabId = "tab-" + Date.now();
  
  // Create tab element
  const tabElem = document.createElement("div");
  tabElem.className = "tab";
  tabElem.id = tabId;
  
  // Icon element – default globe icon; will update if favicon is found.
  const iconElem = document.createElement("i");
  iconElem.className = "fa fa-globe";
  tabElem.appendChild(iconElem);
  
  // Title element
  const titleSpan = document.createElement("span");
  titleSpan.className = "tab-title";
  titleSpan.innerText = "New Tab";
  tabElem.appendChild(titleSpan);
  
  // Close button for the tab
  const closeBtn = document.createElement("span");
  closeBtn.className = "close-tab";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = function(e) {
    e.stopPropagation();
    closeTab(tabId);
  };
  tabElem.appendChild(closeBtn);
  
  // Click to switch tab
  tabElem.onclick = () => switchTab(tabId);
  
  // Insert new tab before the new tab button
  const newTabButton = document.getElementById("new-tab-button");
  document.getElementById("tab-bar").insertBefore(tabElem, newTabButton);
  
  // Create the iframe that will load the browser content
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.id = "iframe-" + tabId;
  iframe.style.display = "none";
  
  // On load, update tab title and try to get favicon
  iframe.onload = function() {
    try {
      const doc = iframe.contentDocument;
      const title = doc.title || "New Tab";
      titleSpan.innerText = title;
      // Attempt to update icon from the favicon (if available)
      const favicon = doc.querySelector("link[rel*='icon']");
      if (favicon && favicon.href) {
        iconElem.className = "";
        iconElem.style.backgroundImage = `url(${favicon.href})`;
        iconElem.style.width = "16px";
        iconElem.style.height = "16px";
        iconElem.style.backgroundSize = "16px 16px";
        iconElem.style.display = "inline-block";
      }
    } catch (e) {
      console.log("Could not update tab title or favicon:", e);
    }
  };
  
  document.getElementById("browserContainer").appendChild(iframe);
  
  tabs.push({ id: tabId, tabElem, iframe });
  switchTab(tabId);
}

function switchTab(tabId) {
  tabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.iframe.style.display = "block";
      tab.tabElem.classList.add("active");
      activeTab = tab;
      document.getElementById("url-input").value = tab.iframe.src;
    } else {
      tab.iframe.style.display = "none";
      tab.tabElem.classList.remove("active");
    }
  });
}

function closeTab(tabId) {
  const index = tabs.findIndex(tab => tab.id === tabId);
  if (index !== -1) {
    const tab = tabs[index];
    tab.tabElem.parentNode.removeChild(tab.tabElem);
    tab.iframe.parentNode.removeChild(tab.iframe);
    tabs.splice(index, 1);
    // If the closed tab was active, switch to another available tab.
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

// Navigation Controls
document.getElementById("back-btn").addEventListener("click", function() {
  if (activeTab) activeTab.iframe.contentWindow.history.back();
});
document.getElementById("forward-btn").addEventListener("click", function() {
  if (activeTab) activeTab.iframe.contentWindow.history.forward();
});
document.getElementById("reload-btn").addEventListener("click", function() {
  if (activeTab) activeTab.iframe.contentWindow.location.reload();
});
document.getElementById("go-btn").addEventListener("click", function() {
  if (activeTab) {
    const newUrl = document.getElementById("url-input").value;
    activeTab.iframe.src = newUrl;
  }
});
document.getElementById("url-input").addEventListener("keyup", function(e) {
  if (e.key === "Enter") {
    document.getElementById("go-btn").click();
  }
});
document.getElementById("new-tab-button").addEventListener("click", function() {
  createTab("browser.html");
});

// Create the initial tab on page load.
createTab("browser.html");
