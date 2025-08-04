import b4a from "b4a";
import URLPattern from "url-pattern";

export interface RequestContext {
  method: string;
  url: string;
  body?: any;
  id: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export interface ResponseContext {
  id: string;
  body: string;
  headers?: Record<string, string>;
  status?: number;
}

export type RouteHandler = (
  req: RequestContext,
  res: ResponseContext
) => void | Promise<void>;

export interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

export class PearRequestRouter {
  private routes: Route[] = [];
  private pipe: any;

  constructor(pipe: any) {
    this.pipe = pipe;
  }

  // Register a route
  route(method: string, path: string, handler: RouteHandler) {
    this.routes.push({ method, path, handler });
  }

  // Convenience methods for common HTTP methods
  get(path: string, handler: RouteHandler) {
    this.route("GET", path, handler);
  }

  put(path: string, handler: RouteHandler) {
    this.route("PUT", path, handler);
  }

  post(path: string, handler: RouteHandler) {
    this.route("POST", path, handler);
  }

  delete(path: string, handler: RouteHandler) {
    this.route("DELETE", path, handler);
  }

  // Send response through the pipe
  private sendResponse(response: ResponseContext) {
    this.pipe.write(
      b4a.from(
        JSON.stringify({
          type: "response",
          id: response.id,
          body: response.body,
          headers: response.headers || { "Content-Type": "text/html" },
          status: response.status || 200,
        }),
        "utf-8"
      )
    );
  }

  // Handle incoming request
  async handleRequest(request: RequestContext) {
    const { method, url, id } = request;

    // Extract path part from URL (remove query parameters)
    // TODO: Handle query parameters
    const path = url.split("?")[0] || url;

    // Find matching route
    const [route, params] = this.routes.reduce<[Route | null, any]>(
      (acc, r) => {
        const pattern = new URLPattern(r.path);
        const match = pattern.match(path);

        if (r.method.toLowerCase() !== method.toLowerCase()) {
          return acc;
        }

        return match ? [r, match] : acc;
      },
      [null, null]
    );

    if (route) {
      try {
        const response: ResponseContext = {
          id,
          body: "",
          headers: { "Content-Type": "text/html" },
        };

        await route.handler({ ...request, params }, response);
        this.sendResponse(response);
      } catch (error) {
        console.error("Route handler error:", error);
        this.sendResponse({
          id,
          body: "Internal Server Error",
          headers: { "Content-Type": "text/plain" },
          status: 500,
        });
      }
    } else {
      // Route not found
      this.sendResponse({
        id,
        body: "Not Found",
        headers: { "Content-Type": "text/plain" },
        status: 404,
      });
    }
  }

  // Process incoming message
  async processMessage(message: any) {
    const { method, body, url, id } = message;

    await this.handleRequest({ method, url, body, id });
  }
}
