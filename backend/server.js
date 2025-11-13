// Используем CommonJS синтаксис ('require')
const { createServer } = require("http");
const { WebSocketServer } = require("ws");

// Обрати внимание: мы используем 'require' и путь без '.js'
const { setupWSConnection } = require("y-websocket/bin/utils");

const host = "localhost";
const port = 1234; // Порт для вебсокетов

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Yjs WebSocket server is running");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  // `setupWSConnection` делает ВСЮ магию Yjs
  setupWSConnection(ws, req);
});

server.listen(port, host, () => {
  console.log(`✅ Yjs WebSocket-сервер запущен на ws://${host}:${port}`);
});
