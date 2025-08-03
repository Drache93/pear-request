// src/router.ts
import b4a from "b4a";

class PearRequestRouter {
  routes = [];
  pipe;
  constructor(pipe) {
    this.pipe = pipe;
  }
  route(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  get(path, handler) {
    this.route("GET", path, handler);
  }
  put(path, handler) {
    this.route("PUT", path, handler);
  }
  post(path, handler) {
    this.route("POST", path, handler);
  }
  delete(path, handler) {
    this.route("DELETE", path, handler);
  }
  sendResponse(response) {
    this.pipe.write(b4a.from(JSON.stringify({
      type: "response",
      id: response.id,
      body: response.body,
      headers: response.headers || { "Content-Type": "text/html" },
      status: response.status || 200
    }), "utf-8"));
  }
  async handleRequest(request) {
    const { method, url, id } = request;
    const route = this.routes.find((r) => r.method === method && r.path === url);
    if (route) {
      try {
        const response = {
          id,
          body: "",
          headers: { "Content-Type": "text/html" }
        };
        await route.handler(request, response);
        this.sendResponse(response);
      } catch (error) {
        console.error("Route handler error:", error);
        this.sendResponse({
          id,
          body: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
          status: 500
        });
      }
    } else {
      this.sendResponse({
        id,
        body: "Not Found",
        headers: { "Content-Type": "text/plain" },
        status: 404
      });
    }
  }
  async processMessage(message) {
    const { method, body, url, id } = message;
    await this.handleRequest({ method, url, body, id });
  }
}

// src/requests.ts
import b4a2 from "b4a";
function create(pipe) {
  const pendingRequests = {};

  class PearRequestUpload {
    events = {};
    addEventListener(event, callback) {
      console.log("addEventListener", event, callback);
      this.events[event] = callback;
    }
  }

  class PearRequest {
    method;
    url;
    mimeType;
    readyState = 0;
    headers = {};
    events = {};
    _responseHeaders;
    response;
    status;
    statusText;
    static _pendingRequests = {};
    onload;
    getAllResponseHeaders() {
      return {
        ...this._responseHeaders
      };
    }
    get responseText() {
      return this.response?.toString("utf-8");
    }
    get responseType() {
      return this.mimeType;
    }
    open(method, url) {
      console.log("open", method, url);
      this.method = method;
      this.url = url;
      this.readyState = 1;
    }
    send(body) {
      console.log("send", body);
      const id = crypto.randomUUID();
      this.readyState = 2;
      pendingRequests[id] = this;
      pipe.write(b4a2.from(JSON.stringify({
        id,
        method: this.method,
        url: this.url,
        body
      }), "utf-8"));
    }
    upload = new PearRequestUpload;
    overrideMimeType(mimeType) {
      this.mimeType = mimeType;
    }
    setRequestHeader(header, value) {
      this.headers[header] = value;
    }
    addEventListener(event, callback) {
      console.log("addEventListener", event, callback);
      this.events[event] = callback;
    }
  }
  pipe.on("data", (data) => {
    const message = b4a2.toString(data, "utf-8");
    const { id, body, headers } = JSON.parse(message);
    console.log("from worker", message);
    const pendingRequest = pendingRequests[id];
    if (pendingRequest) {
      pendingRequest.readyState = 4;
      pendingRequest.response = body;
      pendingRequest._responseHeaders = headers;
      pendingRequest.status = 200;
      pendingRequest.statusText = "OK";
      console.log("request", pendingRequest);
      pendingRequest["onload"]?.();
    }
  });
  return PearRequest;
}
export {
  create,
  PearRequestRouter
};
