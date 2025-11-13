const { createServer } = require("http");
const { WebSocketServer } = require("ws");

const { setupWSConnection } = require("y-websocket/bin/utils");

const host = "localhost";
const port = 1234;

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Yjs WebSocket server is running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  setupWSConnection(ws, req);
});

server.listen(port, host, () => {
  console.log(`Yjs WebSocket server is running on ws://${host}:${port}`);
});
