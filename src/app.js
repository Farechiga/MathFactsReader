import { FACTS, SETS } from "./facts.js";

const state = {
  mode: "random",
  set: null,
  running: false,
  current: null,
  history: [],
  audio: null,
  manifest: {},
  pauseMs: 2800
};

const playButton = document.querySelector("#playButton");
const pauseButton = document.querySelector("#pauseButton");
const modeButtons = document.querySelector("#modeButtons");
const pauseRange = document.querySelector("#pauseRange");
const pauseValue = document.querySelector("#pauseValue");

setupControls();
loadManifest();
render();

function setupControls() {
  const randomButton = document.createElement("button");
  randomButton.className = "mode-button active";
  randomButton.type = "button";
  randomButton.dataset.mode = "random";
  randomButton.textContent = "Random mix";
  modeButtons.append(randomButton);

  SETS.forEach((set) => {
    const button = document.createElement("button");
    button.className = "mode-button";
    button.type = "button";
    button.dataset.set = String(set);
    button.textContent = `${set}s`;
    modeButtons.append(button);
  });

  modeButtons.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.mode === "random") {
      state.mode = "random";
      state.set = null;
    } else {
      state.mode = "set";
      state.set = Number(button.dataset.set);
    }

    state.history = [];
    render();
    if (state.running) playNext();
  });

  playButton.addEventListener("click", () => {
    state.running = true;
    playNext();
    render();
  });

  pauseButton.addEventListener("click", () => {
    state.running = false;
    state.audio?.pause();
    window.speechSynthesis?.cancel();
    render();
  });

  pauseRange.addEventListener("input", () => {
    state.pauseMs = Number(pauseRange.value);
    pauseValue.textContent = `${(state.pauseMs / 1000).toFixed(1)} sec`;
  });
}

async function loadManifest() {
  try {
    const response = await fetch("./audio/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No audio manifest yet");
    state.manifest = await response.json();
  } catch {
    state.manifest = {};
  }
}

function render() {
  document.body.classList.toggle("is-playing", state.running);
  playButton.disabled = state.running;
  pauseButton.disabled = !state.running;

  document.querySelectorAll(".mode-button").forEach((button) => {
    const isActive =
      (state.mode === "random" && button.dataset.mode === "random") ||
      (state.mode === "set" && Number(button.dataset.set) === state.set);
    button.classList.toggle("active", isActive);
  });

}

async function playNext() {
  if (!state.running) return;

  const fact = chooseFact();
  state.current = fact;
  state.history.push(fact.id);
  state.history = state.history.slice(-10);
  render();

  await speak(fact);

  window.setTimeout(() => {
    if (state.running) playNext();
  }, state.pauseMs);
}

function chooseFact() {
  const pool =
    state.mode === "set"
      ? FACTS.filter((fact) => fact.a === state.set || fact.b === state.set)
      : FACTS;

  const candidates = pool.filter((fact) => !state.history.includes(fact.id));
  const available = candidates.length ? candidates : pool;

  if (state.mode === "set") {
    return available[Math.floor(Math.random() * available.length)];
  }

  const weighted = available.flatMap((fact) =>
    Array.from({ length: randomWeight(fact) }, () => fact)
  );
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function randomWeight(fact) {
  const hardNumbers = [6, 7, 8, 9, 11, 12];
  const easyNumbers = [2, 5, 10];
  let weight = 2;

  if (hardNumbers.includes(fact.a)) weight += 2;
  if (hardNumbers.includes(fact.b)) weight += 2;
  if (easyNumbers.includes(fact.a)) weight -= 1;
  if (easyNumbers.includes(fact.b)) weight -= 1;
  if (fact.a === fact.b) weight += 1;
  if (fact.type === "divide") weight += 1;

  return Math.max(1, weight);
}

function speak(fact) {
  const src = state.manifest[fact.id];
  if (src) return playAudio(src);
  return speakWithBrowserVoice(fact.text);
}

function playAudio(src) {
  return new Promise((resolve) => {
    state.audio?.pause();
    state.audio = new Audio(src);
    state.audio.addEventListener("ended", resolve, { once: true });
    state.audio.addEventListener("error", resolve, { once: true });
    state.audio.play().catch(resolve);
  });
}

function speakWithBrowserVoice(text) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve();
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-AU";
    utterance.rate = 0.86;
    utterance.pitch = 1.04;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    speechSynthesis.speak(utterance);
  });
}
