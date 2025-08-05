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
export {
  PearRequestRouter
};
