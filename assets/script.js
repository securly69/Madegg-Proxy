function AB() {
  class ABC {
    constructor(config = {}) {
      this.type = config.type || "blank";
      // Use the configured baseUrl if no URL is provided in the config
      this.url = config.url || window.appConfig.baseUrl;
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
        <iframe style="height:100%; width: 100%; border: none; position: fixed; top: 0; right: 0; left: 0; bottom: 0; border: none"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
          src="${this.url}"></iframe>`;
    }

    open() {
      const iframeHTML = `
        <iframe style="height:100%; width: 100%; border: none; position: fixed; top: 0; right: 0; left: 0; bottom: 0; border: none"
          sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
          src="${this.url}"></iframe>`;

      const meta = `
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      `;

      try {
        let page;
        if (this.type === "blank") {
          page = window.open();
          page.document.title = "My Classes - Google Classroom"; // Set the title
          page.document.body.style.margin = '0';
          page.document.body.style.padding = '0';
          page.document.body.style.overflow = 'hidden'; // Prevent scrollbars
          page.document.documentElement.style.margin = '0';
          page.document.documentElement.style.padding = '0';
          page.document.documentElement.style.overflow = 'hidden';
          page.document.documentElement.style.height = '100%';
          page.document.body.style.height = '100%';
          page.document.body.innerHTML = meta + iframeHTML;
        } else if (this.type === "blob") {
          page = new Blob([`<html><head>${meta}</head><body>${iframeHTML}</body></html>`], { type: "text/html" });
          window.open(URL.createObjectURL(page));
        } else if (this.type === "overwrite") {
          document.body.innerHTML = meta + iframeHTML;
        }
      } catch (error) {
        console.error("Error opening the page:", error);
      }
    }
  }

  // Create instance using the configuration value from config.js
  const abc = new ABC({ url: window.appConfig.baseUrl, type: "blank" });
  abc.open();
}
