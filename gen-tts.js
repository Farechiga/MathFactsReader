import { access, mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { FACTS } from "./src/facts.js";

const PROVIDER = readArg("--provider") || "google";
const ELEVENLABS_VOICE_KEY = readArg("--elevenlabs-voice") || "tom";
const ELEVENLABS_PRESETS = {
  tom: {
    label: "Tom",
    voiceId: "DYkrAHD8iwork3YSUBbs",
    folder: "audio-elevenlabs"
  },
  louise: {
    label: "Louise",
    voiceId: "UwtFVYnvYG6hxAbc4I6T",
    folder: "audio-elevenlabs-louise"
  },
  tanmoy: {
    label: "Tanmoy",
    voiceId: "2W8HrWcBFzCEf5cQQdIL",
    folder: "audio-elevenlabs-tanmoy"
  },
  lilian: {
    label: "Lilian",
    voiceId: "6qpxBH5KUSDb40bij36w",
    folder: "audio-elevenlabs-lilian"
  },
  drrosso: {
    label: "Dr. Rosso",
    voiceId: "L5zW3PqYZoWAeS4J1qMV",
    folder: "audio-elevenlabs-drrosso"
  },
  clay: {
    label: "Clay",
    voiceId: "0hh7H4ZVAtaGpm1VZyEN",
    folder: "audio-elevenlabs-clay"
  },
  savannah: {
    label: "Savannah",
    voiceId: "FNhoq0qHG3T8YOWzBtd6",
    folder: "audio-elevenlabs-savannah"
  },
  charlotte: {
    label: "Charlotte",
    voiceId: "xNtG3W2oqJs0cJZuTyBc",
    folder: "audio-elevenlabs-charlotte"
  },
  waldeck: {
    label: "Waldeck",
    voiceId: "RcEmXcISaHUgHOU4uNTz",
    folder: "audio-elevenlabs-waldeck"
  },
  adeya: {
    label: "Adeya",
    voiceId: "vDyhpISvKaEsK9QtEFlO",
    folder: "audio-elevenlabs-adeya"
  },
  cosimo: {
    label: "Cosimo",
    voiceId: "yowh82B72eMNrxcxHgBh",
    folder: "audio-elevenlabs-cosimo"
  },
  samara: {
    label: "Samara",
    voiceId: "19STyYD15bswVz51nqLf",
    folder: "audio-elevenlabs-samara"
  },
  callum: {
    label: "Callum",
    voiceId: "pp4ihOlfDr2MgdTALvoR",
    folder: "audio-elevenlabs-callum"
  },
  miri: {
    label: "Miri",
    voiceId: "ZR8ruiC9tbg7bV9RmBmC",
    folder: "audio-elevenlabs-miri"
  }
};
const ELEVENLABS_PRESET = ELEVENLABS_PRESETS[ELEVENLABS_VOICE_KEY] || ELEVENLABS_PRESETS.tom;
const ACCESS_TOKEN =
  PROVIDER === "elevenlabs"
    ? null
    : process.env.GOOGLE_OAUTH_ACCESS_TOKEN ||
  readArg("--token") ||
  getGcloudAccessToken();
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || readArg("--elevenlabs-key");

const VOICE_NAME = readArg("--voice") || "en-AU-Chirp-HD-D";
const ELEVENLABS_VOICE_ID = readArg("--voice-id") || ELEVENLABS_PRESET.voiceId;
const ELEVENLABS_MODEL_ID = readArg("--model") || "eleven_multilingual_v2";
const LANGUAGE_CODE = readArg("--lang") || "en-AU";
const QUOTA_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || readArg("--project");
const SPEAKING_RATE = Number(readArg("--rate") || "0.86");
const DELAY_MS = Number(readArg("--delay") || "750");
const MAX_RETRIES = Number(readArg("--retries") || "6");
const FORCE = process.argv.includes("--force");
const IS_ELEVENLABS = PROVIDER === "elevenlabs";
const OUTPUT_FOLDER = IS_ELEVENLABS ? ELEVENLABS_PRESET.folder : "audio";
const AUDIO_DIR = new URL(`./${OUTPUT_FOLDER}/`, import.meta.url);
const MANIFEST_PATH = new URL(`./${OUTPUT_FOLDER}/manifest.json`, import.meta.url);
const SAMPLE_VOICES = [
  "en-AU-Chirp3-HD-Charon",
  "en-AU-Chirp3-HD-Fenrir",
  "en-AU-Chirp3-HD-Orus",
  "en-AU-Chirp3-HD-Puck"
];
const SAMPLE_FACTS = [
  "Seven times eight equals fifty-six.",
  "Eighty-one divided by nine equals nine.",
  "Twelve times eleven equals one hundred thirty-two."
];
const SAMPLE_DIR = new URL("./voice-samples/", import.meta.url);

if (IS_ELEVENLABS && !ELEVENLABS_API_KEY) {
  console.error(
    [
      "Missing ElevenLabs API key.",
      "",
      "Create an API key in ElevenLabs, then run:",
      "  ELEVENLABS_API_KEY=\"your_key\" node gen-tts.js --provider elevenlabs",
      "",
      "The key stays local and is not used by the website."
    ].join("\n")
  );
  process.exit(1);
}

if (!IS_ELEVENLABS && !ACCESS_TOKEN) {
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

if (process.argv.includes("--sample-voices")) {
  await generateVoiceSamples();
  process.exit(0);
}

await mkdir(AUDIO_DIR, { recursive: true });

const manifest = {};
let completed = 0;

for (const fact of FACTS) {
  const fileName = `${fact.id}.mp3`;
  const filePath = new URL(fileName, AUDIO_DIR);

  if (!FORCE && await exists(filePath)) {
    manifest[fact.id] = `./${OUTPUT_FOLDER}/${fileName}`;
    completed += 1;
    console.log(`${completed}/${FACTS.length} skipped ${fact.text}`);
    await writeManifest();
    continue;
  }

  const audioContent = await synthesizeWithRetry(fact.text);
  await writeFile(filePath, Buffer.from(audioContent, "base64"));
  manifest[fact.id] = `./${OUTPUT_FOLDER}/${fileName}`;
  completed += 1;
  await writeManifest();

  console.log(`${completed}/${FACTS.length} ${fact.text}`);
  await sleep(DELAY_MS);
}

console.log(`Done. Wrote manifest for ${Object.keys(manifest).length} audio files to ${join(OUTPUT_FOLDER)}/`);

async function generateVoiceSamples() {
  await mkdir(SAMPLE_DIR, { recursive: true });

  let completedSamples = 0;
  const totalSamples = SAMPLE_VOICES.length * SAMPLE_FACTS.length;

  for (const voice of SAMPLE_VOICES) {
    for (const [index, text] of SAMPLE_FACTS.entries()) {
      const fileName = `${voice}-sample-${index + 1}.mp3`;
      const filePath = new URL(fileName, SAMPLE_DIR);

      if (!FORCE && await exists(filePath)) {
        completedSamples += 1;
        console.log(`${completedSamples}/${totalSamples} skipped ${fileName}`);
        continue;
      }

      const audioContent = await synthesizeWithRetry(text, voice);
      await writeFile(filePath, Buffer.from(audioContent, "base64"));
      completedSamples += 1;
      console.log(`${completedSamples}/${totalSamples} ${fileName}: ${text}`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`Done. Wrote voice samples to ${join("voice-samples")}/`);
}

async function synthesizeWithRetry(text, voiceName = VOICE_NAME) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await synthesize(text, voiceName);
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

async function synthesize(text, voiceName = VOICE_NAME) {
  if (IS_ELEVENLABS) {
    return synthesizeElevenLabs(text);
  }

  const audioConfig = { audioEncoding: "MP3" };

  if (!voiceName.includes("Chirp-HD") && !voiceName.includes("Chirp3-HD")) {
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
        name: voiceName
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

async function synthesizeElevenLabs(text) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: Number(readArg("--stability") || "0.31"),
          similarity_boost: Number(readArg("--similarity") || "0.48"),
          style: Number(readArg("--style") || "0.48"),
          speed: Number(readArg("--speed") || "0.81"),
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`ElevenLabs TTS failed for "${text}"\n${response.status} ${body}`);
    error.status = response.status;
    throw error;
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
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
