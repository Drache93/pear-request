// src/encoding.ts
import c from "compact-encoding";
import { compile } from "compact-encoding-struct";
var requestEncoding = compile({
  id: c.string,
  body: c.buffer,
  url: c.string,
  method: c.string
});
var responseEncoding = compile({
  id: c.string,
  body: c.buffer,
  headers: c.json,
  status: c.uint16
});

// src/router.ts
import cenc from "compact-encoding";
import URLPattern from "url-pattern";
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
  async sendResponse(response) {
    const body = response.body ? Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body, "utf-8") : Buffer.alloc(0);
    const message = {
      id: response.id,
      body,
      headers: response.headers || { "Content-Type": "text/html" },
      status: response.status || 200
    };
    const encoded = cenc.encode(responseEncoding, message);
    const encodedLength = cenc.encode(cenc.uint32, encoded.length);
    const canWrite = this.pipe.write(Buffer.concat([encodedLength, encoded]));
    if (!canWrite) {
      await new Promise((resolve) => this.pipe.once("drain", resolve));
    }
  }
  async handleRequest(request) {
    const { method, url, id } = request;
    const [path, query] = url.split("?");
    if (!path) {
      throw new Error("Invalid URL");
    }
    const [route, params] = this.routes.reduce((acc, r) => {
      const pattern = new URLPattern(r.path);
      const match = pattern.match(path);
      if (r.method.toLowerCase() !== method.toLowerCase()) {
        return acc;
      }
      return match ? [r, match] : acc;
    }, [null, null]);
    if (route) {
      try {
        const response = {
          id,
          body: null,
          headers: { "Content-Type": "text/html" }
        };
        await route.handler({ ...request, params }, response);
        console.log("response", response);
        await this.sendResponse(response);
      } catch (error) {
        console.error("Route handler error:", error);
        this.sendResponse({
          id,
          body: Buffer.from("Internal Server Error", "utf-8"),
          headers: { "Content-Type": "text/plain" },
          status: 500
        });
      }
    } else {
      this.sendResponse({
        id,
        body: Buffer.from("Not Found", "utf-8"),
        headers: { "Content-Type": "text/plain" },
        status: 404
      });
    }
  }
  async processMessage(message) {
    const { method, body, url, id } = cenc.decode(requestEncoding, message);
    await this.handleRequest({ method, url, body, id });
  }
}

// src/requests.ts
import b4a from "b4a";
import cenc2 from "compact-encoding";
function create(pipe) {
  const pendingRequests = {};

  class PearRequestUpload {
    events = {};
    addEventListener(event, callback) {
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
    _response;
    status;
    statusText;
    static _pendingRequests = {};
    onload;
    getAllResponseHeaders() {
      return {
        ...this._responseHeaders
      };
    }
    get response() {
      if (!this._response) {
        return null;
      }
      if (this.mimeType === "application/json") {
        return JSON.parse(b4a.toString(this._response, "utf-8"));
      } else if (this.mimeType?.startsWith("text/")) {
        return b4a.toString(this._response, "utf-8");
      } else {
        return this._response;
      }
    }
    get responseText() {
      return this._response?.toString("utf-8");
    }
    get responseType() {
      return this.mimeType;
    }
    open(method, url) {
      this.method = method;
      this.url = url;
      this.readyState = 1;
    }
    send(body) {
      const id = crypto.randomUUID();
      this.readyState = 2;
      pendingRequests[id] = this;
      const buff = !body ? Buffer.alloc(0) : Buffer.isBuffer(body) ? body : Buffer.from(body, "utf-8");
      pipe.write(cenc2.encode(requestEncoding, {
        id,
        method: this.method,
        url: this.url,
        body: buff
      }));
    }
    upload = new PearRequestUpload;
    overrideMimeType(mimeType) {
      this.mimeType = mimeType;
    }
    setRequestHeader(header2, value) {
      this.headers[header2] = value;
    }
    addEventListener(event, callback) {
      this.events[event] = callback;
    }
  }
  let incomingBuffer = Buffer.alloc(0);
  let expectedLength = 0;
  pipe.on("data", (data) => {
    incomingBuffer = Buffer.concat([incomingBuffer, Buffer.from(data)]);
    try {
      if (incomingBuffer.length < 4) {
        return;
      }
      if (expectedLength === 0) {
        const length = cenc2.decode(cenc2.uint32, incomingBuffer.subarray(0, 4));
        expectedLength = length;
        incomingBuffer = incomingBuffer.subarray(4);
      }
      if (incomingBuffer.length < expectedLength) {
        return;
      }
      const { id, body, headers } = cenc2.decode(responseEncoding, incomingBuffer);
      const pendingRequest = pendingRequests[id];
      if (pendingRequest) {
        pendingRequest._response = pendingRequest._response ? Buffer.concat([pendingRequest._response, body]) : body;
        pendingRequest.status = 200;
        pendingRequest.statusText = "OK";
        pendingRequest._responseHeaders = headers;
        pendingRequest.readyState = 4;
        pendingRequest["onload"]?.();
      }
      incomingBuffer = Buffer.alloc(0);
      expectedLength = 0;
    } catch (error) {
      console.error("Error decoding header", error);
    }
  });
  return PearRequest;
}
export {
  create,
  PearRequestRouter
};
