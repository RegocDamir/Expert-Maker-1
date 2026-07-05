import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.EXPERT_MAKER_EXPORT_PORT || 4177);
let rendering = false;

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${PORT}`);

    if (request.method === "POST" && url.pathname === "/api/export-video") {
      await handleExport(request, response);
      return;
    }

    serveStatic(url, response);
  } catch (error) {
    sendJson(response, 500, { ok: false, error: String(error.message || error) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}/index.html`;
  console.log(`Expert Maker Studio: ${url}`);
  openBrowser(url);
});

async function handleExport(request, response) {
  if (rendering) {
    sendJson(response, 409, { ok: false, error: "A render is already running." });
    return;
  }

  const payload = await readJson(request);
  if (!payload?.state || typeof payload.state !== "object") {
    sendJson(response, 400, { ok: false, error: "Missing render state." });
    return;
  }

  rendering = true;
  try {
    const width = clampInteger(payload.width, 1920, 640, 7680);
    const height = clampInteger(payload.height, 1080, 360, 4320);
    const exportDir = resolve(ROOT, "exports");
    mkdirSync(exportDir, { recursive: true });
    const statePath = join(exportDir, "expert-maker-overlay-ui-state.json");
    const outputPath = join(exportDir, `expert-maker-overlay-${width}x${height}-${timestamp()}.mp4`);
    writeFileSync(statePath, JSON.stringify({ state: payload.state }, null, 2), "utf8");

    await runNode([
      join(ROOT, "scripts", "export-video.mjs"),
      "--state", statePath,
      "--out", outputPath,
      "--width", String(width),
      "--height", String(height)
    ]);

    sendJson(response, 200, { ok: true, output: outputPath, width, height });
  } catch (error) {
    sendJson(response, 500, { ok: false, error: String(error.message || error) });
  } finally {
    rendering = false;
  }
}

function clampInteger(value, fallback, min, max) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function runNode(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stderr = "";

    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(new Error(stderr.trim() || `Renderer exited with code ${code}.`));
      }
    });
  });
}

function readJson(request) {
  return new Promise((resolveRead, rejectRead) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 150 * 1024 * 1024) {
        request.destroy();
        rejectRead(new Error("Request body is too large."));
      }
    });
    request.on("end", () => {
      try {
        resolveRead(JSON.parse(body || "{}"));
      } catch (error) {
        rejectRead(error);
      }
    });
    request.on("error", rejectRead);
  });
}

function serveStatic(url, response) {
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = resolve(join(ROOT, pathname));

  if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": contentType(filePath) });
  createReadStream(filePath).pipe(response);
}

function sendJson(response, status, data) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function contentType(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js" || ext === ".mjs") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".ttf") return "font/ttf";
  return "application/octet-stream";
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

