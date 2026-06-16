# Aussie Math Facts

A tiny GitHub Pages app that continuously narrates multiplication and division facts from 2s through 12s while a child writes the answers in a notebook.

## Local preview

```bash
npm run serve
```

Open `http://localhost:8080`.

## Generate Google TTS audio

This script uses local Google OAuth credentials. It does not put a secret in the website or in the generator file.

First install the Google Cloud CLI. On macOS with Homebrew:

```bash
brew install --cask google-cloud-sdk
```

Open a new terminal window, then sign in:

```bash
gcloud auth application-default login
```

Then generate the audio snippets:

```bash
npm run tts
```

If Google asks for a quota or billing project, run:

```bash
GOOGLE_CLOUD_PROJECT="your-project-id" npm run tts
```

The default voice is `en-AU-Chirp-HD-D`. Optional voice setting:

```bash
node gen-tts.js --voice en-AU-Chirp-HD-D
```

The script writes MP3 files into `audio/` and creates `audio/manifest.json`. The browser app uses those files when they exist. If they do not exist yet, it falls back to the browser's built-in speech voice for local preview.

Each fact is recorded as its own individual snippet. The pause between snippets is controlled in the web app with the pause slider, so the generated MP3 files stay clean.

If Google returns a temporary quota/rate-limit error, rerun the same command. Existing MP3 files are skipped automatically. You can slow requests down further with:

```bash
GOOGLE_CLOUD_PROJECT="your-project-id" node gen-tts.js --delay 2500 --retries 8
```

## Publish on GitHub Pages

1. Run the TTS script.
2. Commit the generated `audio/*.mp3` and `audio/manifest.json` files.
3. Push to GitHub.
4. In the repository settings, enable GitHub Pages from the main branch root.

## Practice modes

- `Random mix` uses weighted random selection across all facts. Harder facts involving 6, 7, 8, 9, 11, and 12 appear more often. Easier 2s, 5s, and 10s appear less often.
- `2s` through `12s` focus on one fact family at a time.
