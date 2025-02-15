document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector(".input");
  input.addEventListener("keydown", handleInput);

  function handleInput(e) {
    // Only proceed if the Enter key is pressed.
    if (e.key !== 'Enter') return;

    // Format the entered query into a valid URL or default to a Google search.
    const query = formatSearch(input.value);
    // Generate the full UV configuration URL using the UV proxy's encoding.
    const uvConfigUrl = generateUVConfigUrl(query);
    // Build an embed element string that will load the UV proxy.
    const embedCode = `<embed src="${uvConfigUrl}" width="100%" height="100%" />`;
    // Save the embed code (to be retrieved on the browser page).
    localStorage.setItem("uvEmbedCode", embedCode);
    // Redirect to the browser page.
    window.location.href = '/browser';
  }
});

/**
 * formatSearch() - Converts the entered query into a valid URL.
 * If not valid, it defaults to a Google search URL.
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

/**
 * generateUVConfigUrl() - Constructs the full UV configuration URL.
 * It relies on the global __uv$config object that’s provided by your proxy files.
 *
 * The URL is built as:
 *   [Proxy Domain] + [Service Prefix] + [Encoded Query]
 *
 * For example, for YouTube it might produce:
 *   https://asphalt-proxy.vercel.app/service/hvtrs8%2F-m%2Cymuvu%60e%2Ccmm-
 */
function generateUVConfigUrl(query) {
  const proxyDomain = "https://asphalt-proxy.vercel.app"; // Adjust if needed.
  const servicePrefix = __uv$config.prefix; // Typically '/service/'
  const encodedQuery = __uv$config.encodeUrl(query);
  return proxyDomain + servicePrefix + encodedQuery;
}

// --- The remaining functions below are part of your existing extra functionality ---

function Redir(url) {
  window.location.href = url;
}

function SHS() {
  window.open("https://docs.google.com");
  window.open("https://drive.google.com");
  window.open("https://classroom.google.com");
  window.open("https://classroom.google.com/H");
  window.open("https://slides.google.com");
  window.open("https://google.com");
  window.open("https://youtube.com");
  window.open("https://www.edpuzzle.com");
  window.open("https://www.gmail.com");
  window.open("https://sheets.google.com");
  window.open("https://www.google.com/search?q=12*24");
  window.open("https://www.google.com/search?q=288%2F61");
  window.open("https://www.google.com/search?q=formula+for+volume+of+a+cylinder");
  window.open("https://drive.google.com/drive/u/0/");
  window.open("https://drive.google.com/drive/u/0/my-drive");
  window.open("https://drive.google.com/drive/u/0/starred");
  window.open("https://drive.google.com/drive/u/0/sharedwithme");
  window.open("https://drive.google.com/drive/u/0/sharedwithme/settings");
  window.open("https://drive.google.com/drive/u/0/computers");
  window.open("https://drive.google.com/drive/u/0/trash");
  window.open("https://mail.google.com/mail/u/0/?tab=rm&ogbl#snoozed");
  window.open("https://mail.google.com/mail/u/0/?tab=rm&ogbl#drafts");
  window.open("https://mail.google.com/mail/u/0/?tab=rm&ogbl#sent");
  window.open("https://www.google.com/search?q=calculator");
}

function AB() {
  class ABC {
    constructor(config = {}) {
      this.type = config.type || "blank";
      this.url = config.url || "https://asphalt-nine.vercel.app";
    }
    setType(type) {
      if (!type) return;
      this.type = type;
    }
    setUrl(url) {
      if (!url) return;
      this.url = url;
    }
    getCode() {
      return `
        <iframe style="height:100%; width: 100%; border: none; position: fixed; top: 0; right: 0; left: 0; bottom: 0;"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
          src="` + this.url + `"></iframe>`;
    }
    open() {
      const iframeHTML = this.getCode();
      const meta = `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`;
      try {
        let page;
        if (this.type === "blank") {
          page = window.open();
          page.document.title = "My Classes - Google Classroom";
          page.document.body.style.margin = '0';
          page.document.body.style.padding = '0';
          page.document.body.style.overflow = 'hidden';
          page.document.documentElement.style.margin = '0';
          page.document.documentElement.style.padding = '0';
          page.document.documentElement.style.overflow = 'hidden';
          page.document.documentElement.style.height = '100%';
          page.document.body.style.height = '100%';
          page.document.body.innerHTML = meta + iframeHTML;
        } else if (this.type === "blob") {
          page = new Blob([`<html><head>${meta}</head><body>${iframeHTML}</body></html>`], {type: "text/html"});
          window.open(URL.createObjectURL(page));
        } else if (this.type === "overwrite") {
          document.body.innerHTML = meta + iframeHTML;
        }
      } catch (error) {
        console.error("Error opening the page:", error);
      }
    }
  }
  const abc = new ABC({ url: "https://asphalt-nine.vercel.app", type: "blank" });
  abc.open();
}
