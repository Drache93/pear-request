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
export {
  PearRequestRouter
};
