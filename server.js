const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const sourcesFile = path.join(rootDir, "config", "sources.json");
const productsFile = path.join(publicDir, "data", "products.json");
const metadataFile = path.join(publicDir, "data", "crawl-meta.json");
const port = process.env.PORT || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload, null, 2));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveFile(urlPath) {
  const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const requested = safePath === "/" ? "index.html" : safePath.replace(/^[/\\]/, "");
  return path.join(publicDir, requested);
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/products") {
    sendJson(res, readJson(productsFile));
    return;
  }

  if (req.url === "/api/metadata") {
    sendJson(res, readJson(metadataFile));
    return;
  }

  if (req.url === "/api/sources") {
    sendJson(res, readJson(sourcesFile));
    return;
  }

  const filePath = resolveFile(req.url || "/");
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const finalPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(finalPath, (readError, content) => {
      if (readError) {
        res.writeHead(500);
        res.end("Internal Server Error");
        return;
      }

      res.writeHead(200, { "Content-Type": mimeType });
      res.end(content);
    });
  });
});

server.listen(port, () => {
  console.log(`LED Compare Platform running at http://localhost:${port}`);
});
