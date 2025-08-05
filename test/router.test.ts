import test from "brittle";
import { PearRequestRouter } from "../src/router.js";

// Mock pipe for testing
class MockPipe {
  responses: any[] = [];

  write(data: any) {
    this.responses.push(JSON.parse(data.toString()));
  }
}

test("router pattern matching with parameters", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  // Test basic parameter extraction
  router.post("/api/projects/:id/upvote", (req, res) => {
    t.is(req.params?.id, "123");
    res.body = `User ${req.params?.id}`;
  });

  await router.processMessage({
    method: "POST",
    url: "/api/projects/123/upvote",
    id: "test-1",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "User 123");
  t.is(pipe.responses[0].status, 200);
});

test("router pattern matching with multiple parameters", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/users/:userId/posts/:postId", (req, res) => {
    t.is(req.params?.userId, "456");
    t.is(req.params?.postId, "789");
    res.body = `User ${req.params?.userId}, Post ${req.params?.postId}`;
  });

  await router.processMessage({
    method: "GET",
    url: "/users/456/posts/789",
    id: "test-2",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "User 456, Post 789");
});

test("router pattern matching with query parameters", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/search", (req, res) => {
    t.is(req.url, "/search?q=test&page=1");
    res.body = "Search results";
  });

  await router.processMessage({
    method: "GET",
    url: "/search?q=test&page=1",
    id: "test-3",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "Search results");
});

test("router pattern matching with required parameters", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/blog/:year/:month/:day", (req, res) => {
    const params = req.params || {};
    res.body = `Blog: ${params.year}/${params.month}/${params.day}`;
  });

  // Test with all parameters
  await router.processMessage({
    method: "GET",
    url: "/blog/2024/12/25",
    id: "test-4a",
  });

  t.is(pipe.responses[0].body, "Blog: 2024/12/25");

  // Test with missing parameters (should return 404)
  await router.processMessage({
    method: "GET",
    url: "/blog/2024",
    id: "test-4b",
  });

  t.is(pipe.responses[1].status, 404);
  t.is(pipe.responses[1].body, "Not Found");
});

test("router pattern matching with different HTTP methods", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/users/:id", (req, res) => {
    res.body = `GET User ${req.params?.id}`;
  });

  router.post("/users/:id", (req, res) => {
    res.body = `POST User ${req.params?.id}`;
  });

  router.put("/users/:id", (req, res) => {
    res.body = `PUT User ${req.params?.id}`;
  });

  router.delete("/users/:id", (req, res) => {
    res.body = `DELETE User ${req.params?.id}`;
  });

  // Test GET
  await router.processMessage({
    method: "GET",
    url: "/users/123",
    id: "test-5a",
  });

  t.is(pipe.responses[0].body, "GET User 123");

  // Test POST
  await router.processMessage({
    method: "POST",
    url: "/users/123",
    id: "test-5b",
  });

  t.is(pipe.responses[1].body, "POST User 123");

  // Test PUT
  await router.processMessage({
    method: "PUT",
    url: "/users/123",
    id: "test-5c",
  });

  t.is(pipe.responses[2].body, "PUT User 123");

  // Test DELETE
  await router.processMessage({
    method: "DELETE",
    url: "/users/123",
    id: "test-5d",
  });

  t.is(pipe.responses[3].body, "DELETE User 123");
});

test("router pattern matching with complex URL patterns", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get(
    "/api/v1/users/:userId/orders/:orderId/items/:itemId",
    (req, res) => {
      t.is(req.params?.userId, "user123");
      t.is(req.params?.orderId, "order456");
      t.is(req.params?.itemId, "item789");
      res.body = `API call: User ${req.params?.userId}, Order ${req.params?.orderId}, Item ${req.params?.itemId}`;
    }
  );

  await router.processMessage({
    method: "GET",
    url: "/api/v1/users/user123/orders/order456/items/item789",
    id: "test-6",
  });

  t.is(pipe.responses.length, 1);
  t.is(
    pipe.responses[0].body,
    "API call: User user123, Order order456, Item item789"
  );
});

test("router pattern matching with simple filenames", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/files/:filename", (req, res) => {
    t.is(req.params?.filename, "myfile");
    res.body = `File: ${req.params?.filename}`;
  });

  await router.processMessage({
    method: "GET",
    url: "/files/myfile",
    id: "test-7",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "File: myfile");
});

test("router pattern matching with numeric parameters", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/posts/:id", (req, res) => {
    t.is(req.params?.id, "42");
    res.body = `Post ID: ${req.params?.id}`;
  });

  await router.processMessage({
    method: "GET",
    url: "/posts/42",
    id: "test-8",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "Post ID: 42");
});

test("router pattern matching with case insensitive method matching", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/users/:id", (req, res) => {
    res.body = `User ${req.params?.id}`;
  });

  // Test with lowercase method
  await router.processMessage({
    method: "get",
    url: "/users/123",
    id: "test-9a",
  });

  t.is(pipe.responses[0].body, "User 123");

  // Test with uppercase method
  await router.processMessage({
    method: "GET",
    url: "/users/456",
    id: "test-9b",
  });

  t.is(pipe.responses[1].body, "User 456");
});

test("router returns 404 for non-matching routes", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/users/:id", (req, res) => {
    res.body = "User found";
  });

  // Test non-matching route
  await router.processMessage({
    method: "GET",
    url: "/users",
    id: "test-10",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].status, 404);
  t.is(pipe.responses[0].body, "Not Found");
});

test("router returns 404 for non-matching methods", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/users/:id", (req, res) => {
    res.body = "User found";
  });

  // Test with POST method on GET route
  await router.processMessage({
    method: "POST",
    url: "/users/123",
    id: "test-11",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].status, 404);
  t.is(pipe.responses[0].body, "Not Found");
});

test("router handles route handler errors gracefully", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/error", (req, res) => {
    throw new Error("Test error");
  });

  await router.processMessage({
    method: "GET",
    url: "/error",
    id: "test-12",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].status, 500);
  t.is(pipe.responses[0].body, "Internal Server Error");
});

test("router handles async route handlers", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/async/:id", async (req, res) => {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
    res.body = `Async User ${req.params?.id}`;
  });

  await router.processMessage({
    method: "GET",
    url: "/async/123",
    id: "test-13",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "Async User 123");
});

test("router handles request with body and headers", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.post("/users/:id", (req, res) => {
    t.is(req.body, "test body");
    t.is(req.headers?.authorization, "Bearer token123");
    res.body = `Created user ${req.params?.id}`;
    res.headers = { "Content-Type": "application/json" };
  });

  await router.processMessage({
    method: "POST",
    url: "/users/123",
    body: "test body",
    headers: { authorization: "Bearer token123" },
    id: "test-14",
  });

  t.is(pipe.responses.length, 1);
  t.is(pipe.responses[0].body, "Created user 123");
  t.is(pipe.responses[0].headers["Content-Type"], "application/json");
});

test("router handles multiple routes with different patterns", async (t) => {
  const pipe = new MockPipe();
  const router = new PearRequestRouter(pipe);

  router.get("/users/:id", (req, res) => {
    res.body = `User ${req.params?.id}`;
  });

  router.get("/posts/:id", (req, res) => {
    res.body = `Post ${req.params?.id}`;
  });

  router.get("/comments/:id", (req, res) => {
    res.body = `Comment ${req.params?.id}`;
  });

  // Test first route
  await router.processMessage({
    method: "GET",
    url: "/users/123",
    id: "test-15a",
  });

  t.is(pipe.responses[0].body, "User 123");

  // Test second route
  await router.processMessage({
    method: "GET",
    url: "/posts/456",
    id: "test-15b",
  });

  t.is(pipe.responses[1].body, "Post 456");

  // Test third route
  await router.processMessage({
    method: "GET",
    url: "/comments/789",
    id: "test-15c",
  });

  t.is(pipe.responses[2].body, "Comment 789");
});
