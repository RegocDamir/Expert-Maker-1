import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const STORAGE_KEY = "expert_maker_overlay_layout_v1";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const fps = Number(args.fps || 30);
const width = Number(args.width || 1920);
const height = Number(args.height || 1080);
const outputPath = resolve(args.out || "exports/expert-maker-overlay.mp4");
const frameDir = resolve(args.frames || join("exports", "frames"));
const ffmpegPath = findFfmpeg(args.ffmpeg);
const state = readState(args.state);

if (!Number.isFinite(fps) || fps <= 0) throw new Error("--fps must be a positive number.");
if (!Number.isFinite(width) || width <= 0) throw new Error("--width must be a positive number.");
if (!Number.isFinite(height) || height <= 0) throw new Error("--height must be a positive number.");

const playwright = await loadPlaywright();
mkdirSync(resolve("exports"), { recursive: true });
rmSync(frameDir, { recursive: true, force: true });
mkdirSync(frameDir, { recursive: true });

const server = await startServer();
const browser = await playwright.chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  if (state) {
    await page.addInitScript(({ key, value }) => {
      localStorage.setItem(key, JSON.stringify(value));
    }, { key: STORAGE_KEY, value: state });
  }

  await page.goto(`${server.url}/index.html?output=1&render=1`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.SpaceCastGuide && document.querySelector(".presentation-guide-layer:not([hidden])"));
  const timeline = await page.evaluate(() => {
    window.SpaceCastGuide.restartForExport();
    return window.SpaceCastGuide.getExportTimeline();
  });

  const seconds = timeline.reduce((total, item) => total + Number(item.seconds || 0), 0);
  const frameCount = Math.max(1, Math.ceil(seconds * fps));
  const stage = page.locator(".capture-desktop");
  const startedAt = Date.now();

  for (let index = 0; index < frameCount; index += 1) {
    const framePath = join(frameDir, `frame-${String(index + 1).padStart(5, "0")}.png`);
    await stage.screenshot({ path: framePath });
    const nextFrameAt = startedAt + ((index + 1) * 1000 / fps);
    const waitMs = Math.max(0, nextFrameAt - Date.now());
    if (waitMs > 0) await page.waitForTimeout(waitMs);
  }

  encodeVideo(frameDir, outputPath, fps, ffmpegPath);
  console.log(`Exported ${basename(outputPath)} from ${frameCount} frames.`);
} finally {
  await browser.close();
  server.close();
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    throw new Error("Playwright is not installed. Run `npm install` in this folder first.");
  }
}

function readState(path) {
  if (!path) return null;
  const json = JSON.parse(readFileSync(resolve(path), "utf8"));
  return json.state || json;
}

function findFfmpeg(explicitPath) {
  const candidates = [
    explicitPath,
    "E:\\ffmpeg-8-1-1\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe",
    "ffmpeg"
  ].filter(Boolean);

  return candidates.find((candidate) => {
    if (candidate === "ffmpeg") return true;
    return existsSync(resolve(candidate));
  }) || "ffmpeg";
}

function encodeVideo(frames, out, rate, ffmpeg) {
  mkdirSync(dirname(out), { recursive: true });
  const result = spawnSync(ffmpeg, [
    "-y",
    "-framerate", String(rate),
    "-i", join(frames, "frame-%05d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    out
  ], { stdio: "inherit" });

  if (result.error) {
    throw new Error(`FFmpeg was not found at ${ffmpeg}. Use --ffmpeg <path-to-ffmpeg.exe>.`);
  }
  if (result.status !== 0) {
    throw new Error(`FFmpeg failed with exit code ${result.status}.`);
  }
}

function startServer() {
  const server = createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = resolve(join(ROOT, pathname));

    if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": contentType(filePath) });
    createReadStream(filePath).pipe(response);
  });

  return new Promise((resolveServer, rejectServer) => {
    server.once("error", rejectServer);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({
        url: `http://127.0.0.1:${address.port}`,
        close: () => server.close()
      });
    });
  });
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

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

