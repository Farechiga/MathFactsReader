import { access, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { FACTS } from "./src/facts.js";

const ACCESS_TOKEN =
  process.env.GOOGLE_OAUTH_ACCESS_TOKEN ||
  readArg("--token") ||
  getGcloudAccessToken();

const VOICE_NAME = readArg("--voice") || "en-AU-Chirp-HD-D";
const LANGUAGE_CODE = readArg("--lang") || "en-AU";
const QUOTA_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || readArg("--project");
const SPEAKING_RATE = Number(readArg("--rate") || "0.86");
const DELAY_MS = Number(readArg("--delay") || "750");
const MAX_RETRIES = Number(readArg("--retries") || "6");
const FORCE = process.argv.includes("--force");
const AUDIO_DIR = new URL("./audio/", import.meta.url);
const MANIFEST_PATH = new URL("./audio/manifest.json", import.meta.url);

if (!ACCESS_TOKEN) {
  console.error(
    [
      "Missing Google OAuth token.",
      "",
      "Install the Google Cloud CLI, then run:",
      "  gcloud auth application-default login",
      "",
      "After that, run:",
      "  npm run tts",
      "",
      "You can also pass a token directly:",
      "  GOOGLE_OAUTH_ACCESS_TOKEN=\"$(gcloud auth application-default print-access-token)\" npm run tts"
    ].join("\n")
  );
  process.exit(1);
}

await mkdir(AUDIO_DIR, { recursive: true });

const manifest = {};
let completed = 0;

for (const fact of FACTS) {
  const fileName = `${fact.id}.mp3`;
  const filePath = new URL(fileName, AUDIO_DIR);

  if (!FORCE && await exists(filePath)) {
    manifest[fact.id] = `./audio/${fileName}`;
    completed += 1;
    console.log(`${completed}/${FACTS.length} skipped ${fact.text}`);
    await writeManifest();
    continue;
  }

  const audioContent = await synthesizeWithRetry(fact.text);
  await writeFile(filePath, Buffer.from(audioContent, "base64"));
  manifest[fact.id] = `./audio/${fileName}`;
  completed += 1;
  await writeManifest();

  console.log(`${completed}/${FACTS.length} ${fact.text}`);
  await sleep(DELAY_MS);
}

console.log(`Done. Wrote manifest for ${Object.keys(manifest).length} audio files to ${join("audio")}/`);

async function synthesizeWithRetry(text) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await synthesize(text);
    } catch (error) {
      if (!isRetryable(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const waitMs = Math.round((2 ** attempt) * 3000 + Math.random() * 1000);
      console.warn(
        `Google throttled the request. Waiting ${(waitMs / 1000).toFixed(1)}s before retry ${attempt + 1}/${MAX_RETRIES}.`
      );
      await sleep(waitMs);
    }
  }
}

async function synthesize(text) {
  const audioConfig = { audioEncoding: "MP3" };

  if (!VOICE_NAME.includes("Chirp-HD") && !VOICE_NAME.includes("Chirp3-HD")) {
    audioConfig.speakingRate = SPEAKING_RATE;
    audioConfig.pitch = 2;
  }

  const headers = {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  };

  if (QUOTA_PROJECT) {
    headers["x-goog-user-project"] = QUOTA_PROJECT;
  }

  const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: LANGUAGE_CODE,
        name: VOICE_NAME
      },
      audioConfig
    })
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Google TTS failed for "${text}"\n${response.status} ${body}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.audioContent;
}

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function getGcloudAccessToken() {
  try {
    return execFileSync("gcloud", ["auth", "application-default", "print-access-token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return null;
  }
}

function isRetryable(error) {
  return error.status === 429 || error.status === 500 || error.status === 502 || error.status === 503 || error.status === 504;
}

async function writeManifest() {
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
