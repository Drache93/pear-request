// src/requests.ts
import b4a from "b4a";
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
      pipe.write(b4a.from(JSON.stringify({
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
    const message = b4a.toString(data, "utf-8");
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
  create
};
