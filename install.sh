#!/usr/bin/env bash
#
# Nexus — one-shot Linux installer.
#
# Downloads the latest published release from GitHub and installs it for you.
# No Node.js, no npm, no building required.
#
# Usage:
#   bash install.sh              # auto-detect distro and install the native package
#   bash install.sh --appimage   # portable AppImage into ~/.local (no sudo / no root)
#   bash install.sh --package    # force the native package (deb/rpm/pacman)
#   NEXUS_REPO=owner/repo bash install.sh
#
# Supported: Debian/Ubuntu/Mint (deb), Fedora/RHEL/Rocky (rpm),
#            openSUSE/SLES (rpm), Arch/Manjaro (pacman), AppImage everywhere else.
#
set -euo pipefail

APP_NAME="Nexus"
BIN_NAME="nexus"
REPO="${NEXUS_REPO:-}"
MODE="auto" # auto | package | appimage

for arg in "$@"; do
  case "$arg" in
    --appimage|--user) MODE="appimage" ;;
    --package|--native) MODE="package" ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!!\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

# --- Work out which GitHub repo to pull from (auto-detect from the clone) ---
if [[ -z "$REPO" ]]; then
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    url="$(git remote get-url origin 2>/dev/null || true)"
    REPO="$(printf '%s' "$url" | sed -E 's#^git@[^:]+:##; s#^https?://[^/]+/##; s#\.git$##')"
  fi
fi
[[ -n "$REPO" && "$REPO" == */* ]] || \
  die "Could not detect the GitHub repo. Run this inside the cloned repo, or set NEXUS_REPO=owner/repo"
say "Repository: $REPO"

# --- Architecture -----------------------------------------------------------
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) : ;;
  *) warn "Only x86_64 builds are published; '$ARCH' may not have a matching package." ;;
esac

# --- Downloader -------------------------------------------------------------
if   command -v curl >/dev/null 2>&1; then FETCH="curl -fsSL"
elif command -v wget >/dev/null 2>&1; then FETCH="wget -qO-"
else die "Need 'curl' or 'wget' to download the release."; fi

say "Looking up the latest release..."
json="$($FETCH "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null || true)"
[[ -n "$json" ]] || die "Could not reach GitHub or no release exists yet."
printf '%s' "$json" | grep -q 'browser_download_url' || \
  die "No downloadable files found in the latest release (has the maintainer published one?)."

asset_url() { # $1 = regex to match the file name
  printf '%s' "$json" \
    | grep -oE '"browser_download_url"[[:space:]]*:[[:space:]]*"[^"]+"' \
    | sed -E 's/.*"(https[^"]+)".*/\1/' \
    | grep -Ei "$1" | head -n1 || true
}

detect_family() {
  if   command -v apt-get >/dev/null 2>&1; then echo debian
  elif command -v dnf     >/dev/null 2>&1; then echo fedora
  elif command -v zypper  >/dev/null 2>&1; then echo suse
  elif command -v pacman  >/dev/null 2>&1; then echo arch
  else echo unknown; fi
}
FAMILY="$(detect_family)"

if [[ "$MODE" == "auto" ]]; then
  case "$FAMILY" in
    debian|fedora|suse|arch) MODE="package" ;;
    *) warn "Unknown distro family; installing the portable AppImage instead."; MODE="appimage" ;;
  esac
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

download() { # $1 url  $2 outfile
  say "Downloading $(basename "$1")"
  if command -v curl >/dev/null 2>&1; then curl -fSL --progress-bar -o "$2" "$1"
  else wget -q --show-progress -O "$2" "$1"; fi
}

install_appimage() {
  local url; url="$(asset_url '\.AppImage$')"
  [[ -n "$url" ]] || die "No AppImage found in the latest release."

  local dir="${HOME}/.local/bin"
  local apps="${HOME}/.local/share/applications"
  local target="${dir}/${BIN_NAME}.AppImage"
  mkdir -p "$dir" "$apps"

  download "$url" "$target"
  chmod +x "$target"
  ln -sf "$target" "${dir}/${BIN_NAME}"

  cat > "${apps}/${BIN_NAME}.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=${APP_NAME}
Comment=Multi-theme, memory-aware AI character chat studio
Exec=${target} %U
Terminal=false
Categories=Utility;
EOF
  chmod +x "${apps}/${BIN_NAME}.desktop"
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "$apps" >/dev/null 2>&1 || true

  say "Installed (user) to ${target}"
  say "Launch '$APP_NAME' from your application menu, or run: ${BIN_NAME}"
  case ":${PATH}:" in
    *":${dir}:"*) ;;
    *) warn "Tip: add ${dir} to your PATH to use the '${BIN_NAME}' command." ;;
  esac
}

install_package() {
  local pattern url
  case "$FAMILY" in
    debian) pattern='\.deb$' ;;
    fedora) pattern='\.rpm$' ;;
    suse)   pattern='\.rpm$' ;;
    arch)   pattern='\.pacman$' ;;
  esac
  url="$(asset_url "$pattern")"
  if [[ -z "$url" ]]; then
    warn "No native package in the latest release; falling back to the AppImage."
    install_appimage
    return
  fi

  local file="${TMP}/$(basename "$url")"
  download "$url" "$file"

  say "Installing with your package manager (you may be prompted for your password)..."
  case "$FAMILY" in
    debian) sudo apt-get install -y "$file" ;;
    fedora) sudo dnf install -y "$file" ;;
    suse)   sudo zypper --non-interactive install "$file" ;;
    arch)   sudo pacman -U --noconfirm "$file" ;;
  esac
  say "Installed! Launch '$APP_NAME' from your application menu."
}

case "$MODE" in
  package)  install_package ;;
  appimage) install_appimage ;;
esac
