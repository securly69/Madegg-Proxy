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

  const errorPageCSS = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', system-ui, sans-serif; 
        line-height: 1.6; 
        padding: 2rem 1rem; 
        max-width: 800px; 
        margin: 0 auto;
        background: #f8f9fa;
        color: #333;
      }
      h1 { 
        color: #dc3545; 
        margin-bottom: 1.5rem;
        font-size: 2.2rem;
      }
      hr { 
        margin: 1.5rem 0; 
        border: 0; 
        border-top: 1px solid #ddd;
      }
      p { margin: 1rem 0; }
      ul { 
        margin: 1rem 0; 
        padding-left: 2rem;
      }
      li { margin: 0.5rem 0; }
      button {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 5px;
        cursor: pointer;
        font-size: 1rem;
        transition: background 0.2s;
        margin-top: 1rem;
      }
      button:hover { background: #0056b3; }
      #errorTrace {
        width: 100%;
        margin: 1rem 0;
        padding: 0.8rem;
        font-family: monospace;
        background: #f1f3f5;
        border: 1px solid #ddd;
        border-radius: 4px;
        min-height: 100px;
      }
      table {
        margin: 1rem 0;
        border-collapse: collapse;
        width: 100%;
      }
      td {
        padding: 0.5rem;
        border: 1px solid #ddd;
      }
      td:first-child {
        font-weight: bold;
        width: 120px;
        background: #f8f9fa;
      }
      a {
        color: #007bff;
        text-decoration: none;
      }
      a:hover { text-decoration: underline; }
      @media (max-width: 600px) {
        body { padding: 1rem; }
        h1 { font-size: 1.8rem; }
        button { width: 100%; }
      }
    </style>
  `;

  class UVServiceWorker extends Ultraviolet.EventEmitter {
    constructor(config = __uv$config) {
      super();
      config.bare || (config.bare = "/bare/");
      config.prefix || (config.prefix = "/service/");
      
      this.config = config;
      const bareServers = Array.isArray(config.bare) 
        ? config.bare 
        : [config.bare];
      
      this.address = bareServers[~~(Math.random() * bareServers.length)];
      this.bareClient = new Ultraviolet.BareClient(this.address);
    }

    async fetch({ request }) {
      try {
        if (!request.url.startsWith(location.origin + this.config.prefix)) {
          return await fetch(request);
        }

        const uv = new Ultraviolet(this.config, this.address);
        if (typeof this.config.construct === "function") {
          this.config.construct(uv, "service");
        }

        const cookieDB = await uv.cookie.db();
        uv.meta.origin = location.origin;
        uv.meta.base = uv.meta.url = new URL(uv.sourceUrl(request.url));

        const processedRequest = new ProcessedRequest(
          request,
          this,
          uv,
          safeMethods.includes(request.method.toUpperCase()) 
            ? null 
            : await request.blob()
        );

        if (request.referrer && request.referrer.startsWith(location.origin)) {
          const referrerURL = new URL(uv.sourceUrl(request.referrer));
          if (processedRequest.headers.origin || 
              uv.meta.url.origin !== referrerURL.origin && 
              request.mode === "cors") {
            processedRequest.headers.origin = referrerURL.origin;
          }
          processedRequest.headers.referer = referrerURL.href;
        }

        const cookies = await uv.cookie.getCookies(cookieDB) || [];
        const cookieHeader = uv.cookie.serialize(cookies, uv.meta, false);
        
        processedRequest.headers["user-agent"] = navigator.userAgent;
        if (cookieHeader) {
          processedRequest.headers.cookie = cookieHeader;
        }

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
          mode: location.origin !== processedRequest.address.origin 
            ? "cors" 
            : processedRequest.mode,
          cache: processedRequest.cache,
          redirect: processedRequest.redirect,
          proxyIp: this.config.proxyIp,
          proxyPort: this.config.proxyPort
        });

        const processedResponse = new ProcessedResponse(processedRequest, bareResponse);
        const responseEvent = new FetchEvent(processedResponse, null, null);
        this.emit("beforemod", responseEvent);
        if (responseEvent.intercepted) return responseEvent.returnValue;

        // Remove security headers
        for (const header of securityHeaders) {
          processedResponse.headers[header] && 
            delete processedResponse.headers[header];
        }

        // Handle redirects
        if (processedResponse.headers.location) {
          processedResponse.headers.location = 
            uv.rewriteUrl(processedResponse.headers.location);
        }

        // Handle content disposition
        if (request.destination === "document") {
          const contentDisposition = processedResponse.headers["content-disposition"];
          if (!/\s*?((inline|attachment);\s*?)filename=/i.test(contentDisposition)) {
            const dispositionType = /^\s*?attachment/i.test(contentDisposition)
              ? "attachment"
              : "inline";
            const [filename] = new URL(bareResponse.finalURL)
              .pathname.split("/")
              .slice(-1);
            processedResponse.headers["content-disposition"] = 
              `${dispositionType}; filename=${JSON.stringify(filename)}`;
          }
        }

        // Handle cookies
        if (processedResponse.headers["set-cookie"]) {
          Promise.resolve(
            uv.cookie.setCookies(processedResponse.headers["set-cookie"], cookieDB, uv.meta)
          ).then(() => {
            self.clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage({
                  msg: "updateCookies",
                  url: uv.meta.url.href
                });
              });
            });
          });
          delete processedResponse.headers["set-cookie"];
        }

        // Process response body
        if (processedResponse.body) {
          switch (request.destination) {
            case "script":
            case "worker":
              const scripts = [
                uv.bundleScript,
                uv.clientScript,
                uv.configScript,
                uv.handlerScript
              ].map(JSON.stringify).join(",");
              
              processedResponse.body = `
                if (!self.__uv && self.importScripts) { 
                  ${uv.createJsInject(
                    this.address,
                    this.bareClient.manifest,
                    uv.cookie.serialize(cookies, uv.meta, true),
                    request.referrer
                  )} 
                  importScripts(${scripts}); 
                }
                ${uv.js.rewrite(await bareResponse.text())}
              `;
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
                    this.bareClient.manifest,
                    uv.cookie.serialize(cookies, uv.meta, true),
                    request.referrer
                  )
                });
              }
              break;
          }
        }

        // Special handling for event streams
        if (processedRequest.headers.accept === "text/event-stream") {
          processedResponse.headers["content-type"] = "text/event-stream";
        }

        // Add security headers
        if (crossOriginIsolated) {
          processedResponse.headers["Cross-Origin-Embedder-Policy"] = "require-corp";
        }

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
          ? (console.error(error), generateErrorPage(error, targetURL, this.address))
          : new Response(undefined, { status: 500 });
      }
    }

    static Ultraviolet = Ultraviolet;
  }

  // Helper classes and functions
  class ProcessedResponse {
    constructor(request, response) {
      this.request = request;
      this.raw = response;
      this.ultraviolet = request.ultraviolet;
      this.headers = {};
      
      for (const header in response.rawHeaders) {
        this.headers[header.toLowerCase()] = response.rawHeaders[header];
      }
      
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

  function generateBasicError(url, bareServer) {
    const parsedURL = new URL(url);
    const scriptContent = `
      remoteHostname.textContent = ${JSON.stringify(parsedURL.hostname)};
      bareServer.href = ${JSON.stringify(bareServer)};
      uvHostname.textContent = ${JSON.stringify(location.hostname)};
      reload.addEventListener("click", () => location.reload());
      uvVersion.textContent = ${JSON.stringify("1.0.11.patch.7")};
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Error</title>
          ${errorPageCSS}
        </head>
        <body>
          <h1>This site can’t be reached</h1>
          <hr />
          <p><b id="remoteHostname"></b>’s server IP address could not be found.</p>
          <p>Try:</p>
          <ul>
            <li>Verifying you entered the correct address</li>
            <li>Clearing the site data</li>
            <li>Contacting <b id="uvHostname"></b>'s administrator</li>
            <li>Verifying the <a id="bareServer" title="Bare server">Bare server</a> isn't censored</li>
          </ul>
          <button id="reload">Reload</button>
          <hr />
          <p><i>Ultraviolet v<span id="uvVersion"></span></i></p>
          <script src="data:application/javascript,${encodeURIComponent(scriptContent)}"></script>
        </body>
      </html>
    `;
  }

  function generateDetailedError(title, code, id, message, trace, url, bareServer) {
    const scriptContent = `
      errorTitle.textContent = ${JSON.stringify(title)};
      errorCode.textContent = ${JSON.stringify(code)};
      ${id ? `errorId.textContent = ${JSON.stringify(id)};` : ""}
      errorMessage.textContent = ${JSON.stringify(message)};
      errorTrace.value = ${JSON.stringify(trace)};
      fetchedURL.textContent = ${JSON.stringify(url)};
      bareServer.href = ${JSON.stringify(bareServer)};
      document.querySelectorAll("#uvHostname").forEach(el => {
        el.textContent = ${JSON.stringify(location.hostname)};
      });
      reload.addEventListener("click", () => location.reload());
      uvVersion.textContent = ${JSON.stringify("1.0.11.patch.7")};
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Error</title>
          ${errorPageCSS}
        </head>
        <body>
          <h1 id="errorTitle"></h1>
          <hr />
          <p>Failed to load <b id="fetchedURL"></b></p>
          <p id="errorMessage"></p>
          <table>
            <tbody>
              <tr><td>Code:</td><td id="errorCode"></td></tr>
              ${id ? "<tr><td>ID:</td><td id=\"errorId\"></td></tr>" : ""}
            </tbody>
          </table>
          <textarea id="errorTrace" readonly></textarea>
          <p>Try:</p>
          <ul>
            <li>Checking your internet connection</li>
            <li>Verifying you entered the correct address</li>
            <li>Clearing the site data</li>
            <li>Contacting <b id="uvHostname"></b>'s administrator</li>
            <li>Verify the <a id="bareServer" title="Bare server">Bare server</a> isn't censored</li>
          </ul>
          <p>If you're the administrator of <b id="uvHostname"></b>, try:</p>
          <ul>
            <li>Restarting your Bare server</li>
            <li>Updating Ultraviolet</li>
            <li>Troubleshooting the error on the <a href="https://github.com/titaniumnetwork-dev/Ultraviolet" target="_blank">GitHub repository</a></li>
          </ul>
          <button id="reload">Reload</button>
          <hr />
          <p><i>Ultraviolet v<span id="uvVersion"></span></i></p>
          <script src="data:application/javascript,${encodeURIComponent(scriptContent)}"></script>
        </body>
      </html>
    `;
  }

  function isBareError(error) {
    return error instanceof Error && typeof error.body === "object";
  }

  function generateErrorPage(error, url, bareServer) {
    if (error.message === "The specified host could not be resolved.") {
      return new Response(generateBasicError(url, bareServer), {
        status: error.status,
        headers: { "content-type": "text/html" }
      });
    }

    let title, code, id, message, trace;
    if (isBareError(error)) {
      title = "Bare Server Error";
      code = error.body.code;
      id = error.body.id;
      message = error.body.message;
      trace = String(error);
    } else {
      title = "Processing Error";
      code = error instanceof Error ? error.name : "UNKNOWN";
      message = "Internal Server Error";
      trace = String(error);
    }

    return new Response(
      generateDetailedError(title, code, id, message, trace, url, bareServer), 
      { headers: { "content-type": "text/html" }, status: error.status || 500 }
    );
  }

  self.UVServiceWorker = UVServiceWorker;
})();
