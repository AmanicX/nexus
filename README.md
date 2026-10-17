<div align="center">

# Nexus

**A multi-theme, memory-aware AI character chat studio for desktop, web and Android.**

Bring your own model — [Groq](https://console.groq.com/keys), OpenRouter, OpenAI, or a **local** model via Ollama/LM Studio · craft characters & worlds · chat with rich role-play controls · packaged natively for **Windows** and **Linux**, installable as a **web app (PWA)**, with an **Android** project in the repo.

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-4c9aff)

</div>

---

## What is Nexus?

**Nexus is a desktop studio for creating AI characters and talking to them.** Most AI chat apps give you a single blank text box. Nexus gives you the whole set: define a character's name, avatar, personality and opening line, drop them into a world, and role-play in a conversation that actually remembers what came before.

It is built for **role-players, storytellers and tinkerers** — people who want characters with personality, scene control, and a model that does not lecture them. Nexus is **uncensored by design**: the default system prompt allows mature, unfiltered fiction and never inserts refusals or moralising. The content is yours.

The app ships with **three distinct modes**, each with its own look and behaviour:

- **Chatbot** — a clean, focused companion/assistant. Near-black surface, iOS blue accents.
- **Anime** — character-driven role-play with a themed cast, avatars and backdrops. Dark purple with iOS purple/pink.
- **World** — a living, simulated world. Reputation, notable events and notes persist and evolve as you play, tracked in a hidden state block that the app applies for you.

**Privacy and control come first.** Nexus runs natively on your machine and its interface works fully offline. It only contacts the AI provider *you* choose — there is no account, no telemetry, and no bundled API key. Use a hosted provider (**Groq**, **OpenRouter**, **OpenAI**) or a fully local model via **Ollama** / **LM Studio** on your own hardware.

Under the hood it is a **React + TypeScript + Vite** app wrapped in **Electron**, speaking the standard **OpenAI-compatible API** with any endpoint you point it at. The result is a fast, native-feeling desktop app with streaming replies, three hand-tuned themes, and a full character/world creator. The same UI is also published as an installable **web app (PWA)** at [amanicx.github.io/nexus/app](https://amanicx.github.io/nexus/app/) and ships with an **Android** project for building an APK.

> **Installing is easy and needs no technical skills:** on Windows, download the `.exe`; on Linux, clone this repo and run one script; on a phone or tablet, open the web app in your browser and tap **Install**. No Node.js, no npm, no compiling.

---

## Table of contents

- [What is Nexus?](#what-is-nexus)
- [Features](#features)
- [Download & install](#download--install)
  - [Windows](#windows)
  - [Linux](#linux)
    - [Recommended: the install script](#recommended--the-install-script)
    - [Alternative: download a package directly](#alternative--download-a-package-directly)
    - [Uninstalling](#uninstalling)
  - [Web app (install as an app)](#web-app-install-as-an-app)
  - [Android (build the APK)](#android-build-the-apk)
- [Connect a model (first run)](#connect-a-model-first-run)
- [Command reference](#command-reference)
- [Troubleshooting](#troubleshooting)
- [For developers (build from source)](#for-developers-build-from-source)
- [For maintainers (publishing releases)](#for-maintainers-publishing-releases)
- [Project structure](#project-structure)
- [License & disclaimer](#license--disclaimer)

---

## Features

- **Three isolated themes** — `Chatbot` (near-black + iOS blue), `Anime` (dark purple + iOS purple/pink), and `World` (dark green + iOS green). Each theme has its own palette, layout and behaviour, not just a colour swap.
- **Character & world creator** — design characters with avatars, personalities and greetings; build worlds whose state (reputation, events, notes) persists across the chat.
- **Per-conversation memory** — the app keeps a running summary so long conversations stay coherent.
- **Rich command syntax** — mark thoughts, actions, NPC lines, god-commands and world-commands inline (see the [command reference](#command-reference)).
- **Uncensored by default** — the system prompt allows mature, unfiltered role-play and **you choose the model**. Point Nexus at hosted models or a local, unfiltered one. You are responsible for what you generate.
- **Any provider, any model** — works with any OpenAI-compatible API: **Groq**, **OpenRouter**, **OpenAI**, or fully local models via **Ollama** and **LM Studio**. Fetch and search the provider's live model list, or type any model id.
- **Offline-capable** — with a local model (Ollama/LM Studio) the app works entirely offline. No accounts, no telemetry, no bundled keys.
- **Everywhere** — one codebase, four ways to run it: a Windows `.exe`, Linux packages (+ AppImage), an installable **web app (PWA)**, and an **Android APK** built from the Capacitor project in this repo.

---

## Download & install

### Windows

1. Open the [**Releases**](../../releases) page and download **`Nexus Setup <version>.exe`**.
2. Run it. If Windows SmartScreen appears ("Windows protected your PC"), click **More info → Run anyway** (the app is not code-signed yet).
3. Choose an install folder and finish. Nexus appears in the **Start menu** and comes with an uninstaller.

That's it — the `.exe` is the complete app. Nothing else to install.

### Linux

Nexus ships as real packages for every major family — **Debian/Ubuntu/Mint**, **Fedora/RHEL**, **openSUSE** and **Arch/Manjaro** — plus a universal **AppImage**. You never compile anything.

#### Recommended: the install script

Clone the repo and run the installer. It detects your distro, downloads the correct package from the [latest release](../../releases/latest), and installs it:

```bash
git clone https://github.com/AmanicX/nexus.git
cd nexus
bash install.sh
```

Useful flags:

```bash
bash install.sh --appimage   # user-only install into ~/.local (no sudo / no root)
bash install.sh --package    # force the native deb/rpm/pacman package
bash install.sh --help
```

- Installing a system package asks for your password (`sudo`).
- If no native package matches your distro, it automatically falls back to the AppImage.
- AppImages need **FUSE**. If one fails to start, install it once:
  - Debian/Ubuntu/Mint: `sudo apt install libfuse2`
  - Fedora/RHEL: `sudo dnf install fuse fuse-libs`
  - Arch/Manjaro: `sudo pacman -S fuse2`
  - No FUSE (containers/VMs)? run with `--appimage-extract-and-run`.

#### Alternative: download a package directly

Prefer to install it yourself? Grab the file from the [Releases](../../releases) page and use your package manager (all four families supported):

```bash
# Debian / Ubuntu / Mint  (file ends in .deb)
sudo apt install ./nexus_<version>_amd64.deb

# Fedora / RHEL / Rocky / AlmaLinux  (file ends in .rpm)
sudo dnf install ./nexus-<version>.x86_64.rpm

# openSUSE / SLES  (file ends in .rpm)
sudo zypper install ./nexus-<version>.x86_64.rpm

# Arch / Manjaro / EndeavourOS  (file ends in .pacman)
sudo pacman -U ./nexus-<version>.pacman

# Any distro, no install  (file ends in .AppImage)
chmod +x Nexus-<version>.AppImage && ./Nexus-<version>.AppImage
```

#### Uninstalling

| Installed via | Remove with |
| ------------- | ----------- |
| Windows installer | Settings → Apps → *Nexus* → Uninstall |
| Debian package | `sudo apt remove nexus` |
| RPM package | `sudo dnf remove nexus` (or `sudo zypper remove nexus`) |
| Pacman package | `sudo pacman -R nexus` |
| AppImage | delete the `.AppImage` (and `~/.local/bin/nexus` if you used the script) |

### Web app (install as an app)

Nexus also runs in the browser, served from this repository's GitHub Pages site: **<https://amanicx.github.io/nexus/app/>**

1. Open that link on your phone, tablet or computer.
2. In **Settings → Connection**, enter your provider and key as usual — it is the same app as the desktop build.
3. **Install it** so it opens like a native app:
   - **Android / Chrome** — menu (⋮) → **Add to Home screen** → **Install**.
   - **iPhone / iPad / Safari** — Share sheet → **Add to Home Screen**.
   - **Desktop Chrome / Edge** — install icon at the right of the address bar.
   - **Firefox** — menu → **Install Site**.

It is a full **PWA**: an app icon, full-screen standalone window, offline app shell (cached by a service worker), safe-area handling for notches, and a chat layout tuned for touch. Settings, characters, worlds and chats persist in your browser's storage on that device.

The web app and the desktop app store their data **separately** — installing one does not migrate the other.

### Android (build the APK)

The repository ships a full **Capacitor** Android project under [`android/`](android/) (app id `com.nexus.chatstudio`, name **Nexus**), using the same web build as the browser app. To produce an installable `.apk` you need a machine with the Android toolchain — end users should just sideload the built file.

**1. Install the prerequisites**

- **JDK 17** (Temurin or OpenJDK 17). Set `JAVA_HOME` to it.
- **Android SDK** with **Platform 36** and **Build-Tools** (easiest via [Android Studio](https://developer.android.com/studio) → SDK Manager), or the standalone command-line tools. The Gradle wrapper pins Gradle 8.14.3; `minSdk` is 24 (Android 7.0).

On Windows, set the SDK path so Gradle can find it — create `android/local.properties` (it is gitignored):

```properties
sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

On macOS/Linux the same file takes a plain path (`sdk.dir=/home/<you>/Android/Sdk`), or you can export `ANDROID_HOME` instead.

**2. Build the web assets and sync them into the project**

```bash
npm install
npm run cap:sync        # = npm run build:web && npx cap sync android
```

**3. Build the APK**

```bash
cd android
./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
```

The debug APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`. For a release build, create a keystore and run `./gradlew assembleRelease` after setting `signingConfigs` in `android/app/build.gradle`.

**4. Install it**

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

…or copy the `.apk` to the phone and open it (enable **Install unknown apps** for your file manager first).

> **Why `allowMixedContent` is on:** the Android manifest allows cleartext HTTP so the app can reach a **local model on your LAN** (e.g. Ollama or LM Studio running on a PC at `http://192.168.x.x:11434/v1`). Hosted providers are still contacted over HTTPS.

To open the project in **Android Studio** instead of the CLI: `npm run cap:open`.

---

## Connect a model (first run)

Nexus talks to any **OpenAI-compatible** endpoint. Open **Settings → Connection** and set three things:

1. **Provider** — pick a preset (Groq, OpenRouter, LM Studio, Ollama, OpenAI) or paste your own **Base URL**.
2. **API key** — paste your key (not needed for local providers).
3. **Model** — press **↻** to fetch the provider's live model list, search it, and click a model — or type any model id.

| Provider | Base URL | Get a key |
| -------- | -------- | --------- |
| Groq | `https://api.groq.com/openai/v1` | <https://console.groq.com/keys> |
| OpenRouter | `https://openrouter.ai/api/v1` | <https://openrouter.ai/keys> |
| Ollama (local) | `http://localhost:11434/v1` | none |
| LM Studio (local) | `http://localhost:1234/v1` | none |
| OpenAI | `https://api.openai.com/v1` | <https://platform.openai.com/api-keys> |

Keys are stored **only on your machine** and are never bundled into the app or committed to this repository.

### Fully uncensored with a local model (Ollama)

Hosted models still carry their own safety training. For the most unfiltered output, run a model on your own machine — nothing leaves your computer:

```bash
# 1. install Ollama from https://ollama.com, then:
ollama pull llama3.2          # or a freer model, e.g. mistral-nemo / dolphin-mixtral
ollama serve                  # if it is not already running

# 2. in Nexus → Settings → Connection:
#    Provider = Ollama   ·   press ↻ to list your installed models   ·   pick one
```

---

## Command reference

Type these anywhere in a message while chatting:

| You write | Meaning |
| --------- | ------- |
| `(thinking...)` | Your character's inner thoughts |
| `"doing something"` | Your character's action |
| `(thinking...: Mira)` | Another character's thoughts |
| `"doing something": Mira` | Another character's action |
| `<something>` | A "god" command — forces an event to happen |
| `[something]` | A world command — shifts the world or its state |

In the **World** theme the model may also emit a hidden `<!--state {"reputation":{...},"events":[...],"notes":"..."}-->` block. The app reads it to update world state and then hides it from the chat.

---

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `install.sh`: *"Could not detect the GitHub repo"* | Run it inside the cloned folder, or set `NEXUS_REPO=owner/repo bash install.sh`. |
| `install.sh`: *"no release exists yet"* | The maintainer hasn't published a release — see [For maintainers](#for-maintainers-publishing-releases). |
| AppImage: *"error loading libfuse.so.2"* | `sudo apt install libfuse2` (Debian/Ubuntu), `sudo pacman -S fuse2` (Arch), or run with `--appimage-extract-and-run`. |
| AppImage won't start | It must be executable: `chmod +x Nexus-*.AppImage`. |
| `.deb` fails with unmet dependencies | `sudo dpkg -i nexus_*.deb && sudo apt --fix-broken install`. |
| Windows shows *"Windows protected your PC"* | Expected for unsigned apps: **More info → Run anyway**. |
| Replies show "401" / "invalid key" | Check the key **and** Base URL in **Settings → Connection**. |
| Local model: *"Failed to fetch"* | Make sure Ollama/LM Studio is running and the Base URL port matches (`11434` / `1234`). |
| Replies stop mid-way, mentions rate limit | Hosted providers cap tokens/min — wait a few seconds, or use a local model. |

---

## For developers (build from source)

You only need this if you want to modify Nexus. End users should use the installers above.

**Requirements:** Node.js **20+** and npm (developed against Node 26), and Git.

```bash
git clone https://github.com/AmanicX/nexus.git
cd nexus
npm install

npm run electron:dev   # desktop app with hot-reload
npm run dev            # browser-only dev server (http://localhost:5173)
npm run lint           # lint

npm run dist           # build + package for the CURRENT OS
npm run pack:win       # Windows: NSIS installer  -> release/Nexus Setup <version>.exe
npm run pack:linux     # Linux: AppImage, deb, rpm, pacman -> release/

npm run build:web      # web build with relative base (what the PWA and Android use)
npm run cap:sync       # build:web + copy into android/app/src/main/assets/public
npm run cap:open       # open the Android project in Android Studio
npm run android:apk    # cap:sync + ./gradlew assembleDebug (needs JDK 17 + Android SDK)
```

Linux packages must be built on Linux (or via CI) — `electron-builder` does not cross-build them from Windows. Building the Android APK needs the toolchain described in [Android (build the APK)](#android-build-the-apk).

---

## For maintainers (publishing releases)

The repository includes `.github/workflows/release.yml`, which builds the **Windows installer and all Linux packages** on GitHub's runners and attaches them to a GitHub Release. Publish a version by pushing a tag:

```bash
# bump "version" in package.json first, then:
git tag v1.0.0
git push origin v1.0.0
```

When the workflow finishes, GitHub → **Releases** contains the `.exe`, `.AppImage`, `.deb`, `.rpm` and `.pacman` — and `install.sh` will pick them up automatically.

---

## Project structure

```
electron/         Electron main process (window, CSP, external links)
scripts/          Dev launcher + headless smoke test
install.sh        Linux installer (downloads & installs the latest release)
src/
  components/     UI (chat view, composer, modals, avatars, panels)
  data/           Built-in characters, worlds, avatars, backdrops
  lib/            OpenAI-compatible client (any provider), prompt builder, memory
  store/          Zustand store (persisted settings & conversations)
  index.css       Design tokens + the three themes + mobile/PWA rules
public/           Static assets (avatars, backdrops, favicon, manifest, sw.js, icons)
android/          Capacitor Android project (build the APK here)
capacitor.config.ts  Capacitor config (app id com.nexus.chatstudio, webDir dist)
build/            App icon used by electron-builder and as the PWA/Android source icon
docs/             GitHub Pages site: landing page, releases page, and the built web app (docs/app/)
```

---

## License & disclaimer

Released under the [MIT License](LICENSE) — use it, modify it, ship it, no warranty.

Nexus is an **unofficial** project and is **not affiliated with, endorsed by, or sponsored by** any AI provider it can connect to (Groq, OpenRouter, OpenAI, Ollama, LM Studio, …). All product names are trademarks of their respective owners. You are responsible for the content you generate and for complying with the terms of service of whichever provider you use.
