# novaplayer

![novaplayer preview](preview.png)

novaplayer is a single-file Spicetify extension that turns Spotify into a fullscreen cinematic player with reactive cover art, synced lyrics, queue, playlists, and media controls.

## Features

- Fullscreen player opened from a topbar or playbar button.
- WebGL point-cloud album-cover visualizer with beat-reactive motion.
- Synced Spotify lyrics with word highlighting when timing is available.
- Upcoming queue and playlist drawer.
- Liquid-glass inspired lyrics, queue, and media controls.
- Track-switch transitions for cover art, lyrics, queue, and controls.
- Built-in visual tuning panel for density, depth, brightness, nebula, stars, and word glow.

## Install

Run from this folder in PowerShell:

```powershell
.\install.ps1
```

The script copies `novaplayer.js` to the Spicetify extension directory reported by `spicetify path -e root`, adds it to `spicetify config extensions`, and runs `spicetify apply`.

Manual install:

```powershell
$extRoot = spicetify path -e root
Copy-Item .\novaplayer.js (Join-Path $extRoot "novaplayer.js") -Force
spicetify config extensions novaplayer.js
spicetify apply
```

## Use

After Spotify restarts, click the novaplayer visualizer button in the top bar or playbar. Press `Esc` or the close button to leave the fullscreen player.

## Uninstall

```powershell
.\uninstall.ps1
```

## Marketplace Publishing

This repository is ready for Spicetify Marketplace discovery as an extension:

- keep `manifest.json` in the repository root;
- keep `preview.png`, `README.md`, and `novaplayer.js` in the paths referenced by the manifest;
- publish the repository as public on GitHub;
- add the GitHub topic `spicetify-extensions`.

## Notes

- Lyrics come from Spotify's internal `color-lyrics` endpoint through `Spicetify.CosmosAsync`; tracks without available lyrics hide the lyrics ribbon.
- Beat motion uses `Spicetify.getAudioData` when audio analysis is available, with a soft fallback pulse otherwise.
- Queue data is built from `Spicetify.Queue.nextTracks` and `Spicetify.Player.data.nextItems`.
- novaplayer is an original implementation.
