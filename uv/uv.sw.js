(() => {
  const self = window;
  const Ultraviolet = self.Ultraviolet;
  const securityHeaders = [
    "cross-origin-embedder-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "content-security-policy",
    "content-security-policy-report-only",
    "expect-ct",
    "feature-policy",
    "origin-isolation",
    "strict-transport-security",
    "upgrade-insecure-requests",
    "x-content-type-options",
    "x-download-options",
    "x-frame-options",
    "x-permitted-cross-domain-policies",
    "x-powered-by",
    "x-xss-protection"
  ];
  const safeMethods = ["GET", "HEAD"];

  class UVServiceWorker extends Ultraviolet.EventEmitter {
    constructor(config = __uv$config) {
      super();
      config.bare || (config.bare = "/bare/");
      config.prefix || (config.prefix = "/service/");
      this.config = config;
      const bareServers = Array.isArray(config.bare) ? config.bare : [config.bare];
      this.address = bareServers[~~(Math.random() * bareServers.length)];
      this.bareClient = new Ultraviolet.BareClient(this.address);
    }

    async fetch({ request }) {
      try {
        if (!request.url.startsWith(location.origin + this.config.prefix)) {
          return await fetch(request);
        }

        const uv = new Ultraviolet(this.config, this.address);
        typeof this.config.construct === "function" && this.config.construct(uv, "service");
        const cookieDB = await uv.cookie.db();
        uv.meta.origin = location.origin;
        uv.meta.base = uv.meta.url = new URL(uv.sourceUrl(request.url));
        const processedRequest = new ProcessedRequest(
          request,
          this,
          uv,
          safeMethods.includes(request.method.toUpperCase()) ? null : await request.blob()
        );

        if (request.referrer && request.referrer.startsWith(location.origin)) {
          const referrerURL = new URL(uv.sourceUrl(request.referrer));
          (processedRequest.headers.origin || uv.meta.url.origin !== referrerURL.origin && request.mode === "cors") &&
            (processedRequest.headers.origin = referrerURL.origin);
          processedRequest.headers.referer = referrerURL.href;
        }

        const cookies = await uv.cookie.getCookies(cookieDB) || [];
        const cookieHeader = uv.cookie.serialize(cookies, uv.meta, false);
        processedRequest.headers["user-agent"] = navigator.userAgent;
        cookieHeader && (processedRequest.headers.cookie = cookieHeader);

        const requestEvent = new FetchEvent(processedRequest, null, null);
        this.emit("request", requestEvent);
        if (requestEvent.intercepted) return requestEvent.returnValue;

        const targetURL = processedRequest.blob
          ? `blob:${location.origin}${processedRequest.url.pathname}`
          : processedRequest.url;

        const bareResponse = await this.bareClient.fetch(targetURL, {
          headers: processedRequest.headers,
          method: processedRequest.method,
          body: processedRequest.body,
          credentials: processedRequest.credentials,
          mode: location.origin !== processedRequest.address.origin ? "cors" : processedRequest.mode,
          cache: processedRequest.cache,
          redirect: processedRequest.redirect,
          proxyIp: this.config.proxyIp,
          proxyPort: this.config.proxyPort
        });

        const processedResponse = new ProcessedResponse(processedRequest, bareResponse);
        const responseEvent = new FetchEvent(processedResponse, null, null);
        this.emit("beforemod", responseEvent);
        if (responseEvent.intercepted) return responseEvent.returnValue;

        for (const header of securityHeaders) {
          processedResponse.headers[header] && delete processedResponse.headers[header];
        }

        processedResponse.headers.location && (processedResponse.headers.location = uv.rewriteUrl(processedResponse.headers.location));

        if (request.destination === "document") {
          const contentDisposition = processedResponse.headers["content-disposition"];
          if (!/\s*?((inline|attachment);\s*?)filename=/i.test(contentDisposition)) {
            const dispositionType = /^\s*?attachment/i.test(contentDisposition) ? "attachment" : "inline";
            const [filename] = new URL(bareResponse.finalURL).pathname.split("/").slice(-1);
            processedResponse.headers["content-disposition"] = `${dispositionType}; filename=${JSON.stringify(filename)}`;
          }
        }

        if (processedResponse.headers["set-cookie"]) {
          Promise.resolve(uv.cookie.setCookies(processedResponse.headers["set-cookie"], cookieDB, uv.meta))
            .then(() => {
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({ msg: "updateCookies", url: uv.meta.url.href });
                });
              });
            });
          delete processedResponse.headers["set-cookie"];
        }

        if (processedResponse.body) {
          switch (request.destination) {
            case "script":
            case "worker":
              const scripts = [uv.bundleScript, uv.clientScript, uv.configScript, uv.handlerScript]
                .map(JSON.stringify).join(",");
              processedResponse.body = `if (!self.__uv && self.importScripts) { 
                ${uv.createJsInject(this.address, this.bareClient.manfiest, uv.cookie.serialize(cookies, uv.meta, true), request.referrer)} 
                importScripts(${scripts}); 
              }${uv.js.rewrite(await bareResponse.text())}`;
              break;
            case "style":
              processedResponse.body = uv.rewriteCSS(await bareResponse.text());
              break;
            case "iframe":
            case "document":
              if (isHTML(uv.meta.url, processedResponse.headers["content-type"] || "")) {
                processedResponse.body = uv.rewriteHtml(await bareResponse.text(), {
                  document: true,
                  injectHead: uv.createHtmlInject(
                    uv.handlerScript,
                    uv.bundleScript,
                    uv.clientScript,
                    uv.configScript,
                    this.address,
                    this.bareClient.manfiest,
                    uv.cookie.serialize(cookies, uv.meta, true),
                    request.referrer
                  )
                });
              }
              break;
          }
        }

        processedRequest.headers.accept === "text/event-stream" &&
          (processedResponse.headers["content-type"] = "text/event-stream");

        crossOriginIsolated && (processedResponse.headers["Cross-Origin-Embedder-Policy"] = "require-corp");

        this.emit("response", responseEvent);
        return responseEvent.intercepted
          ? responseEvent.returnValue
          : new Response(processedResponse.body, {
              headers: processedResponse.headers,
              status: processedResponse.status,
              statusText: processedResponse.statusText
            });

      } catch (error) {
        return ["document", "iframe"].includes(request.destination)
          ? this.generateErrorPage(error, request.url)
          : new Response(null, { status: 500 });
      }
    }

    generateErrorPage(error, url) {
      const errorHTML = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />
    <title>MadEgg | Error</title>
    <link rel="stylesheet" href="https://www.nerdfonts.com/assets/css/webfont.css" />
    <link href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" />
    <style>
      *,body{color:#eceff4;background-color:#1d232a;font-family:"Figtree",sans-serif;font-optical-sizing:auto;
        background-image:radial-gradient(circle, rgba(131,131,131,0.02) 1px, transparent 1px),
        radial-gradient(circle, rgba(148,148,148,0.02) 1px, transparent 1px);
        background-position:0 0,5px 5px;background-size:10px 10px;}
      h1{color:#ff5861;font-size:64px;font-weight:900;margin-top:0.8%;}
      code{color:#e5e9f0;font-size:24px;font-weight:500;}
      .uv-small{color:#e5e9f0;font-size:20px;font-weight:500;}
      i{color:#e5e9f0;font-size:20px;font-weight:900;text-decoration:none;font-style:normal;}
      .footer-spacing{margin-top:0.5%;}
      button{display:inline-block;text-decoration:none;padding:15px 50px;border-radius:8px;margin:10px;
        margin-top:20px;transition:0.3s ease-in-out;-webkit-transition:0.3s ease-in-out;
        border:1px solid rgba(255,255,255,0.2);box-shadow:0 0 10px rgba(0,0,0,0.1);
        -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
      button:hover{background-color:#434c5e;}
      .container{max-width:650px;}
      .list-group-item{background-color:#2e3440;color:#eceff4;}
      .list-group{border-radius:18px;}
      textarea{border-radius:18px;outline:none;resize:none;border:1px solid rgba(255,255,255,0.2);
        box-shadow:0 0 10px rgba(0,0,0,0.1);padding:25px;box-sizing:border-box;width:450px;}
      .nf-fa-heart{color:#ff5861;}
    </style>
  </head>
  <body>
    <div class="container-fluid text-center">
      <h1>Netwo<wbr>rk Er<wbr>ror</h1>
      <code>Fa<wbr>iled to l<wbr>oad: <b id="fetchedURL">${this.escapeHTML(url)}</b></code>
      <br>
      <button id="reload">Ref<wbr>resh</button>
      <br><br>
      <h5>
        <p>
          <textarea id="errorTrace" cols="40" rows="10" readonly>${this.escapeHTML(error.stack || error.message)}</textarea>
        </p>
      </h5>
      <code class="uv-small">Ul<wbr>tra<wbr>vio<wbr>let v<span id="uvVersion">${__uv$config.version}</span></code>
      <br><br>
      <div class="container text-wrap">
        <ul class="list-group text-start">
          <li class="list-group-item">
            - Verif<wbr>ying you ente<wbr>red the cor<wbr>rect add<wbr>ress
          </li>
          <li class="list-group-item">
            - Clear<wbr>ing your bro<wbr>wser or site cache data via Ctr<wbr>l+Sh<wbr>ift+<wbr>R
          </li>
          <li class="list-group-item">
            - Check<wbr>ing net<wbr>work con<wbr />nec<wbr />tion sta<wbr />bility
          </li>
        </ul>
      </div>
      <br />
      <p class="footer-spacing">
        <i>Mad<wbr>Egg<wbr> © 20<wbr>2<wbr>5</i> <i class="nf nf-fa-heart"></i>
      </p>
      <script>
        document.getElementById('reload').addEventListener('click', () => location.reload());
      </script>
    </div>
  </body>
</html>
      `;

      return new Response(errorHTML, {
        status: error.status || 500,
        headers: { "Content-Type": "text/html" }
      });
    }

    escapeHTML(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  }

  class ProcessedResponse {
    constructor(request, response) {
      this.request = request;
      this.raw = response;
      this.ultraviolet = request.ultraviolet;
      this.headers = {};
      for (const header in response.rawHeaders) this.headers[header.toLowerCase()] = response.rawHeaders[header];
      this.status = response.status;
      this.statusText = response.statusText;
      this.body = response.body;
    }
    get url() { return this.request.url; }
    get base() { return this.request.base; }
    set base(value) { this.request.base = value; }
  }

  class ProcessedRequest {
    constructor(request, sw, uv, body = null) {
      this.ultraviolet = uv;
      this.request = request;
      this.headers = Object.fromEntries(request.headers.entries());
      this.method = request.method;
      this.address = sw.address;
      this.body = body;
      this.cache = request.cache;
      this.redirect = request.redirect;
      this.credentials = "omit";
      this.mode = request.mode === "cors" ? request.mode : "same-origin";
      this.blob = false;
    }
    get url() { return this.ultraviolet.meta.url; }
    set url(value) { this.ultraviolet.meta.url = value; }
    get base() { return this.ultraviolet.meta.base; }
    set base(value) { this.ultraviolet.meta.base = value; }
  }

  class FetchEvent {
    #intercepted = false;
    #returnValue = null;
    constructor(data, target, that) {
      this.data = data;
      this.target = target;
      this.that = that;
    }
    get intercepted() { return this.#intercepted; }
    get returnValue() { return this.#returnValue; }
    respondWith(value) {
      this.#returnValue = value;
      this.#intercepted = true;
    }
  }

  function isHTML(url, contentType = "") {
    const mimeType = Ultraviolet.mime.contentType(contentType || url.pathname) || "text/html";
    return mimeType.split(";")[0] === "text/html";
  }

  self.UVServiceWorker = UVServiceWorker;
})();
