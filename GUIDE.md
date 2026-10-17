# Nexus — Step-by-Step Guide

Everything you need: how to install Nexus, how the website works, how to
rebuild and redeploy it, how to publish a new desktop release, and how to
build the Android APK.

Current version: **1.2.0**

---

## Contents

1. [The two folders](#1-the-two-folders)
2. [Install & use (end users, nothing to build)](#2-install--use)
3. [The website](#3-the-website)
4. [Rebuild & redeploy the website](#4-rebuild--redeploy-the-website)
5. [Publish a new desktop release](#5-publish-a-new-desktop-release)
6. [Build the Android APK](#6-build-the-android-apk)
7. [Develop the app locally](#7-develop-the-app-locally)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. The two folders

You have two copies of the project. They have different jobs — don't mix them up.

| Folder | What it is | Is it a git repo? |
| ------ | ---------- | ----------------- |
| `D:\OpenWorm\GoodPerfectChatbot` | The **working/build folder**. Where you run `npm run pack:win`, keep `release/`, etc. | **No** |
| `D:\OpenWorm\GoodPerfectChatbot-github` | A **clone of `github.com/AmanicX/nexus`**. Everything that gets published lives here. | **Yes** |

**Rule of thumb:** edit code in the clone, and when you want a packaged
`.exe` for your own testing, that can live in the working folder. Anything you
want on GitHub or the website must be in the **clone**.

Website and app files that ship from the clone:

```
docs/                 the GitHub Pages site (this is what gets published)
  index.html          landing page            -> /nexus/
  releases.html       release history         -> /nexus/releases.html
  releases.css        styles for that page
  styles.css, app.js  styles + behaviour for the landing page
  assets/             photos used by both pages
  app/                the built web app       -> /nexus/app/
  .nojekyll           stops GitHub from processing the folder (do not delete)
src/, public/, android/, capacitor.config.ts, package.json   the app itself
.github/workflows/release.yml   the release CI
install.sh            Linux installer
```

---

## 2. Install & use

Nobody needs Node.js or npm to **use** Nexus.

### Windows

1. Open <https://github.com/AmanicX/nexus/releases/latest>
2. Download **`Nexus-Setup-<version>.exe`**.
3. Run it. If SmartScreen says *"Windows protected your PC"* →
   **More info → Run anyway** (the app isn't code-signed yet).
4. Finish the installer. Nexus appears in the Start menu, with an uninstaller.

### Linux

One script does everything — it detects your distro, downloads the right
package from the latest release and installs it:

```bash
git clone https://github.com/AmanicX/nexus.git
cd nexus
bash install.sh
```

Useful flags:

```bash
bash install.sh --appimage   # user-only install into ~/.local (no sudo)
bash install.sh --package    # force the native .deb / .rpm / .pacman package
bash install.sh --help
```

Prefer to do it by hand? Grab a file from the Releases page:

| Distro family | Do this |
| ------------- | ------- |
| Debian/Ubuntu/Mint | `sudo apt install ./nexus_<version>_amd64.deb` |
| Fedora/RHEL/Rocky | `sudo dnf install ./nexus-<version>.x86_64.rpm` |
| openSUSE | `sudo zypper install ./nexus-<version>.x86_64.rpm` |
| Arch/Manjaro | `sudo pacman -U ./nexus-<version>.pacman` |
| any, no install | `chmod +x Nexus-<version>.AppImage && ./Nexus-<version>.AppImage` |

AppImages need FUSE. If one won't start:
`sudo apt install libfuse2` (Debian), `sudo dnf install fuse fuse-libs` (Fedora),
`sudo pacman -S fuse2` (Arch), or run with `--appimage-extract-and-run`.

### Browser, phone, tablet

Open **<https://amanicx.github.io/nexus/app/>** — this is the same app, served
from the website. Then install it so it opens full-screen like a native app:

- **Android / Chrome** — menu (⋮) → **Add to Home screen** → **Install**
- **iPhone / iPad / Safari** — Share → **Add to Home Screen**
- **Desktop Chrome / Edge** — install icon at the right of the address bar
- **Firefox** — menu → **Install Site**

It works offline for the app shell (a service worker caches it) and stores your
settings, characters, worlds and chats in the browser on that device.

> Web and desktop data are **separate** — installing one does not move the other.

### Android app (APK)

There's no ready-made APK in the releases yet. Build one with
[Part 6](#6-build-the-android-apk), then copy the `.apk` to the phone and open
it (enable *Install unknown apps* for your file manager first).

### First run: connect a model

**Settings → Connection**, set three things:

1. **Provider** — Groq, OpenRouter, LM Studio, Ollama or OpenAI, or paste your own Base URL.
2. **API key** — not needed for local providers.
3. **Model** — press **↻** to fetch the live list and pick one, or type any model id.

For a fully local, uncensored setup:

```bash
# install Ollama from https://ollama.com, then:
ollama pull llama3.2
```

…then in Nexus pick **Provider = Ollama** and press **↻**.

---

## 3. The website

The site is published from the `docs/` folder of the repo via GitHub Pages
(source: branch `main`, folder `/docs`).

| Page | URL | What it is |
| ---- | --- | ---------- |
| Home | <https://amanicx.github.io/nexus/> | Landing page — what Nexus is, features, screenshots, links |
| Releases | <https://amanicx.github.io/nexus/releases.html> | Version history with download links, install steps, FAQ |
| Web app | <https://amanicx.github.io/nexus/app/> | The actual installable app |

To change text on the home page, edit `docs/index.html`. To change the release
history, edit `docs/releases.html`. Styling is in `docs/styles.css` (home) and
`docs/releases.css` (releases page); behaviour is in `docs/app.js`.

---

## 4. Rebuild & redeploy the website

Do this whenever you change the **app** (the published build must be refreshed)
or the site pages.

### 4a. Refresh the published app (only if app code changed)

```powershell
# in D:\OpenWorm\GoodPerfectChatbot-github
npm run build:web
robocopy .\dist .\docs\app /MIR
```

`build:web` uses a relative base (`--base=./`) so the app works from the
`/nexus/app/` sub-path. The `robocopy /MIR` makes `docs/app` an exact copy of
`dist` (it deletes stale hashed files — that's what you want).

### 4b. Publish

```powershell
git add -A
git commit -m "Update website"
git push origin main
```

GitHub Pages rebuilds automatically (about 20–60 seconds). Check progress with:

```bash
gh run list --repo AmanicX/nexus --limit 3
```

or open the **Actions** tab. When the *pages build and deployment* run is
green, the live site is updated.

> **Note:** `docs/app/` is the *built* output. Never edit it by hand — always
> regenerate it from `dist` as above, otherwise the next rebuild overwrites you.

---

## 5. Publish a new desktop release

Releases are built by CI, not by you. The workflow
`.github/workflows/release.yml` runs on any tag starting with `v`, builds the
Windows installer on a Windows runner and all Linux packages on Ubuntu, then
attaches them to a GitHub Release.

```powershell
# 1. bump the version (updates package.json + package-lock.json, no tag yet)
npm version 1.2.1 --no-git-tag-version

# 2. commit and push the change
git add -A
git commit -m "v1.2.1: <what changed>"
git push origin main

# 3. create and push the tag — this is what triggers the build
git tag -a v1.2.1 -m "Nexus v1.2.1"
git push origin v1.2.1
```

Then:

```bash
gh run list --repo AmanicX/nexus --limit 3          # watch it
gh release view v1.2.1 --repo AmanicX/nexus         # when done, list assets
```

The release ends up with `Nexus-Setup-<v>.exe`, `Nexus-<v>.AppImage`,
`nexus_<v>_amd64.deb`, `nexus-<v>.x86_64.rpm`, `nexus-<v>.pacman` and the
`latest*.yml` updater files. `install.sh` picks them up automatically, and
`/releases/latest` starts pointing at the new version.

> **Tag carefully.** The version in `package.json` and the tag must match, or the
> installers will be named differently from the release. Bump first, tag second.
>
> If a build fails, fix it and push a **new** tag (`v1.2.2`) — don't reuse the
> old one. Deleting and re-pushing a tag is possible but confuses caches.

### Manual / local packaging (optional)

```powershell
npm run pack:win        # -> release\Nexus Setup <version>.exe   (on Windows)
npm run pack:linux      # -> release\*.AppImage, *.deb, *.rpm, *.pacman (on Linux)
```

Linux packages can only be built on Linux (or in CI) — `electron-builder`
won't cross-build them from Windows.

---

## 6. Build the Android APK

The repo contains a complete **Capacitor** Android project in `android/`
(app id `com.nexus.chatstudio`, app name **Nexus**). It wraps the same web build
that the browser version uses — there is no separate Android codebase to
maintain.

### 6a. Install the toolchain (one time)

- **JDK 17** — Temurin or OpenJDK 17. Set the `JAVA_HOME` environment variable
  to the JDK folder.
- **Android SDK** — easiest via [Android Studio](https://developer.android.com/studio) →
  *SDK Manager*, installing:
  - **SDK Platform 36** (compileSdk/targetSdk)
  - **Android SDK Build-Tools**
  - **Android SDK Platform-Tools** (gives you `adb`)
- The project's Gradle wrapper automatically downloads **Gradle 8.14.3** on
  first build — you don't install Gradle yourself.
- `minSdk` is **24** (Android 7.0 and newer).

Tell Gradle where the SDK is. Create `android/local.properties` (this file is
gitignored — it's per-machine):

```properties
# Windows — note the escaped backslashes and the colon
sdk.dir=C\:\\Users\\<you>\\AppData\\Local\\Android\\Sdk
```

```properties
# macOS / Linux
sdk.dir=/home/<you>/Android/Sdk
```

(Alternatively, export `ANDROID_HOME` instead of creating the file.)

Verify:

```bash
java -version        # should report 17.x
adb --version        # should report a version
```

### 6b. Build the web assets and copy them into the project

```bash
# in D:\OpenWorm\GoodPerfectChatbot-github
npm install          # first time only
npm run cap:sync     # = npm run build:web && npx cap sync android
```

`cap:sync` builds the web app and copies it into
`android/app/src/main/assets/public`. **Always run it after changing app code**
— otherwise the APK contains an old build.

### 6c. Build the APK

```bash
# Windows
cd android
.\gradlew.bat assembleDebug

# macOS / Linux
cd android
./gradlew assembleDebug
```

Output: **`android/app/build/outputs/apk/debug/app-debug.apk`**

Shortcut that does sync + build in one step (from the repo root):

```bash
npm run android:apk
```

### 6d. Install it on a phone

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

…or copy the `.apk` across and open it on the phone.

### 6e. A signed release build (for distribution)

1. Create a keystore once:

   ```bash
   keytool -genkey -v -keystore nexus-release.jks -keyalg RSA -keysize 2048 \
     -validity 10000 -alias nexus
   ```

2. Add a `signingConfigs` block to `android/app/build.gradle` pointing at that
   keystore (keep the password out of git — read it from an env var or a
   gitignored `keystore.properties`).
3. Build:

   ```bash
   cd android
   ./gradlew assembleRelease
   # -> app/build/outputs/apk/release/app-release.apk
   ```

### 6f. Why cleartext HTTP is allowed

`AndroidManifest.xml` sets `android:usesCleartextTraffic="true"` and
`capacitor.config.ts` sets `android.allowMixedContent: true`. This lets the app
reach a **local model on your LAN** — e.g. Ollama at `http://192.168.1.x:11434/v1`.
Hosted providers (Groq, OpenRouter, OpenAI) are still contacted over HTTPS.

### 6g. Open it in Android Studio instead

```bash
npm run cap:open
```

### 6h. Icons and splash

- Source art: `build/icon.png` (512×512, transparent glyph).
- Android icons/splash were generated from it into
  `android/app/src/main/res/` (adaptive foreground + legacy square/round
  `ic_launcher`, and `drawable*/splash.png` at the correct sizes), with the
  launcher background set to `#000000`.
- The PWA icons in `public/icons/` come from the same source.

If you ever replace `build/icon.png`, regenerate both sets and re-run `cap:sync`.

---

## 7. Develop the app locally

```bash
git clone https://github.com/AmanicX/nexus.git
cd nexus
npm install

npm run electron:dev   # desktop app, hot-reloaded
npm run dev            # browser-only dev server -> http://localhost:5173
npm run lint           # oxlint
```

Node.js **20+** (developed against Node 26).

Before committing, run:

```bash
npm run lint           # expect 0 errors (2 known warnings are pre-existing)
npm run build:web      # expect no errors
```

---

## 8. Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `git push` fails, *"Could not resolve host"* | Network/Wi-Fi dropped mid-command. Nothing is half-uploaded — just run `git push` again. |
| A push only partly finished | `git fetch origin`, confirm `git rev-parse origin/main` equals `git rev-parse HEAD`, then re-push the tag/branch. |
| Website didn't change after pushing | Check the **Actions** tab for the *pages-build-and-deployment* run; Pages can take ~1 minute. Hard-refresh (`Ctrl+Shift+R`) to beat the CDN cache. |
| Web app shows an old version | The service worker caches the shell. Reload once or twice; the new hashed assets fetch automatically. In DevTools → *Application* → *Service Workers*, **Unregister** to force it. |
| `gradlew` fails: *"SDK location not found"* | Create `android/local.properties` with `sdk.dir=...` (Part 6a). |
| `gradlew` fails: *"Unsupported class file major version"* | Wrong JDK. Install JDK 17 and point `JAVA_HOME` at it. |
| APK builds but shows a blank screen | You forgot `npm run cap:sync` after changing app code — the bundled web assets are stale. |
| `install.sh`: *"Could not detect the GitHub repo"* | Run it inside the cloned folder, or `NEXUS_REPO=owner/repo bash install.sh`. |
| AppImage: *"error loading libfuse.so.2"* | `sudo apt install libfuse2` (or the distro equivalent), or run with `--appimage-extract-and-run`. |
| Replies show *401 / invalid key* | Re-check the key **and** Base URL in **Settings → Connection**. |
| Local model: *"Failed to fetch"* | Ollama/LM Studio isn't running, or the port in the Base URL is wrong (`11434` / `1234`). |

---

## Quick reference — commands

```bash
# website
npm run build:web                     # build the web app into dist/
robocopy .\dist .\docs\app /MIR       # publish it into the site
git add -A && git commit -m "..." && git push origin main

# desktop release (CI does the packaging)
npm version 1.2.1 --no-git-tag-version
git add -A && git commit -m "v1.2.1: ..." && git push origin main
git tag -a v1.2.1 -m "Nexus v1.2.1" && git push origin v1.2.1

# android
npm run cap:sync                      # build web + copy into android/
cd android && gradlew assembleDebug    # -> app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
