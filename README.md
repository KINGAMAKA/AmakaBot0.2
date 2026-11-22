# Amaka AI, version 0.1: Living Face

An African-inspired digital face that blinks, looks around and changes expression. It runs in the phone's browser and installs like an app (PWA).

## What this version does

- Animated SVG face: two eyes, blinking, eye movement, glowing bronze ornament, no mouth.
- Eight expressions: idle, listening, thinking, speaking, happy, concerned, curious, sleeping.
- Text box. Amaka reacts to what you type, but **replies are fixed preview lines, not AI**.
- Settings (glow, reduce motion, eyes follow finger, auto-sleep), saved on the device.
- Installable, and opens offline after the first load.
- Menu → "What works" lists what is built and what is not.

## What this version does not do

No voice, no AI model, no memory, no camera, no sensors, no 3D. Those are versions 0.3 to 0.9. I have checked the code for syntax errors but have not seen it run on a phone, so every feature is marked "Needs your test" until you confirm it.

## Files

All files sit in one flat folder on purpose: Android's browser can upload many files at once, but cannot upload folders to GitHub.

| File | Job |
|---|---|
| index.html | Page structure and the face drawing (SVG) |
| style.css | Look and layout |
| main.js | Starts everything and connects the parts |
| face.js | Animation engine (states, blinking, gaze, glow) |
| chat.js | Text conversation and preview replies |
| settings.js | Settings values, saving, menu controls |
| status.js | The honest feature list in the menu |
| sw.js | Offline caching |
| manifest.webmanifest, icon-*.png, icon.svg | Install details and icons |

### How the parts talk

`main.js` creates the face and passes it to `chat.js`. Chat only ever calls `face.setState("thinking")` and similar. `face.js` reads `settings` but knows nothing about chat, storage or voice. Later modules (voice, brain, memory, camera) follow the same rule: they get the face object and set states, never touch the drawing.

## Put it online (all on your phone)

### 1. Unzip
Open the ZIP in **Files by Google** → tap it → **Extract**. You get a folder with 14 files.

### 2. GitHub
1. Open github.com in Chrome and sign in.
2. Tap **+** (top right) → **New repository**. Name it `amaka-ai`. Choose **Public** (or Private, both work with Vercel). Tap **Create repository**.
3. On the new page tap **uploading an existing file**.
4. Tap **choose your files**, open the extracted folder, tap the three dots → **Select all**, then **Open**. Wait until all 14 files are listed.
5. Scroll down and tap **Commit changes**.

### 3. Vercel
1. Open vercel.com → **Continue with GitHub** and sign in.
2. Tap **Add New…** → **Project**. Find `amaka-ai` → **Import**. If it is missing, tap **Adjust GitHub App Permissions** and allow the repository.
3. Leave every setting as it is (Framework Preset: Other). Tap **Deploy**.
4. When it finishes, tap the preview image or **Visit** to open your link.

### 4. Install on the phone
Open your Vercel link in Chrome → three dots → **Add to Home screen** (or **Install app**). Open Amaka from the home screen.

### 5. Test offline
Open the installed app once with internet, close it, switch on airplane mode and open it again. The face should still appear.

## Updating later

On GitHub open the file → pencil icon → paste the new contents → **Commit changes**, or upload the new files again (same names replace the old ones). Vercel redeploys by itself in about a minute. Close and reopen the app twice to see the new version (the offline cache refreshes in the background).

## PWA now, native Android later

| | PWA (now) | Native Android app (later) |
|---|---|---|
| Install | From the browser, no Play Store | APK or Play Store |
| Works offline | Yes, the interface | Yes |
| Microphone, camera | Yes, with permission prompts | Yes |
| Running a local AI model | Only through a bridge, or slowly inside the browser | Directly, fastest option |
| Launching apps, device actions, wake word | No | Yes |
| Effort | Done | Wrap this same code (e.g. with Capacitor) and add native parts |

The code is built so the interface can be wrapped later without a rewrite.

## About the local brain (version 0.4, not built)

PocketPal keeps Gemma inside its own app, so a website cannot reach it. My current recommendation, to be confirmed when we get there: run llama.cpp's local server in Termux on the phone with Gemma 3 1B (a small quantised file fits 4 GB RAM) and have Amaka call it on `localhost`. The longer-term route is a native Android build with llama.cpp inside. Nothing here is connected yet.

---

## Version 0.2 to 0.7 additions

New files: `voice.js`, `brain.js`, `memory.js`, `memory-ui.js`, `sensors.js` (upload them with the rest; same names replace the old ones). You now have **19 files**.

### What is new (all "Needs your test")
- **Microphone button** next to Send. Tap, speak, and the words are sent automatically. Chrome uses Google's speech service, so it needs internet. Offline recognition is not built.
- **Spoken replies**: menu → Voice → switch on "Speak replies aloud", pick a voice and speed. Uses the voices already on your phone.
- **Memory**: type `remember that my studio opens at 9` (or add in the menu). Amaka keeps it on the phone after you close the app. View, edit and delete in menu → Memory. Ask "what do you remember?" to hear it. The last 12 messages also come back when you reopen.
- **Shake reaction**: shake the phone and Amaka looks concerned (wakes her if asleep). Switch off in settings.
- **AI brain**: code is in place but **not tested**, see below.

### Connecting Gemma to Amaka (untested)
PocketPal cannot be reached by a website, so this uses Termux. Commands as I understand them; if one fails, send me the exact error text.
1. Install **Termux** from F-Droid (the Play Store version is outdated).
2. In Termux: `pkg update` then `pkg install llama-cpp`.
3. Start the server with a Gemma 3 1B model, for example: `llama-server -hf ggml-org/gemma-3-1b-it-GGUF --port 8080` (the first run downloads the model, about 1 GB, so use Wi-Fi). Leave Termux running.
4. In Amaka: menu → AI brain → **Test connection** → if it says Connected, switch on **Use local model**.

If Chrome blocks the connection from the https page, tell me what the AI brain section says and I will change the approach. With 4 GB RAM, expect slow replies and keep other apps closed.

## Not built yet
Camera and face detection (0.6), tilt and proximity (0.7), 3D avatar (0.8), Android control and "Hey Amaka" wake word (0.9) and the native app (1.0). The last two need a real Android build, which cannot be compiled from a phone browser alone; we can set up a cloud build with GitHub Actions when we get there.
