# Pear Request

A minimal XMLHttpRequest implementation for Pear workers that enables HTMX and other HTTP clients to work seamlessly with Pear's pipe-based communication.

HTMX allows the frontend to trigger actions, while allowing the backend to return minimal updated UI.

The `worker` pattern in Pear allows us to to create a single `core` logic to an app; and provide multiple frontends.

## Overview


https://github.com/user-attachments/assets/d44a05b8-a437-441d-91a8-46500c7d1f4e


This library provides two main components:

- **Server Router** (`./server`) - Handles incoming HTTP requests from the client
- **Client Request Handler** (`./client`) - Replaces the global XMLHttpRequest to send requests through Pear pipes

See htmx here: https://htmx.org/. Headers can be returned to tell htmx to replace different targets, or the whole page if needed.
Using XMLHTTPRequest directly; this could be used with a plain text (such as Terminal) UI.

## Installation

```bash
bun add pear-request
```

## Usage

### Complete Example

```typescript
// Server
import { PearRequestRouter } from "pear-request/server";

// Make this a terminal worker
const pipe = Pear.worker.pipe();

const router = new PearRequestRouter(pipe);

router.get("/api/data", async (req, res) => {
  res.body = "<div>Hello from Pear!</div>";
  res.headers = { "Content-Type": "text/html" };
});

// Client
import { createPearRequest } from "pear-request/client";

// Connect to your terminal worker
const pipe = Pear.worker.run("pear://...");

globalThis.XMLHttpRequest = createPearRequest(pipe);

// HTMX will now work automatically
document.body.innerHTML = `
  <button hx-get="/api/data" hx-target="#result">
    Load Data
  </button>
  <div id="result"></div>
`;
```

### Server Side (Router)

The router handles incoming HTTP requests from the client:

```typescript
import { PearRequestRouter } from "pear-request";

// Create router with your Pear pipe
const router = new PearRequestRouter(pipe);

// Register routes
router.get("/api/users", async (req, res) => {
  res.body = JSON.stringify({ users: [] });
  res.headers = { "Content-Type": "application/json" };
});

router.post("/api/users", async (req, res) => {
  const userData = JSON.parse(req.body);
  // Process user data...
  res.body = JSON.stringify({ success: true });
  res.headers = { "Content-Type": "application/json" };
});

// Handle incoming messages
pipe.on("data", async (data) => {
  const message = JSON.parse(data.toString());
  await router.processMessage(message);
});
```

### Client Side (XMLHttpRequest Replacement)

Replace the global XMLHttpRequest to route all HTTP requests through Pear pipes:

```typescript
import { createPearRequest } from "pear-request";

// Replace global XMLHttpRequest
globalThis.XMLHttpRequest = createPearRequest(pipe);

// Now HTMX and other libraries will work automatically
// All XMLHttpRequest calls will go through your Pear pipe
```

## API Reference

### Server Router

#### `PearRequestRouter(pipe)`

Creates a new router instance.

#### `router.route(method, path, handler)`

Register a route handler.

#### `router.get(path, handler)`, `router.post(path, handler)`, etc.

Convenience methods for common HTTP methods.

#### Route Handler

```typescript
type RouteHandler = (
  req: RequestContext,
  res: ResponseContext
) => void | Promise<void>;

interface RequestContext {
  method: string;
  url: string;
  body?: any;
  id: string;
  headers?: Record<string, string>;
}

interface ResponseContext {
  id: string;
  body: string;
  headers?: Record<string, string>;
  status?: number;
}
```

### Client Request Handler

#### `createPearRequest(pipe)`

Returns a PearRequest class that implements the XMLHttpRequest interface.

## Architecture

```
Client (Browser) → XMLHttpRequest → Pear Pipe → Server Router → Response
```

1. Client makes XMLHttpRequest (e.g., via HTMX)
2. PearRequest intercepts and sends via Pear pipe
3. Server router receives and processes request
4. Response sent back through pipe to client
5. XMLHttpRequest resolves with response

## Building

```bash
bun run build
```

This creates the `dist/` folder with compiled JavaScript files.

## License

Apache-2.0
