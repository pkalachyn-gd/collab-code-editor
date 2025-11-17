const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const { setupWSConnection, docs } = require("y-websocket/bin/utils");

const host = "localhost";
const port = 1234;

const allowedOrigins = [
  "http://localhost:3000",
  "https://your-production-domain.com",
];

const server = createServer((req, res) => {
  const origin = req.headers.origin;
  let corsOrigin = "";
  if (process.env.NODE_ENV === "production") {
    if (allowedOrigins.includes(origin)) {
      corsOrigin = origin;
    }
  } else {
    // In development, allow all origins
    corsOrigin = origin || "*";
  }
  res.setHeader("Access-Control-Allow-Origin", corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/rooms" && req.method === "GET") {
    const activeRooms = Array.from(docs.keys());

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(activeRooms));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Yjs WebSocket server is running. API available at /api/rooms");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req);
});

server.listen(port, host, () => {
  console.log(`Yjs WebSocket server is running on ws://${host}:${port}`);
  console.log(`HTTP API is available at http://${host}:${port}/api/rooms`);
});
