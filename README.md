# Aussie Math Facts

A tiny GitHub Pages app that continuously narrates multiplication and division facts in a different voices, while a child writes the answers in a notebook.


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

To sample alternate Chirp3 voices without changing the production audio, run:

```bash
GOOGLE_CLOUD_PROJECT="your-project-id" node gen-tts.js --sample-voices
```

This writes three sample readings for each voice into the local, gitignored `voice-samples/` folder.

## Generate ElevenLabs audio

The app can switch between the original Google clips and ElevenLabs voice sets. Create an ElevenLabs API key, then run:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:tom
```

Tom uses voice ID `DYkrAHD8iwork3YSUBbs` and writes files into `audio-elevenlabs/`.

Louise uses voice ID `UwtFVYnvYG6hxAbc4I6T` and writes files into `audio-elevenlabs-louise/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:louise
```

Tanmoy uses voice ID `2W8HrWcBFzCEf5cQQdIL` and writes files into `audio-elevenlabs-tanmoy/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:tanmoy
```

Lilian uses voice ID `6qpxBH5KUSDb40bij36w` and writes files into `audio-elevenlabs-lilian/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:lilian
```

Dr. Rosso uses voice ID `L5zW3PqYZoWAeS4J1qMV` and writes files into `audio-elevenlabs-drrosso/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:drrosso
```

Clay uses voice ID `0hh7H4ZVAtaGpm1VZyEN` and writes files into `audio-elevenlabs-clay/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:clay
```

Savannah uses voice ID `FNhoq0qHG3T8YOWzBtd6` and writes files into `audio-elevenlabs-savannah/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:savannah
```

Charlotte uses voice ID `xNtG3W2oqJs0cJZuTyBc` and writes files into `audio-elevenlabs-charlotte/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:charlotte
```

Waldeck uses voice ID `RcEmXcISaHUgHOU4uNTz` and writes files into `audio-elevenlabs-waldeck/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:waldeck
```

Adeya uses voice ID `vDyhpISvKaEsK9QtEFlO` and writes files into `audio-elevenlabs-adeya/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:adeya
```

Cosimo uses voice ID `yowh82B72eMNrxcxHgBh` and writes files into `audio-elevenlabs-cosimo/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:cosimo
```

Samara uses voice ID `19STyYD15bswVz51nqLf` and writes files into `audio-elevenlabs-samara/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:samara
```

Callum uses voice ID `pp4ihOlfDr2MgdTALvoR` and writes files into `audio-elevenlabs-callum/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:callum
```

Miri uses voice ID `ZR8ruiC9tbg7bV9RmBmC` and writes files into `audio-elevenlabs-miri/`:

```bash
ELEVENLABS_API_KEY="your_key" npm run tts:miri
```

Both use `eleven_multilingual_v2`. The key stays local and is never included in the website.

To tweak the delivery settings:

```bash
ELEVENLABS_API_KEY="your_key" node gen-tts.js --provider elevenlabs --elevenlabs-voice louise --speed 0.81 --stability 0.31 --similarity 0.48 --style 0.48
```

## Publish on GitHub Pages

1. Run the TTS script.
2. Commit the generated `audio/*.mp3` and `audio/manifest.json` files.
3. Push to GitHub.
4. In the repository settings, enable GitHub Pages from the main branch root.

## Practice modes

- `Random mix` uses weighted random selection across all facts. Harder facts involving 6, 7, 8, 9, 11, and 12 appear more often. Easier 2s, 5s, and 10s appear less often.
- `2s` through `12s` focus on one fact family at a time.
