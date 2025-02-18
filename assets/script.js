document.addEventListener('DOMContentLoaded', () => {
  const browserContainer = document.querySelector(".browserContainer");

  // Delegate the event to the container that holds the input
  browserContainer.addEventListener("keydown", (e) => {
    if (e.target && e.target.classList.contains("input") && e.key === "Enter") {
      handleInput(e.target);
    }
  });

  function handleInput(input) {
    // Run the formatSearch function on the current value of the input
    const query = formatSearch(input.value);

    // Redirect to [uv prefix] + [encoded search query]
    window.location.href = __uv$config.prefix + __uv$config.encodeUrl(query);
  }
});


function formatSearch(query) {
  // This function turns the inputted value into a Google search if it's not a normal URL
  try {
    return new URL(query).toString()
  } catch (e) { }

  try {
    const url = new URL(`http://${query}`)
    if (url.hostname.includes('.')) return url.toString()
  } catch (e) { }

  return new URL(`https://google.com/search?q=${query}`).toString()
}

function Redir(url) {
  window.location.href = url
}

// Search history spammer
function SHS() {
  window.open("https://docs.google.com")
  window.open("https://drive.google.com")
  window.open("https://classroom.google.com")
  window.open("https://classroom.google.com/H")
  window.open("https://slides.google.com")
  window.open("https://google.com")
  window.open("https://youtube.com")
  window.open("https://www.edpuzzle.com")
  window.open("https://www.gmail.com")
  window.open("https://sheets.google.com")
  window.open("https://www.google.com/search?q=12*24&sca_esv=3a3d99a76b27b006&sca_upv=1&rlz=1C1RXQR_enUS1083US1083&sxsrf=ACQVn09V_SVsiKr0Gc3aMU_yZ5-rWYiOAQ%3A1713404586665&ei=qnogZumLKJ-q5NoP2cq7iAw&ved=0ahUKEwjpiPq90cqFAxUfFVkFHVnlDsEQ4dUDCBA&uact=5&oq=12*24&gs_lp=Egxnd3Mtd2l6LXNlcnAiBTEyKjI0MgsQABiABBixAxiDATIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMgUQABiABEiuKlAAWMQncAh4AJABApgBX6ABpAeqAQIxM7gBA8gBAPgBAZgCE6AC1QaoAhTCAgcQIxgnGOoCwgIWEAAYAxi0AhjlAhjqAhiMAxiPAdgBAcICFhAuGAMYtAIY5QIY6gIYjAMYjwHYAQHCAgQQIxgnwgIKECMYgAQYJxiKBcICChAAGIAEGEMYigXCAhAQABiABBixAxhDGIMBGIoFwgINEAAYgAQYsQMYQxiKBcICDhAAGIAEGLEDGIMBGIoFwgIREAAYgAQYkQIYsQMYgwEYigWYAwW6BgYIARABGAuSBwIxOaAHrkM&sclient=gws-wiz-serp")
  window.open("https://www.google.com/search?q=288%2F61&sca_esv=3a3d99a76b27b006&sca_upv=1&rlz=1C1RXQR_enUS1083US1083&sxsrf=ACQVn0-8V_Om2LcIX8JcrGlDeWXVynNqAQ%3A1713404594440&ei=snogZq6GGsLj5NoPxNK5qAo&ved=0ahUKEwiup9TB0cqFAxXCMVkFHURpDqUQ4dUDCBA&uact=5&oq=288%2F61&gs_lp=Egxnd3Mtd2l6LXNlcnAiBjI4OC82MTICECYyBBAAGB4yBBAAGB4yBBAAGB4yBBAAGB4yBhAAGB4YDzIEEAAYHjIGEAAYCBgeMgYQABgIGB4yBhAAGAgYHkiLuwFQoKABWIq6AXADeAGQAQKYAWugAfcFqgEDOS4xuAEDyAEA-AEBmAIKoALPBKgCFMICChAAGLADGNYEGEfCAgoQIxiABBgnGIoFwgIFEAAYgATCAgsQABiABBiRAhiKBcICCxAAGIAEGLEDGIMBwgIHECMYJxjqAsICFhAAGAMYtAIY5QIY6gIYjAMYjwHYAQHCAhYQLhgDGLQCGOUCGOoCGIwDGI8B2AEBwgIEECMYJ8ICChAAGIAEGEMYigXCAgsQLhiABBixAxiDAcICERAAGIAEGJECGLEDGIMBGIoFwgILEC4YgAQYsQMY1ALCAggQLhiABBixA8ICCBAAGIAEGLEDmAMKiAYBkAYIugYGCAEQARgLkgcDOS4xoAf_Sw&sclient=gws-wiz-serp")
  window.open("https://www.google.com/search?q=formula+for+volume+of+a+cylinder&rlz=1C1RXQR_enUS1083US1083&oq=formula+for+&gs_lcrp=EgZjaHJvbWUqDQgCEAAYgwEYsQMYgAQyBggAEEUYOTINCAEQABiDARixAxiABDINCAIQABiDARixAxiABDIHCAMQABiABDIHCAQQABiABDIKCAUQABixAxiABDIKCAYQABixAxiABDIHCAcQABiPAjIHCAgQABiPAjIHCAkQABiPAtIBCDI5MzNqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8")
  window.open("https://drive.google.com/drive/u/0/")
  window.open("https://drive.google.com/drive/u/0/my-drive")
  window.open("https://drive.google.com/drive/u/0/starred")
  window.open("https://drive.google.com/drive/u/0/sharedwithme")
  window.open("https://drive.google.com/drive/u/0/sharedwithme/settings")
  window.open("https://drive.google.com/drive/u/0/computers")
  window.open("https://drive.google.com/drive/u/0/trash")
  window.open("https://mail.google.com/mail/u/0/?tab=rm&ogbl#snoozed")
  window.open("https://mail.google.com/mail/u/0/?tab=rm&ogbl#drafts")
  window.open("https://mail.google.com/mail/u/0/?tab=rm&ogbl#sent")
  window.open("https://www.google.com/search?q=calculator")
}

function AB() {
  class ABC {
    constructor(config = {}) {
      this.type = config.type || "blank";
      this.url = config.url || "https://asphalt-nine.vercel.app";  // Set default URL
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
        src="` + this.url + `"></iframe>`;
    }

    open() {
      const iframeHTML = `
        <iframe style="height:100%; width: 100%; border: none; position: fixed; top: 0; right: 0; left: 0; bottom: 0; border: none"
        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts allow-top-navigation allow-top-navigation-by-user-activation"
        src="` + this.url + `"></iframe>`;

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
          page.document.documentElement.style.overflow = 'hidden'; // Prevent scrollbars on the document
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

  // Create instance with the URL set to "https://asphalt-nine.vercel.app"
  const abc = new ABC({ url: "https://asphalt-nine.vercel.app", type: "blank" });
  abc.open();
}
