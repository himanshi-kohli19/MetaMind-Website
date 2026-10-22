import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDemoRequest } from "./form-validation.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const webhookUrl = process.env.DEMO_REQUEST_WEBHOOK_URL?.trim();
const requestWindows = new Map();
const maxBodyBytes = 16_384;
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function isRateLimited(address) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const previous = (requestWindows.get(address) || []).filter(time => now - time < windowMs);
  previous.push(now);
  requestWindows.set(address, previous);
  return previous.length > 5;
}

async function readJsonBody(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error("PAYLOAD_TOO_LARGE");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handleDemoRequest(request, response) {
  const address = request.socket.remoteAddress || "unknown";
  if (isRateLimited(address)) {
    sendJson(response, 429, { message: "Too many requests. Please wait and try again." });
    return;
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    const status = error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400;
    sendJson(response, status, { message: "We could not read that request. Please review the form and try again." });
    return;
  }

  const result = validateDemoRequest(payload);
  if (!result.valid) {
    sendJson(response, 422, { message: "Please correct the highlighted fields.", errors: result.errors });
    return;
  }

  if (!webhookUrl) {
    sendJson(response, 503, {
      message: "Demo requests are not connected yet. Your information has not been sent or stored."
    });
    return;
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.values.name,
        email: result.values.email,
        company: result.values.company,
        role: result.values.role,
        goal: result.values.goal,
        source: "metamind-website"
      }),
      signal: AbortSignal.timeout(8_000)
    });
    if (!upstream.ok) throw new Error("UPSTREAM_FAILED");
    sendJson(response, 200, { message: "Thanks — your demo request has been received." });
  } catch {
    sendJson(response, 502, {
      message: "We could not send your request right now. Your information was not stored. Please try again."
    });
  }
}

async function serveStatic(request, response) {
  const requestPath = new URL(request.url, `http://${request.headers.host}`).pathname;
  const requestedFile = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const safePath = normalize(requestedFile).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = join(root, safePath);

  try {
    const fileStats = await stat(filePath);
    if (fileStats.isDirectory()) filePath = join(filePath, "index.html");
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/api/demo-request") {
    await handleDemoRequest(request, response);
    return;
  }
  if (request.method === "GET" || request.method === "HEAD") {
    await serveStatic(request, response);
    return;
  }
  response.writeHead(405, { Allow: "GET, HEAD, POST" });
  response.end();
}).listen(port, host, () => {
  console.log(`Metamind website running at http://${host}:${port}`);
});
