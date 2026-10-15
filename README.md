<div align="center">

# Nexus

**A multi-theme, memory-aware AI character chat studio for the desktop.**

Bring your own [Groq](https://console.groq.com/keys) API key · craft characters & worlds · chat with rich role-play controls · packaged natively for **Windows** and **Linux**.

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

**Privacy and control come first.** Nexus runs natively on your machine, its interface works fully offline, and the *only* network request it ever makes is to `https://api.groq.com` for the model's replies. There is no account, no telemetry, and no bundled API key — you bring your own free Groq key, it is stored locally, and it never leaves your device.

Under the hood it is a **React + TypeScript + Vite** app wrapped in **Electron**, using your choice of Groq's fast models for inference. The result is a fast, native-feeling desktop app with streaming replies, three hand-tuned themes, and a full character/world creator.

> **Installing is easy and needs no technical skills:** on Windows, download the `.exe`; on Linux, clone this repo and run one script. No Node.js, no npm, no compiling.

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
- [Add your API key (first run)](#add-your-api-key-first-run)
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
- **Uncensored by default** — the default system prompt allows mature, unfiltered role-play. You are responsible for what you generate.
- **Offline-first UI** — the only network request the app ever makes is to `https://api.groq.com`. No accounts, no telemetry, no bundled keys.

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

---

## Add your API key (first run)

1. Get a **free** API key at <https://console.groq.com/keys>.
2. Open Nexus and click the **gear / Settings** icon.
3. Go to the **Connection** tab, paste the key, and click **Save**.

The key is stored **only on your machine** (in the app's local settings). It is never bundled into the app and never committed to this repository.

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
| Replies show "401" / "invalid key" | Re-copy the key from <https://console.groq.com/keys> in **Settings → Connection**. |

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
```

Linux packages must be built on Linux (or via CI) — `electron-builder` does not cross-build them from Windows.

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
  lib/            Groq client, prompt builder, memory, command parser
  store/          Zustand store (persisted settings & conversations)
  index.css       Design tokens + the three themes
public/           Static assets (avatars, backdrops, favicon)
build/            App icon used by electron-builder
```

---

## License & disclaimer

Released under the [MIT License](LICENSE) — use it, modify it, ship it, no warranty.

Nexus is an **unofficial** project and is **not affiliated with, endorsed by, or sponsored by Groq**. "Groq" is a trademark of its respective owner. You are responsible for the content you generate and for complying with Groq's terms of service.
