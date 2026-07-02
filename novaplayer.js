// NAME: novaplayer
// AUTHOR: facik + Codex
// VERSION: 0.20.0
// DESCRIPTION: Fullscreen cinematic Spicetify player with WebGL point-cloud cover art, synced lyrics, queue, tilt and media controls.

/// <reference path="../globals.d.ts" />

(function NovaPlayer() {
	const EXTENSION_ID = "novaplayer";
	const ROOT_ID = "novaplayer-root";
	const LYRIC_ENDPOINT = "https://spclient.wg.spotify.com/color-lyrics/v2/track/";
	const CLOUD_SAMPLE_SIZE = 240;
	const CLOUD_MAX_POINTS = 52000;
	const MAX_QUEUE_ITEMS = 64;
	const MAX_PLAYLIST_ITEMS = 32;
	const DEBUG_SAMPLE_LIMIT = 120;
	const DEBUG_UPDATE_INTERVAL = 1800;
	const FLOW_UPDATE_INTERVAL = 1000 / 30;
	const MOTION_UPDATE_INTERVAL = 1000 / 24;
	const PALETTE_TRANSITION_DURATION = 1350;
	const PALETTE_UPDATE_INTERVAL = 1000 / 15;
	const TRACK_PALETTE_DELAY = 260;
	const TRACK_SWITCH_RING_RAMP_DURATION = 620;
	const TRACK_SWITCH_RING_TARGET = 0.9;
	const COVER_SAMPLE_CHUNK_ROWS = 36;
	const COSMOS_TEXTURE_WIDTH = 2560;
	const COSMOS_TEXTURE_HEIGHT = 1440;
	const SETTINGS_STORAGE_KEY = `${EXTENSION_ID}:settings`;
	const INSTRUMENTAL_GAP_MIN_MS = 5600;
	const INSTRUMENTAL_WORD_GAP_MIN_MS = 2600;
	const INSTRUMENTAL_MIN_VISIBLE_MS = 1700;
	const INSTRUMENTAL_LEAD_MS = 620;
	const LYRIC_CAROUSEL_DURATION = 680;
	const BACK_VOCAL_EFFECTS = [
		{ value: "none", label: "Off" },
		{ value: "float", label: "Float (current)" },
		{ value: "echo", label: "Echo smear" },
		{ value: "prism", label: "Prism pulse" },
		{ value: "orbit", label: "Orbit sweep" },
	];
	const DEFAULT_SETTINGS = {
		coverBackdrop: false,
		cloudDensity: 0.92,
		cloudDepth: 1.18,
		cloudPointSize: 1,
		cloudBrightness: 1,
		cloudSaturation: 1.28,
		nebulaIntensity: 0.62,
		nebulaMotion: 0.45,
		starIntensity: 0.9,
		cosmosBrightness: 0.92,
		wordGlow: 1,
		wordActiveScale: 1.055,
		lyricsScale: 1,
		backVocalEffect: "float",
		showPreviousLyrics: true,
		showCurrentLyrics: true,
		showNextLyrics: true,
		showLyricMode: true,
		showLyricMeta: true,
		showPlaylists: true,
		showQueue: true,
		showCoverArt: true,
		queueVisibleCount: 16,
		playlistsOnRight: false,
		queueOnLeft: false,
		lyricsOffsetX: 0,
		lyricsOffsetY: 0,
		lyricMetaGap: 0,
		cloudOffsetX: 0,
		cloudOffsetY: 0,
		playlistsOffsetX: 0,
		playlistsOffsetY: 0,
		queueOffsetX: 0,
		queueOffsetY: 0,
		playerOffsetX: 0,
		playerOffsetY: 0,
		hideIntroLyrics: true,
		playerAutoHide: false,
		invertAccents: false,
	};
	const SETTING_DEFS = {
		cloudDensity: { min: 0.25, max: 1, step: 0.01, label: "Cloud density", format: (value) => `${Math.round(value * 100)}%` },
		cloudDepth: { min: 0.35, max: 2.4, step: 0.01, label: "Cloud depth", format: (value) => `${value.toFixed(2)}x` },
		cloudPointSize: { min: 0.65, max: 1.75, step: 0.01, label: "Point size", format: (value) => `${value.toFixed(2)}x` },
		cloudBrightness: { min: 0.7, max: 1.45, step: 0.01, label: "Cloud brightness", format: (value) => `${Math.round(value * 100)}%` },
		cloudSaturation: { min: 0.75, max: 1.85, step: 0.01, label: "Cloud saturation", format: (value) => `${Math.round(value * 100)}%` },
		nebulaIntensity: { min: 0, max: 1.4, step: 0.01, label: "Nebula intensity", format: (value) => `${Math.round(value * 100)}%` },
		nebulaMotion: { min: 0, max: 1.4, step: 0.01, label: "Nebula motion", format: (value) => `${Math.round(value * 100)}%` },
		starIntensity: { min: 0.2, max: 1.35, step: 0.01, label: "Star intensity", format: (value) => `${Math.round(value * 100)}%` },
		cosmosBrightness: { min: 0.55, max: 1.25, step: 0.01, label: "Space brightness", format: (value) => `${Math.round(value * 100)}%` },
		wordGlow: { min: 0, max: 1.5, step: 0.01, label: "Word glow", format: (value) => `${Math.round(value * 100)}%` },
		wordActiveScale: { min: 1, max: 1.35, step: 0.005, label: "Current word scale", format: (value) => `${Math.round(value * 100)}%` },
		lyricsScale: { min: 0.72, max: 1.38, step: 0.01, label: "Lyrics size", format: (value) => `${Math.round(value * 100)}%` },
		queueVisibleCount: { min: 4, max: MAX_QUEUE_ITEMS, step: 1, label: "Up next items", format: (value) => `${Math.round(value)} tracks` },
		lyricsOffsetX: { min: -420, max: 420, step: 1, label: "Lyrics X", format: (value) => `${Math.round(value)}px` },
		lyricsOffsetY: { min: -300, max: 300, step: 1, label: "Lyrics Y", format: (value) => `${Math.round(value)}px` },
		lyricMetaGap: { min: -260, max: 320, step: 1, label: "Title gap", format: (value) => `${Math.round(value)}px` },
		cloudOffsetX: { min: -420, max: 420, step: 1, label: "Cloud X", format: (value) => `${Math.round(value)}px` },
		cloudOffsetY: { min: -320, max: 320, step: 1, label: "Cloud Y", format: (value) => `${Math.round(value)}px` },
		playlistsOffsetX: { min: -520, max: 520, step: 1, label: "Playlists X", format: (value) => `${Math.round(value)}px` },
		playlistsOffsetY: { min: -320, max: 320, step: 1, label: "Playlists Y", format: (value) => `${Math.round(value)}px` },
		queueOffsetX: { min: -520, max: 520, step: 1, label: "Up next X", format: (value) => `${Math.round(value)}px` },
		queueOffsetY: { min: -320, max: 320, step: 1, label: "Up next Y", format: (value) => `${Math.round(value)}px` },
		playerOffsetX: { min: -420, max: 420, step: 1, label: "Controls X", format: (value) => `${Math.round(value)}px` },
		playerOffsetY: { min: -240, max: 240, step: 1, label: "Controls Y", format: (value) => `${Math.round(value)}px` },
	};
	const CLOUD_SETTING_KEYS = new Set(["cloudDensity", "cloudDepth", "cloudPointSize", "cloudBrightness", "cloudSaturation"]);
	const LYRIC_RENDER_SETTING_KEYS = new Set([
		"hideIntroLyrics",
		"wordGlow",
		"backVocalEffect",
		"showPreviousLyrics",
		"showCurrentLyrics",
		"showNextLyrics",
		"showLyricMode",
		"showLyricMeta",
	]);
	const DEBUG_PROFILES = {
		quality: {
			visual: true,
			chroma: false,
			glass: true,
			edge: true,
			noise: true,
			queue3d: true,
			world3d: true,
			maxDpr: 1,
			pointBudget: 52000,
			visualFps: 30,
			pausedVisualFps: 1,
		},
		balanced: {
			visual: true,
			chroma: false,
			glass: false,
			edge: true,
			noise: false,
			queue3d: true,
			world3d: true,
			maxDpr: 1,
			pointBudget: 48000,
			visualFps: 30,
			pausedVisualFps: 1,
		},
		performance: {
			visual: true,
			chroma: false,
			glass: false,
			edge: false,
			noise: false,
			queue3d: false,
			world3d: false,
			maxDpr: 1,
			pointBudget: 32000,
			visualFps: 24,
			pausedVisualFps: 1,
		},
		hudOnly: {
			visual: false,
			chroma: false,
			glass: false,
			edge: false,
			noise: false,
			queue3d: false,
			world3d: false,
			maxDpr: 1,
			pointBudget: 0,
			visualFps: 1,
			pausedVisualFps: 1,
		},
	};

	if (
		!window.Spicetify ||
		!Spicetify.Player ||
		!Spicetify.Topbar ||
		!Spicetify.Playbar ||
		!Spicetify.SVGIcons ||
		!Spicetify.CosmosAsync
	) {
		setTimeout(NovaPlayer, 300);
		return;
	}

	if (document.getElementById(ROOT_ID)) {
		return;
	}

	const fallbackCover =
		"data:image/svg+xml;charset=utf-8," +
		encodeURIComponent(
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f0a33b"/><stop offset=".52" stop-color="#2fb36f"/><stop offset="1" stop-color="#2f6fd8"/></linearGradient></defs><rect width="600" height="600" fill="#05070a"/><circle cx="300" cy="300" r="210" fill="url(#g)" opacity=".55"/><circle cx="300" cy="300" r="96" fill="#f6f1de" opacity=".9"/><circle cx="300" cy="300" r="40" fill="#05070a"/><path d="M190 384c72 58 160 61 234 0" fill="none" stroke="#f6f1de" stroke-width="20" stroke-linecap="round" opacity=".8"/></svg>'
		);

	const state = {
		open: false,
		ownsFullscreen: false,
		settings: loadSettings(),
		settingsOpen: false,
		trackUri: "",
		trackInfo: null,
		lyrics: [],
		lyricsHidden: false,
		instrumentalBreak: null,
		activeLine: 0,
		activeWord: -1,
		hasSyncedLyrics: false,
		hasWordTiming: false,
		hasWordHighlight: false,
		progressMs: 0,
		lastProgressSync: 0,
		durationMs: 0,
		isPaused: true,
		shuffle: false,
		repeat: 0,
		heart: false,
		volume: 1,
		fetchToken: 0,
		audioToken: 0,
		audioData: null,
		audioSegmentIndex: 0,
		audioBeatIndex: 0,
		raf: 0,
		lastFrame: 0,
		idleStart: performance.now(),
		lastPointerMove: 0,
		targetTiltX: 0,
		targetTiltY: 0,
		tiltX: 0,
		tiltY: 0,
		cameraZoom: 0,
		targetCameraZoom: 0,
		queueOffset: 0,
		queueLength: 0,
		queueWheelRemainder: 0,
		playlists: [],
		playlistsLoaded: false,
		playlistsLoading: false,
		playlistDrawerOpen: false,
		renderProgressDirty: true,
		renderLyricLineKey: "",
		lyricSlotAnimations: [],
		lyricCarouselGhosts: [],
		backVocalKeys: new Set(),
		renderedActiveWord: -1,
		activeWordNode: null,
		lastLoopWork: 0,
		lastMotionUpdate: 0,
		motionStylesApplied: false,
		motion: {
			cloudPitch: 0,
			cloudYaw: 0,
			cloudRoll: 0,
			cloudShiftX: 0,
			cloudShiftY: 0,
			lyricsPitch: 0,
			lyricsYaw: 0,
			lyricsRoll: 0,
			lyricsShiftX: 0,
			lyricsShiftY: 0,
			playerY: -18,
			playerScale: 1,
		},
		lastLyricCheck: 0,
		lastFlowUpdate: 0,
		flowClock: 0,
		flowEnergy: 0,
		flowReady: false,
		flowState: {
			x: 50,
			y: 50,
			altX: 50,
			altY: 50,
			thirdX: 50,
			thirdY: 50,
			opacity: 0.55,
			scale: 1,
			saturation: 1.05,
			blur: 28,
			nebulaOpacity: 0.34,
			hotAlpha: 0.08,
			cyanAlpha: 0.06,
			limeAlpha: 0.04,
			rotate: 0,
		},
		lastVisualRender: 0,
		lastVisualStats: null,
		trackTransitionTimer: 0,
		paletteFrame: 0,
		paletteScheduleTimer: 0,
		paletteApplyToken: 0,
		paletteRaw: null,
		paletteReady: false,
		cosmosSignature: "",
		cosmosReady: false,
		debug: {
			enabled: false,
			profile: "balanced",
			options: { ...DEBUG_PROFILES.balanced },
			samples: [],
			lastOverlayUpdate: 0,
			longFrames: 0,
			maxDelta: 0,
			maxFrameCost: 0,
			lastFrameCost: 0,
			lastVisualStats: null,
			renderedVisualFrames: 0,
			skippedVisualFrames: 0,
		},
	};

	const root = document.createElement("div");
	root.id = ROOT_ID;
	root.className = "novaplayer";
	root.setAttribute("aria-hidden", "true");
	root.innerHTML = `
		<div class="novaplayer__veil"></div>
		<div class="novaplayer__scan"></div>
		<div class="novaplayer__grain"></div>
		<div class="novaplayer__playlist-hotzone" aria-hidden="true"></div>
		<aside class="novaplayer__playlists" aria-label="Spotify playlists">
			<div class="novaplayer__playlists-head">
				<span>Playlists</span>
				<span class="novaplayer__playlists-count">0</span>
			</div>
			<div class="novaplayer__playlists-list"></div>
		</aside>
		<button class="novaplayer__close" type="button" aria-label="Close novaplayer" title="Close">
			${svgIcon("x", 18)}
		</button>
		<button class="novaplayer__settings-toggle" type="button" aria-label="Open stage settings" title="Stage settings">
			${svgIcon("cog", 18)}
		</button>
		<section class="novaplayer__settings" aria-label="Stage settings">
			<div class="novaplayer__settings-head">
				<strong>Stage Settings</strong>
				<div class="novaplayer__settings-actions">
					<button type="button" data-settings-action="reset">Reset</button>
					<button type="button" data-settings-action="close">Close</button>
				</div>
			</div>
			<div class="novaplayer__settings-body">
				<div class="novaplayer__settings-group" data-settings-section="cloud">
					<h3>Point Cloud</h3>
					${settingsToggle("coverBackdrop", "Cover backdrop", "Replace the point cloud with the track artwork.")}
					${settingsSlider("cloudDensity")}
					${settingsSlider("cloudDepth")}
					${settingsSlider("cloudPointSize")}
					${settingsSlider("cloudBrightness")}
					${settingsSlider("cloudSaturation")}
				</div>
				<div class="novaplayer__settings-group">
					<h3>Space</h3>
					${settingsSlider("nebulaIntensity")}
					${settingsSlider("nebulaMotion")}
					${settingsSlider("starIntensity")}
					${settingsSlider("cosmosBrightness")}
				</div>
				<div class="novaplayer__settings-group">
					<h3>Lyrics</h3>
					${settingsSlider("wordGlow")}
					${settingsSlider("wordActiveScale")}
					${settingsSlider("lyricsScale")}
					${settingsSelect("backVocalEffect", "Back vocals", "Effect for bracketed background phrases.", BACK_VOCAL_EFFECTS)}
					${settingsToggle("hideIntroLyrics", "Hide intro lyrics", "Keep the stage clean before the first vocal line.")}
					${settingsToggle("showPreviousLyrics", "Previous lyrics", "Show the line before the current lyric.")}
					${settingsToggle("showCurrentLyrics", "Current lyrics", "Show the active lyric line.")}
					${settingsToggle("showNextLyrics", "Next lyrics", "Show the next lyric line.")}
					${settingsToggle("showLyricMode", "Lyrics mode", "Show UNSYNCED, WORD FLOW, and role labels.")}
					${settingsToggle("showLyricMeta", "Track and artist", "Show the title and artist chip near lyrics.")}
					${settingsSlider("lyricMetaGap")}
				</div>
				<div class="novaplayer__settings-group">
					<h3>Panels</h3>
					${settingsToggle("showPlaylists", "Playlists panel", "Enable the side playlist drawer.")}
					${settingsToggle("playlistsOnRight", "Playlists on right", "Open playlists from the right edge.")}
					${settingsSlider("playlistsOffsetX")}
					${settingsSlider("playlistsOffsetY")}
					${settingsToggle("showQueue", "Up next", "Enable the queue panel.")}
					${settingsSlider("queueVisibleCount")}
					${settingsToggle("queueOnLeft", "Up next on left", "Move Up next to the left edge.")}
					${settingsSlider("queueOffsetX")}
					${settingsSlider("queueOffsetY")}
				</div>
				<div class="novaplayer__settings-group">
					<h3>Layout</h3>
					${settingsToggle("showCoverArt", "Cover art", "Show cover artwork in controls and cover backdrop mode.")}
					${settingsToggle("invertAccents", "Invert accents", "Flip accent colors when lyrics lose contrast.")}
					${settingsSlider("lyricsOffsetX")}
					${settingsSlider("lyricsOffsetY")}
					${settingsSlider("cloudOffsetX")}
					${settingsSlider("cloudOffsetY")}
					${settingsSlider("playerOffsetX")}
					${settingsSlider("playerOffsetY")}
					${settingsToggle("playerAutoHide", "Player on hover", "Hide controls until the bottom edge is hovered.")}
				</div>
			</div>
		</section>
		<section class="novaplayer__debug" aria-label="novaplayer debug panel">
			<div class="novaplayer__debug-head">
				<strong>novaplayer debug</strong>
				<div class="novaplayer__debug-actions">
					<button type="button" data-debug-action="copy">Copy</button>
					<button type="button" data-debug-action="reset">Reset</button>
					<button type="button" data-debug-action="close">Close</button>
				</div>
			</div>
			<div class="novaplayer__debug-profiles">
				<button type="button" data-debug-profile="quality">Quality</button>
				<button type="button" data-debug-profile="balanced">Balanced</button>
				<button type="button" data-debug-profile="performance">Performance</button>
				<button type="button" data-debug-profile="hudOnly">HUD only</button>
			</div>
			<div class="novaplayer__debug-toggles">
				<button type="button" data-debug-toggle="visual">Visual</button>
				<button type="button" data-debug-toggle="chroma">Chroma</button>
				<button type="button" data-debug-toggle="glass">Glass</button>
				<button type="button" data-debug-toggle="edge">Edge</button>
				<button type="button" data-debug-toggle="noise">Noise</button>
				<button type="button" data-debug-toggle="queue3d">Queue 3D</button>
				<button type="button" data-debug-toggle="world3d">World 3D</button>
			</div>
			<div class="novaplayer__debug-grid">
				<span>FPS</span><strong data-debug-value="fps">-</strong>
				<span>Frame</span><strong data-debug-value="frame">-</strong>
				<span>CPU frame</span><strong data-debug-value="frameCost">-</strong>
				<span>Long frames</span><strong data-debug-value="longFrames">-</strong>
				<span>Visual CPU</span><strong data-debug-value="visualMs">-</strong>
				<span>Points</span><strong data-debug-value="points">-</strong>
				<span>Budget</span><strong data-debug-value="pointBudget">-</strong>
				<span>Draw calls</span><strong data-debug-value="drawCalls">-</strong>
				<span>Visual FPS</span><strong data-debug-value="visualFps">-</strong>
				<span>Visual skip</span><strong data-debug-value="visualSkip">-</strong>
				<span>DPR</span><strong data-debug-value="dpr">-</strong>
				<span>Canvas</span><strong data-debug-value="canvas">-</strong>
				<span>Zoom/Tilt</span><strong data-debug-value="camera">-</strong>
				<span>Lyrics</span><strong data-debug-value="lyrics">-</strong>
				<span>Player rect</span><strong data-debug-value="playerRect">-</strong>
				<span>Queue rect</span><strong data-debug-value="queueRect">-</strong>
				<span>Colors</span><strong data-debug-value="colors">-</strong>
			</div>
			<pre class="novaplayer__debug-snapshot" data-debug-value="snapshot"></pre>
		</section>
		<section class="novaplayer__world" aria-label="novaplayer fullscreen player">
			<div class="novaplayer__space">
				<div class="novaplayer__art" aria-hidden="true">
					<div class="novaplayer__cosmos">
						<canvas class="novaplayer__cosmos-texture"></canvas>
					</div>
					<div class="novaplayer__aura"></div>
					<div class="novaplayer__cover-echo"></div>
					<canvas class="novaplayer__cloud"></canvas>
					<div class="novaplayer__vignette"></div>
				</div>

				<main class="novaplayer__lyrics" aria-live="polite">
					<div class="novaplayer__lyric-prev"></div>
					<div class="novaplayer__vocal-role"></div>
					<div class="novaplayer__lyric-current">Open a track to start the stage</div>
					<div class="novaplayer__lyric-next"></div>
				</main>
				<div class="novaplayer__lyric-meta" aria-hidden="true">
					<span class="novaplayer__meta-title"></span>
					<span class="novaplayer__meta-divider"></span>
					<span class="novaplayer__meta-artist"></span>
				</div>

				<aside class="novaplayer__queue" aria-label="Upcoming queue">
					<div class="novaplayer__queue-head">
						<span>Up next</span>
						<span class="novaplayer__queue-count">0</span>
					</div>
					<div class="novaplayer__queue-list"></div>
				</aside>
				<div class="novaplayer__backs" aria-hidden="true"></div>
			</div>

			<div class="novaplayer__player-hotzone" aria-hidden="true"></div>
			<footer class="novaplayer__player" aria-label="Media controls">
				<div class="novaplayer__now">
					<div class="novaplayer__cover"></div>
					<div class="novaplayer__now-copy">
						<div class="novaplayer__now-title">No track</div>
						<div class="novaplayer__now-artist">Spotify</div>
					</div>
				</div>

				<div class="novaplayer__control-cluster">
					<button class="novaplayer__icon-button" type="button" data-action="shuffle" aria-label="Shuffle" title="Shuffle"></button>
					<button class="novaplayer__icon-button" type="button" data-action="previous" aria-label="Previous" title="Previous"></button>
					<button class="novaplayer__icon-button novaplayer__play" type="button" data-action="play" aria-label="Play or pause" title="Play or pause"></button>
					<button class="novaplayer__icon-button" type="button" data-action="next" aria-label="Next" title="Next"></button>
					<button class="novaplayer__icon-button" type="button" data-action="repeat" aria-label="Repeat" title="Repeat"></button>
				</div>

				<div class="novaplayer__timeline">
					<span class="novaplayer__time novaplayer__elapsed">0:00</span>
					<button class="novaplayer__progress" type="button" aria-label="Seek in track">
						<span class="novaplayer__progress-rail">
							<span class="novaplayer__progress-fill"></span>
							<span class="novaplayer__progress-thumb"></span>
						</span>
					</button>
					<span class="novaplayer__time novaplayer__duration">0:00</span>
				</div>

				<div class="novaplayer__side-actions">
					<button class="novaplayer__icon-button" type="button" data-action="heart" aria-label="Save track" title="Save track"></button>
					<label class="novaplayer__volume" title="Volume">
						<span class="novaplayer__volume-icon" aria-hidden="true">${svgIcon("volume-two-wave", 16)}</span>
						<input class="novaplayer__volume-slider" type="range" min="0" max="1" step="0.01" value="1" aria-label="Volume">
					</label>
				</div>
			</footer>
		</section>
	`;

	document.body.append(root);
	injectStyle();

	const dom = {
		world: root.querySelector(".novaplayer__world"),
		space: root.querySelector(".novaplayer__space"),
		close: root.querySelector(".novaplayer__close"),
		settingsToggle: root.querySelector(".novaplayer__settings-toggle"),
		settings: root.querySelector(".novaplayer__settings"),
		debug: root.querySelector(".novaplayer__debug"),
		cosmos: root.querySelector(".novaplayer__cosmos"),
		cosmosTexture: root.querySelector(".novaplayer__cosmos-texture"),
		cloud: root.querySelector(".novaplayer__cloud"),
		coverEcho: root.querySelector(".novaplayer__cover-echo"),
		aura: root.querySelector(".novaplayer__aura"),
		lyrics: root.querySelector(".novaplayer__lyrics"),
		lyricMeta: root.querySelector(".novaplayer__lyric-meta"),
		lyricPrev: root.querySelector(".novaplayer__lyric-prev"),
		vocalRole: root.querySelector(".novaplayer__vocal-role"),
		lyricCurrent: root.querySelector(".novaplayer__lyric-current"),
		lyricNext: root.querySelector(".novaplayer__lyric-next"),
		metaTitle: root.querySelector(".novaplayer__meta-title"),
		metaArtist: root.querySelector(".novaplayer__meta-artist"),
		backs: root.querySelector(".novaplayer__backs"),
		queue: root.querySelector(".novaplayer__queue"),
		queueList: root.querySelector(".novaplayer__queue-list"),
		queueCount: root.querySelector(".novaplayer__queue-count"),
		player: root.querySelector(".novaplayer__player"),
		nowCover: root.querySelector(".novaplayer__cover"),
		nowTitle: root.querySelector(".novaplayer__now-title"),
		nowArtist: root.querySelector(".novaplayer__now-artist"),
		elapsed: root.querySelector(".novaplayer__elapsed"),
		duration: root.querySelector(".novaplayer__duration"),
		progress: root.querySelector(".novaplayer__progress"),
		progressFill: root.querySelector(".novaplayer__progress-fill"),
		progressThumb: root.querySelector(".novaplayer__progress-thumb"),
		playlistHotzone: root.querySelector(".novaplayer__playlist-hotzone"),
		playlists: root.querySelector(".novaplayer__playlists"),
		playlistsList: root.querySelector(".novaplayer__playlists-list"),
		playlistsCount: root.querySelector(".novaplayer__playlists-count"),
		volumeIcon: root.querySelector(".novaplayer__volume-icon"),
		volumeSlider: root.querySelector(".novaplayer__volume-slider"),
	};
	dom.debugValues = {};
	for (const valueNode of root.querySelectorAll("[data-debug-value]")) {
		dom.debugValues[valueNode.dataset.debugValue] = valueNode;
	}

	const buttons = {
		shuffle: root.querySelector('[data-action="shuffle"]'),
		previous: root.querySelector('[data-action="previous"]'),
		play: root.querySelector('[data-action="play"]'),
		next: root.querySelector('[data-action="next"]'),
		repeat: root.querySelector('[data-action="repeat"]'),
		heart: root.querySelector('[data-action="heart"]'),
	};

	const buttonIcons = {
		shuffle: "shuffle",
		previous: "skip-back",
		play: "play",
		next: "skip-forward",
		repeat: "repeat",
		heart: "heart",
	};

	for (const [name, button] of Object.entries(buttons)) {
		button.innerHTML = svgIcon(buttonIcons[name], name === "play" ? 24 : 18);
	}

	const cosmosRenderer = createCosmosTextureRenderer(dom.cosmosTexture);
	const visualizer = createPointCloudVisualizer(dom.cloud, fallbackCover, applyCoverPalette);
	applyDebugOptions();

	dom.close.addEventListener("click", closeStage);
	dom.settingsToggle.addEventListener("click", () => toggleSettingsPanel());
	dom.settings.addEventListener("input", handleSettingsInput);
	dom.settings.addEventListener("change", handleSettingsInput);
	dom.settings.addEventListener("click", handleSettingsClick);
	root.addEventListener("pointermove", handlePointerMove, { passive: true });
	root.addEventListener("wheel", handleStageWheel, { passive: false });
	dom.queue.addEventListener("wheel", handleQueueWheel, { passive: false });
	dom.playlistHotzone.addEventListener("pointerenter", openPlaylistDrawer);
	dom.playlists.addEventListener("pointerenter", openPlaylistDrawer);
	dom.playlists.addEventListener("pointerleave", closePlaylistDrawer);
	dom.progress.addEventListener("click", seekFromProgressClick);
	dom.volumeSlider.addEventListener("input", handleVolumeInput);
	dom.debug.addEventListener("click", handleDebugClick);
	window.addEventListener("keydown", handleKeyDown);
	document.addEventListener("fullscreenchange", handleFullscreenChange);

	buttons.shuffle.addEventListener("click", () => Spicetify.Player.toggleShuffle());
	buttons.previous.addEventListener("click", () => Spicetify.Player.back());
	buttons.play.addEventListener("click", () => Spicetify.Player.togglePlay());
	buttons.next.addEventListener("click", () => Spicetify.Player.next());
	buttons.repeat.addEventListener("click", () => Spicetify.Player.toggleRepeat());
	buttons.heart.addEventListener("click", handleHeartClick);
	const topbarButton = new Spicetify.Topbar.Button("novaplayer", "visualizer", openStage, false, true);
	const playbarButton = new Spicetify.Playbar.Button("novaplayer", "visualizer", openStage, false, false, true);

	Spicetify.Player.addEventListener("songchange", handleSongChange);
	Spicetify.Player.addEventListener("onplaypause", handlePlayPause);
	Spicetify.Player.addEventListener("onprogress", handleProgress);
	window.NovaPlayerDebug = {
		open: () => toggleDebugPanel(true),
		close: () => toggleDebugPanel(false),
		settings: () => ({ ...state.settings }),
		snapshot: () => getDebugSnapshot(),
		profile: setDebugProfile,
		reset: resetDebugStats,
		options: () => ({ ...state.debug.options }),
	};

	handleSongChange({ data: Spicetify.Player.data });
	updateControlState();

	function openStage() {
		state.open = true;
		root.classList.add("is-open");
		root.removeAttribute("aria-hidden");
		document.body.classList.add("novaplayer-open");
		updateButtonActiveState();
		updateAllFromPlayer(true);
		visualizer.resize();
		cosmosRenderer.resize?.();
		startTiltLoop();

		if (root.requestFullscreen && !document.fullscreenElement) {
			root.requestFullscreen({ navigationUI: "hide" })
				.then(() => {
					state.ownsFullscreen = true;
				})
				.catch(() => {
					state.ownsFullscreen = false;
				});
		}
	}

	function closeStage() {
		state.open = false;
		root.classList.remove("is-open");
		root.setAttribute("aria-hidden", "true");
		document.body.classList.remove("novaplayer-open");
		closePlaylistDrawer();
		toggleSettingsPanel(false);
		updateButtonActiveState();
		stopTiltLoop();

		if (state.ownsFullscreen && document.fullscreenElement === root && document.exitFullscreen) {
			document.exitFullscreen().catch(() => {});
		}
		state.ownsFullscreen = false;
	}

	function handleFullscreenChange() {
		if (state.open && state.ownsFullscreen && document.fullscreenElement !== root) {
			closeStage();
		}
	}

	function handleKeyDown(event) {
		if (!state.open) {
			return;
		}

		if (event.key === "F8" || (event.shiftKey && event.key.toLowerCase() === "d")) {
			event.preventDefault();
			toggleDebugPanel();
			return;
		}

		if (event.key === "Escape") {
			event.preventDefault();
			if (state.settingsOpen) {
				toggleSettingsPanel(false);
				return;
			}
			closeStage();
		}
	}

	function handleDebugClick(event) {
		const button = event.target.closest("button");
		if (!button) {
			return;
		}

		const action = button.dataset.debugAction;
		const profile = button.dataset.debugProfile;
		const toggle = button.dataset.debugToggle;

		if (action === "close") {
			toggleDebugPanel(false);
			return;
		}

		if (action === "copy") {
			copyDebugSnapshot();
			return;
		}

		if (action === "reset") {
			resetDebugStats();
			updateDebugOverlay(true);
			return;
		}

		if (profile) {
			setDebugProfile(profile);
			return;
		}

		if (toggle && Object.prototype.hasOwnProperty.call(state.debug.options, toggle)) {
			state.debug.options[toggle] = !state.debug.options[toggle];
			state.debug.profile = "custom";
			applyDebugOptions();
			updateDebugOverlay(true);
		}
	}

	function handleSettingsClick(event) {
		const button = event.target.closest("button");
		if (!button) {
			return;
		}

		const action = button.dataset.settingsAction;
		if (action === "close") {
			toggleSettingsPanel(false);
			return;
		}
		if (action === "reset") {
			state.settings = { ...DEFAULT_SETTINGS };
			saveSettings();
			updateSettingsControls();
			applyStageSettings();
			renderLyrics();
			renderQueue();
			refreshAccentPalette();
		}
	}

	function handleSettingsInput(event) {
		const input = event.target.closest("[data-setting]");
		if (!input) {
			return;
		}

		const key = input.dataset.setting;
		if (!(key in DEFAULT_SETTINGS)) {
			return;
		}

		if (input.type === "checkbox") {
			state.settings[key] = Boolean(input.checked);
		} else if (typeof DEFAULT_SETTINGS[key] === "string") {
			state.settings[key] = normalizeStringSetting(key, input.value);
		} else {
			state.settings[key] = clamp(Number(input.value), SETTING_DEFS[key]?.min ?? 0, SETTING_DEFS[key]?.max ?? 1);
		}
		saveSettings();
		updateSettingsControls();
		applyStageSettings();
		if (LYRIC_RENDER_SETTING_KEYS.has(key)) {
			renderLyrics();
		}
		if (key === "backVocalEffect") {
			clearBackVocals();
		}
		if (key === "queueVisibleCount") {
			renderQueue();
		}
		if (key === "invertAccents") {
			refreshAccentPalette();
		}
	}

	function toggleSettingsPanel(force) {
		state.settingsOpen = typeof force === "boolean" ? force : !state.settingsOpen;
		root.classList.toggle("is-settings-open", state.settingsOpen);
		dom.settingsToggle.classList.toggle("is-active", state.settingsOpen);
		dom.settingsToggle.setAttribute("aria-label", state.settingsOpen ? "Close stage settings" : "Open stage settings");
		if (state.settingsOpen) {
			updateSettingsControls();
		}
	}

	function updateSettingsControls() {
		for (const input of dom.settings.querySelectorAll("[data-setting]")) {
			const key = input.dataset.setting;
			if (!(key in state.settings)) {
				continue;
			}
			if (input.type === "checkbox") {
				input.checked = Boolean(state.settings[key]);
			} else if (document.activeElement !== input) {
				input.value = String(state.settings[key]);
			}
			input.disabled = CLOUD_SETTING_KEYS.has(key) && state.settings.coverBackdrop;
		}

		for (const output of dom.settings.querySelectorAll("[data-setting-output]")) {
			const key = output.dataset.settingOutput;
			output.textContent = formatSettingValue(key, state.settings[key]);
		}

		for (const section of dom.settings.querySelectorAll("[data-settings-section='cloud']")) {
			section.classList.toggle("is-section-disabled", Boolean(state.settings.coverBackdrop));
		}
	}

	function applyStageSettings() {
		const settings = state.settings;
		const lyricsScale = clamp(Number(settings.lyricsScale) || 1, SETTING_DEFS.lyricsScale.min, SETTING_DEFS.lyricsScale.max);
		setStyleProperty(root, "--novaplayer-cloud-brightness", settings.cloudBrightness.toFixed(3));
		setStyleProperty(root, "--novaplayer-cloud-saturation", settings.cloudSaturation.toFixed(3));
		setStyleProperty(root, "--novaplayer-star-opacity", settings.starIntensity.toFixed(3));
		setStyleProperty(root, "--novaplayer-cosmos-brightness", settings.cosmosBrightness.toFixed(3));
		setStyleProperty(root, "--novaplayer-word-glow", settings.wordGlow.toFixed(3));
		setStyleProperty(root, "--novaplayer-word-current-scale", clamp(Number(settings.wordActiveScale) || 1.055, SETTING_DEFS.wordActiveScale.min, SETTING_DEFS.wordActiveScale.max).toFixed(3));
		setStyleProperty(root, "--novaplayer-lyric-current-min", `${(34 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-lyric-current-fluid", `${(4.8 * lyricsScale).toFixed(2)}vw`);
		setStyleProperty(root, "--novaplayer-lyric-current-max", `${(82 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-lyric-side-min", `${(13 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-lyric-side-fluid", `${(1 * lyricsScale).toFixed(2)}vw`);
		setStyleProperty(root, "--novaplayer-lyric-side-max", `${(20 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-back-vocal-min", `${(14 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-back-vocal-fluid", `${(1.25 * lyricsScale).toFixed(2)}vw`);
		setStyleProperty(root, "--novaplayer-back-vocal-max", `${(24 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-lyric-mobile-current-min", `${(32 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-lyric-mobile-current-fluid", `${(11 * lyricsScale).toFixed(2)}vw`);
		setStyleProperty(root, "--novaplayer-lyric-mobile-current-max", `${(58 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-back-mobile-min", `${(13 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-back-mobile-fluid", `${(3.6 * lyricsScale).toFixed(2)}vw`);
		setStyleProperty(root, "--novaplayer-back-mobile-max", `${(20 * lyricsScale).toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-lyrics-x", `${settings.lyricsOffsetX.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-lyrics-y", `${settings.lyricsOffsetY.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-lyric-meta-gap", `${settings.lyricMetaGap.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-cloud-x", `${settings.cloudOffsetX.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-cloud-y", `${settings.cloudOffsetY.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-playlists-x", `${settings.playlistsOffsetX.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-playlists-y", `${settings.playlistsOffsetY.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-queue-x", `${settings.queueOffsetX.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-queue-y", `${settings.queueOffsetY.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-player-x", `${settings.playerOffsetX.toFixed(1)}px`);
		setStyleProperty(root, "--novaplayer-layout-player-y", `${settings.playerOffsetY.toFixed(1)}px`);
		const backVocalEffect = getBackVocalEffect();
		root.dataset.backVocalEffect = backVocalEffect;
		root.classList.toggle("is-cover-backdrop", Boolean(settings.coverBackdrop));
		root.classList.toggle("is-playlists-right", Boolean(settings.playlistsOnRight));
		root.classList.toggle("is-queue-left", Boolean(settings.queueOnLeft));
		root.classList.toggle("hide-lyric-prev", !settings.showPreviousLyrics);
		root.classList.toggle("hide-lyric-current", !settings.showCurrentLyrics);
		root.classList.toggle("hide-lyric-next", !settings.showNextLyrics);
		root.classList.toggle("hide-lyric-mode", !settings.showLyricMode);
		root.classList.toggle("hide-lyric-meta", !settings.showLyricMeta);
		root.classList.toggle("hide-playlists", !settings.showPlaylists);
		root.classList.toggle("hide-queue", !settings.showQueue);
		root.classList.toggle("hide-cover-art", !settings.showCoverArt);
		root.classList.toggle("is-player-hover-reveal", Boolean(settings.playerAutoHide));
		if (backVocalEffect === "none") {
			clearBackVocals();
		}
		if (!settings.showPlaylists) {
			closePlaylistDrawer();
		}
		state.queueOffset = clamp(state.queueOffset, 0, getMaxQueueOffset());
		updateQueueCarouselLayout();
		visualizer.setOptions?.(getEffectiveVisualizerOptions());
	}

	function getEffectiveVisualizerOptions() {
		const options = state.debug.options;
		const visualEnabled = Boolean(options.visual && !state.settings.coverBackdrop);
		const pointBudget = visualEnabled
			? Math.round(Math.max(1200, Math.min(CLOUD_MAX_POINTS, (options.pointBudget || CLOUD_MAX_POINTS) * state.settings.cloudDensity)))
			: 0;
		return {
			visual: visualEnabled,
			chroma: options.chroma,
			maxDpr: options.maxDpr,
			pointBudget,
			visualFps: options.visualFps,
			pausedVisualFps: options.pausedVisualFps,
			depthScale: state.settings.cloudDepth,
			pointScale: state.settings.cloudPointSize,
		};
	}

	function saveSettings() {
		try {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
		} catch (error) {
			// Ignore storage failures in restricted Spotify profiles.
		}
	}

	function toggleDebugPanel(force) {
		state.debug.enabled = typeof force === "boolean" ? force : !state.debug.enabled;
		root.classList.toggle("is-debug-open", state.debug.enabled);
		if (state.debug.enabled) {
			resetDebugStats();
			updateDebugOverlay(true);
		}
	}

	function setDebugProfile(profile) {
		if (!DEBUG_PROFILES[profile]) {
			return;
		}

		state.debug.profile = profile;
		state.debug.options = { ...DEBUG_PROFILES[profile] };
		resetDebugStats();
		applyDebugOptions();
		updateDebugOverlay(true);
	}

	function applyDebugOptions() {
		const options = state.debug.options;
		root.classList.toggle("novaplayer-debug-no-visual", !options.visual);
		root.classList.toggle("novaplayer-debug-no-chroma", !options.chroma);
		root.classList.toggle("novaplayer-debug-no-glass", !options.glass);
		root.classList.toggle("novaplayer-debug-no-edge", !options.edge);
		root.classList.toggle("novaplayer-debug-no-noise", !options.noise);
		root.classList.toggle("novaplayer-debug-no-queue3d", !options.queue3d);
		root.classList.toggle("novaplayer-debug-no-world3d", !options.world3d);
		applyStageSettings();

		for (const button of dom.debug.querySelectorAll("[data-debug-toggle]")) {
			const key = button.dataset.debugToggle;
			button.classList.toggle("is-active", Boolean(options[key]));
		}

		for (const button of dom.debug.querySelectorAll("[data-debug-profile]")) {
			button.classList.toggle("is-active", button.dataset.debugProfile === state.debug.profile);
		}
	}

	function resetDebugStats() {
		state.debug.samples = [];
		state.debug.longFrames = 0;
		state.debug.maxDelta = 0;
		state.debug.maxFrameCost = 0;
		state.debug.lastFrameCost = 0;
		state.debug.lastOverlayUpdate = 0;
		state.debug.renderedVisualFrames = 0;
		state.debug.skippedVisualFrames = 0;
	}

	function recordDebugFrame(delta, frameCost, visualStats, time) {
		state.debug.lastFrameCost = frameCost;
		state.debug.lastVisualStats = visualStats || state.debug.lastVisualStats;
		state.debug.maxDelta = Math.max(state.debug.maxDelta, delta);
		state.debug.maxFrameCost = Math.max(state.debug.maxFrameCost, frameCost);
		if (delta > 34) {
			state.debug.longFrames += 1;
		}
		if (visualStats?.skipped) {
			state.debug.skippedVisualFrames += 1;
		} else if (visualStats) {
			state.debug.renderedVisualFrames += 1;
		}

		state.debug.samples.push({
			delta,
			frameCost,
			visualMs: visualStats?.renderMs || 0,
		});
		if (state.debug.samples.length > DEBUG_SAMPLE_LIMIT) {
			state.debug.samples.shift();
		}

		if (!state.debug.enabled) {
			return;
		}

		if (!state.debug.lastOverlayUpdate || time - state.debug.lastOverlayUpdate > DEBUG_UPDATE_INTERVAL) {
			state.debug.lastOverlayUpdate = time;
			updateDebugOverlay(false);
		}
	}

	function updateDebugOverlay(force) {
		if (!state.debug.enabled && !force) {
			return;
		}

		if (force) {
			applyDebugOptions();
		}
		const metrics = getDebugMetrics();
		const visual = state.debug.lastVisualStats || {};

		setDebugValue("fps", metrics.fps ? metrics.fps.toFixed(1) : "-");
		setDebugValue("frame", `${metrics.avgDelta.toFixed(1)}ms / max ${state.debug.maxDelta.toFixed(1)}ms`);
		setDebugValue("frameCost", `${metrics.avgFrameCost.toFixed(2)}ms / max ${state.debug.maxFrameCost.toFixed(2)}ms`);
		setDebugValue("longFrames", String(state.debug.longFrames));
		setDebugValue("visualMs", `${metrics.avgVisualMs.toFixed(2)}ms`);
		setDebugValue("points", String(visual.pointCount || 0));
		setDebugValue("pointBudget", String(visual.pointBudget || state.debug.options.pointBudget || "-"));
		setDebugValue("drawCalls", String(visual.drawCalls || 0));
		setDebugValue("visualFps", `${visual.targetVisualFps || "-"}${visual.skipped ? " skipped" : ""}`);
		setDebugValue("visualSkip", `${state.debug.renderedVisualFrames}/${state.debug.skippedVisualFrames}`);
		setDebugValue("dpr", String(visual.dpr || "-"));
		setDebugValue("canvas", visual.canvas ? `${visual.canvas.width}x${visual.canvas.height}` : "-");
		setDebugValue("camera", `z ${state.cameraZoom.toFixed(2)} / ${state.tiltX.toFixed(1)}, ${state.tiltY.toFixed(1)}`);
		setDebugValue("lyrics", `${state.lyrics.length} lines, ${state.activeLine}:${state.activeWord}`);
		if (force) {
			setDebugValue("playerRect", formatRect(dom.player));
			setDebugValue("queueRect", formatRect(dom.queue));
			setDebugValue("colors", `${cssVar("--novaplayer-hot")} / ${cssVar("--novaplayer-cyan")}`);
		}
		if (force) {
			setDebugValue("snapshot", "Run for 5-10 seconds, switch profiles if needed, then press Copy and send the copied JSON.");
		}
	}

	function setDebugValue(name, value) {
		if (dom.debugValues[name]) {
			dom.debugValues[name].textContent = value;
		}
	}

	function getDebugMetrics() {
		const samples = state.debug.samples;
		if (!samples.length) {
			return {
				fps: 0,
				avgDelta: 0,
				avgFrameCost: 0,
				avgVisualMs: 0,
			};
		}

		const totals = samples.reduce(
			(result, sample) => {
				result.delta += sample.delta;
				result.frameCost += sample.frameCost;
				result.visualMs += sample.visualMs;
				return result;
			},
			{ delta: 0, frameCost: 0, visualMs: 0 }
		);
		const count = samples.length;
		const avgDelta = totals.delta / count;
		return {
			fps: avgDelta ? 1000 / avgDelta : 0,
			avgDelta,
			avgFrameCost: totals.frameCost / count,
			avgVisualMs: totals.visualMs / count,
		};
	}

	function getDebugSnapshot() {
		const metrics = getDebugMetrics();
		const visual = state.debug.lastVisualStats || {};
		const snapshot = {
			version: "0.20.0",
			time: new Date().toISOString(),
			profile: state.debug.profile,
			options: state.debug.options,
			metrics: {
				fps: round(metrics.fps, 2),
				avgDeltaMs: round(metrics.avgDelta, 2),
				avgFrameCostMs: round(metrics.avgFrameCost, 3),
				avgVisualSubmitMs: round(metrics.avgVisualMs, 3),
				maxDeltaMs: round(state.debug.maxDelta, 2),
				maxFrameCostMs: round(state.debug.maxFrameCost, 3),
				longFrames: state.debug.longFrames,
				sampleCount: state.debug.samples.length,
				renderedVisualFrames: state.debug.renderedVisualFrames,
				skippedVisualFrames: state.debug.skippedVisualFrames,
			},
			visual,
			cosmos: cosmosRenderer.getStats?.() || null,
			ui: {
				root: formatRect(root),
				world: formatRect(dom.world),
				space: formatRect(dom.space),
				cosmos: formatRect(dom.cosmos),
				cosmosTexture: formatRect(dom.cosmosTexture),
				lyrics: formatRect(dom.lyrics),
				player: formatRect(dom.player),
				queue: formatRect(dom.queue),
				cloud: formatRect(dom.cloud),
			},
			state: {
				open: state.open,
				paused: state.isPaused,
				progressMs: Math.round(state.progressMs || 0),
				durationMs: Math.round(state.durationMs || 0),
				zoom: round(state.cameraZoom, 3),
				targetZoom: round(state.targetCameraZoom, 3),
				tiltX: round(state.tiltX, 3),
				tiltY: round(state.tiltY, 3),
				queueOffset: state.queueOffset,
				queueLength: state.queueLength,
				lyricsCount: state.lyrics.length,
				activeLine: state.activeLine,
				activeWord: state.activeWord,
				hasSyncedLyrics: state.hasSyncedLyrics,
				hasWordTiming: state.hasWordTiming,
				hasWordHighlight: state.hasWordHighlight,
				lyricText: cleanLyricLine(dom.lyricCurrent.textContent || ""),
			},
			track: {
				uri: state.trackInfo?.uri || "",
				title: state.trackInfo?.title || "",
				artist: state.trackInfo?.artist || "",
			},
			colors: {
				hot: cssVar("--novaplayer-hot"),
				cyan: cssVar("--novaplayer-cyan"),
				lime: cssVar("--novaplayer-lime"),
				bg1: cssVar("--novaplayer-bg-1"),
				bg2: cssVar("--novaplayer-bg-2"),
				bg3: cssVar("--novaplayer-bg-3"),
			},
			env: {
				userAgent: navigator.userAgent,
				devicePixelRatio: window.devicePixelRatio || 1,
				viewport: `${window.innerWidth}x${window.innerHeight}`,
				spicetify: Spicetify.Platform?.version || Spicetify.version || "",
			},
		};

		return JSON.stringify(snapshot, null, 2);
	}

	async function copyDebugSnapshot() {
		const text = getDebugSnapshot();
		setDebugValue("snapshot", text);
		try {
			await navigator.clipboard.writeText(text);
			Spicetify.showNotification?.("novaplayer debug snapshot copied");
		} catch (error) {
			const input = document.createElement("textarea");
			input.value = text;
			input.style.position = "fixed";
			input.style.left = "-9999px";
			document.body.append(input);
			input.select();
			document.execCommand("copy");
			input.remove();
			Spicetify.showNotification?.("novaplayer debug snapshot copied");
		}
	}

	function formatRect(element) {
		if (!element) {
			return "missing";
		}
		const rect = element.getBoundingClientRect();
		const visible =
			rect.right > 0 &&
			rect.bottom > 0 &&
			rect.left < window.innerWidth &&
			rect.top < window.innerHeight &&
			rect.width > 1 &&
			rect.height > 1;
		return `${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)} ${visible ? "visible" : "offscreen"}`;
	}

	function cssVar(name) {
		return getComputedStyle(root).getPropertyValue(name).trim();
	}

	function round(value, decimals = 2) {
		const factor = 10 ** decimals;
		return Math.round((Number(value) || 0) * factor) / factor;
	}

	function handlePointerMove(event) {
		if (!state.open) {
			return;
		}

		const rect = root.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
		const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

		state.targetTiltX = clamp(x * 30, -34, 34);
		state.targetTiltY = clamp(y * -22, -25, 25);
		state.lastPointerMove = performance.now();

		const playlistsRight = isPlaylistsRight();
		const nearPlaylistEdge = playlistsRight
			? window.innerWidth - event.clientX <= 46
			: event.clientX <= 46;
		const awayFromPlaylist = playlistsRight
			? event.clientX < window.innerWidth - 430
			: event.clientX > 430;

		if (nearPlaylistEdge) {
			openPlaylistDrawer();
		} else if (state.playlistDrawerOpen && awayFromPlaylist && !dom.playlists.matches(":hover")) {
			closePlaylistDrawer();
		}
	}

	function handleStageWheel(event) {
		if (!state.open || event.target.closest(".novaplayer__settings, .novaplayer__queue, .novaplayer__playlists, .novaplayer__progress, .novaplayer__volume")) {
			return;
		}

		event.preventDefault();
		state.targetCameraZoom = clamp(state.targetCameraZoom - event.deltaY * 0.0014, -0.46, 0.52);
	}

	function openPlaylistDrawer() {
		if (!state.open || !state.settings.showPlaylists) {
			return;
		}

		state.playlistDrawerOpen = true;
		root.classList.add("is-playlists-open");
		if (!state.playlistsLoaded && !state.playlistsLoading) {
			loadPlaylists();
		}
	}

	function closePlaylistDrawer() {
		state.playlistDrawerOpen = false;
		root.classList.remove("is-playlists-open");
	}

	function isPlaylistsRight() {
		return Boolean(state.settings.playlistsOnRight);
	}

	async function loadPlaylists() {
		state.playlistsLoading = true;
		renderPlaylistDrawer("Loading playlists");

		try {
			const playlists = await getSpotifyPlaylists();
			state.playlists = playlists.slice(0, MAX_PLAYLIST_ITEMS);
			state.playlistsLoaded = true;
			renderPlaylistDrawer();
		} catch (error) {
			state.playlists = [];
			renderPlaylistDrawer("Playlists unavailable");
		} finally {
			state.playlistsLoading = false;
		}
	}

	async function getSpotifyPlaylists() {
		const found = [];
		const seen = new Set();

		if (Spicetify.Platform?.RootlistAPI?.getContents) {
			try {
				const rootlist = await Spicetify.Platform.RootlistAPI.getContents({ offset: 0, limit: 120 });
				collectPlaylistCandidates(rootlist, found, seen);
			} catch (error) {}
		}

		for (const endpoint of ["sp://core-playlist/v1/rootlist", "sp://core-playlist/v1/playlists"]) {
			if (found.length >= MAX_PLAYLIST_ITEMS) {
				break;
			}

			try {
				const response = await Spicetify.CosmosAsync.get(endpoint);
				collectPlaylistCandidates(response, found, seen);
			} catch (error) {}
		}

		return found;
	}

	function collectPlaylistCandidates(value, output, seen, depth = 0) {
		if (!value || depth > 6 || output.length >= MAX_PLAYLIST_ITEMS) {
			return;
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				collectPlaylistCandidates(item, output, seen, depth + 1);
			}
			return;
		}

		if (typeof value !== "object") {
			return;
		}

		const uri = String(value.uri || value.link || value.playlist_uri || value.playlistUri || value.id || "");
		const isPlaylist =
			uri.startsWith("spotify:playlist:") ||
			/^spotify:user:[^:]+:playlist:[^:]+/.test(uri) ||
			uri === "spotify:collection:tracks";
		const name = value.name || value.title || value.label || value.metadata?.name || value.metadata?.title;

		if (isPlaylist && name && !seen.has(uri)) {
			seen.add(uri);
			output.push({
				uri,
				name: String(name),
				owner: String(value.owner?.name || value.ownerName || value.subtitle || value.metadata?.owner_name || "Spotify"),
				cover: pickPlaylistCover(value),
			});
		}

		for (const key of ["items", "rows", "children", "contents", "playlists", "data", "rootlist", "nodes"]) {
			collectPlaylistCandidates(value[key], output, seen, depth + 1);
		}
	}

	function pickPlaylistCover(value) {
		const images = [
			value.image,
			value.image_url,
			value.imageUrl,
			value.cover,
			value.coverArt?.sources?.[0]?.url,
			value.images?.[0]?.url,
			value.metadata?.image_url,
			value.metadata?.image_xlarge_url,
			value.metadata?.picture,
		].filter(Boolean);

		return normalizeCoverUrl(images[0] || fallbackCover);
	}

	function renderPlaylistDrawer(message = "") {
		dom.playlistsCount.textContent = message ? "..." : String(state.playlists.length);
		dom.playlistsList.replaceChildren();

		if (message) {
			const status = document.createElement("div");
			status.className = "novaplayer__playlists-empty";
			status.textContent = message;
			dom.playlistsList.append(status);
			return;
		}

		if (!state.playlists.length) {
			const empty = document.createElement("div");
			empty.className = "novaplayer__playlists-empty";
			empty.textContent = "No playlists found";
			dom.playlistsList.append(empty);
			return;
		}

		const nodes = state.playlists.map((playlist) => {
			const item = document.createElement("button");
			item.type = "button";
			item.className = "novaplayer__playlist-item";
			item.title = playlist.name;
			item.addEventListener("click", () => {
				Spicetify.Player.playUri(playlist.uri).catch(() => Spicetify.showNotification?.("Could not play playlist", true));
				closePlaylistDrawer();
			});

			const cover = document.createElement("span");
			cover.className = "novaplayer__playlist-cover";
			cover.style.backgroundImage = cssBackground(playlist.cover);

			const copy = document.createElement("span");
			copy.className = "novaplayer__playlist-copy";

			const title = document.createElement("span");
			title.className = "novaplayer__playlist-title";
			title.textContent = playlist.name;

			const owner = document.createElement("span");
			owner.className = "novaplayer__playlist-owner";
			owner.textContent = playlist.owner;

			copy.append(title, owner);
			item.append(cover, copy);
			return item;
		});

		dom.playlistsList.append(...nodes);
	}

	function handleQueueWheel(event) {
		if (!state.open || state.queueLength < 2 || getMaxQueueOffset() <= 0) {
			return;
		}

		event.preventDefault();
		state.queueWheelRemainder += event.deltaY || event.deltaX || 0;
		const step = Math.trunc(state.queueWheelRemainder / 72);
		if (!step) {
			return;
		}

		state.queueWheelRemainder -= step * 72;
		setQueueOffset(state.queueOffset + step);
	}

	function setStyleValue(element, property, value) {
		if (element && element.style[property] !== value) {
			element.style[property] = value;
		}
	}

	function setStyleProperty(element, property, value) {
		if (element && element.style.getPropertyValue(property) !== value) {
			element.style.setProperty(property, value);
		}
	}

	function clearMotionStyles() {
		setStyleValue(dom.cloud, "transform", "");
		setStyleValue(dom.lyrics, "transform", "");
		setStyleValue(dom.lyricMeta, "transform", "");
		setStyleValue(dom.player, "transform", "");
		visualizer.setMotion?.({ pitch: 0, yaw: 0, roll: 0 });
		Object.assign(state.motion, {
			cloudPitch: 0,
			cloudYaw: 0,
			cloudRoll: 0,
			cloudShiftX: 0,
			cloudShiftY: 0,
			lyricsPitch: 0,
			lyricsYaw: 0,
			lyricsRoll: 0,
			lyricsShiftX: 0,
			lyricsShiftY: 0,
			playerY: -18,
			playerScale: 1,
		});
	}

	function startTiltLoop() {
		if (state.raf) {
			return;
		}

		const frame = (time) => {
			state.lastLoopWork = time;

			const frameStart = performance.now();
			const rawDelta = state.lastFrame ? time - state.lastFrame : 16;
			const delta = Math.min(rawDelta, 40);
			const progressDelta = Math.min(rawDelta, 300);
			state.lastFrame = time;

			const idleTime = time - state.idleStart;
			const pointerAge = time - state.lastPointerMove;
			const pointerWeight = Math.pow(clamp(1 - pointerAge / 2200, 0, 1), 1.7);
			const idleX = Math.sin(idleTime / 5600) * 4.1 + Math.sin(idleTime / 9300) * 1.05;
			const idleY = Math.cos(idleTime / 6800) * 2.75;
			const targetX = state.targetTiltX * pointerWeight + idleX;
			const targetY = state.targetTiltY * pointerWeight + idleY;
			const smooth = 1 - Math.pow(0.00045, delta / 1000);

			state.tiltX = lerp(state.tiltX, targetX, smooth);
			state.tiltY = lerp(state.tiltY, targetY, smooth);

			state.cameraZoom = lerp(state.cameraZoom, state.targetCameraZoom, smooth * 0.68);
			syncProgressForFrame(time, progressDelta);

			if (state.debug.options.world3d) {
				const seconds = Math.max(0, (state.progressMs || 0) / 1000);
				const motionSeed = seededRandom(state.trackUri || "novaplayer-motion") * Math.PI * 2;
				const motionSmooth = 1 - Math.pow(0.00004, delta / 1000);
				const targetCloudPitch = Math.sin(seconds * 0.17 + motionSeed) * 0.25 + Math.sin(seconds * 0.071 + motionSeed * 1.7) * 0.085 + state.tiltY * 0.0028;
				const targetCloudYaw = Math.cos(seconds * 0.155 + motionSeed * 0.77) * 0.29 + Math.sin(seconds * 0.082 + motionSeed * 1.2) * 0.082 + state.tiltX * 0.0032;
				const targetCloudRoll = Math.sin(seconds * 0.115 + motionSeed * 1.24) * 0.105 + (-state.tiltX * 0.001 + state.tiltY * 0.0007);
				const targetCloudShiftX = Math.sin(seconds * 0.142 + motionSeed * 0.6) * 56 + Math.cos(seconds * 0.068 + motionSeed) * 22 - state.tiltX * 3.1;
				const targetCloudShiftY = Math.cos(seconds * 0.128 + motionSeed * 1.4) * 38 + Math.sin(seconds * 0.061 + motionSeed * 0.4) * 17 - state.tiltY * 2.4;
				const targetLyricsPitch = Math.sin(seconds * 0.13 + motionSeed * 0.8) * 5.6 + state.tiltY * 0.06;
				const targetLyricsYaw = Math.cos(seconds * 0.118 + motionSeed * 1.1) * 6.8 - state.tiltX * 0.07;
				const targetLyricsRoll = Math.sin(seconds * 0.09 + motionSeed) * 2.6 - state.tiltX * 0.014 + state.tiltY * 0.008;
				const targetLyricsShiftX = Math.cos(seconds * 0.105 + motionSeed * 1.3) * 34 - state.tiltX * 1.55;
				const targetLyricsShiftY = Math.sin(seconds * 0.098 + motionSeed * 0.9) * 22 - state.tiltY * 1.1;
				const targetPlayerY = Math.min(0, state.cameraZoom) * 260 - 18;
				const targetPlayerScale = 1 + Math.max(0, -state.cameraZoom) * 0.025;
				const motion = state.motion;

				motion.cloudPitch = lerp(motion.cloudPitch, targetCloudPitch, motionSmooth);
				motion.cloudYaw = lerp(motion.cloudYaw, targetCloudYaw, motionSmooth);
				motion.cloudRoll = lerp(motion.cloudRoll, targetCloudRoll, motionSmooth);
				motion.cloudShiftX = lerp(motion.cloudShiftX, targetCloudShiftX, motionSmooth);
				motion.cloudShiftY = lerp(motion.cloudShiftY, targetCloudShiftY, motionSmooth);
				motion.lyricsPitch = lerp(motion.lyricsPitch, targetLyricsPitch, motionSmooth);
				motion.lyricsYaw = lerp(motion.lyricsYaw, targetLyricsYaw, motionSmooth);
				motion.lyricsRoll = lerp(motion.lyricsRoll, targetLyricsRoll, motionSmooth);
				motion.lyricsShiftX = lerp(motion.lyricsShiftX, targetLyricsShiftX, motionSmooth);
				motion.lyricsShiftY = lerp(motion.lyricsShiftY, targetLyricsShiftY, motionSmooth);
				motion.playerY = lerp(motion.playerY, targetPlayerY, motionSmooth);
				motion.playerScale = lerp(motion.playerScale, targetPlayerScale, motionSmooth);

				const settings = state.settings;
				const cloudX = motion.cloudShiftX + settings.cloudOffsetX;
				const cloudY = motion.cloudShiftY + settings.cloudOffsetY;
				const lyricsX = motion.lyricsShiftX + settings.lyricsOffsetX;
				const lyricsY = motion.lyricsShiftY + settings.lyricsOffsetY;
				const lyricMetaY = lyricsY + settings.lyricMetaGap;
				const playerX = settings.playerOffsetX;
				const playerY = motion.playerY + settings.playerOffsetY;
				const coverRot = -1.5 + motion.cloudRoll * 57.2958;

				visualizer.setMotion?.({ pitch: motion.cloudPitch, yaw: motion.cloudYaw, roll: motion.cloudRoll });
				setStyleValue(dom.cloud, "transform", `translate(calc(-50% + ${cloudX.toFixed(2)}px), calc(-50% + ${cloudY.toFixed(2)}px)) rotate(${coverRot.toFixed(3)}deg) scale(1)`);
				setStyleValue(dom.lyrics, "transform", `translate(calc(-50% + ${lyricsX.toFixed(2)}px), calc(-50% + ${lyricsY.toFixed(2)}px)) perspective(1180px) rotateX(${motion.lyricsPitch.toFixed(3)}deg) rotateY(${motion.lyricsYaw.toFixed(3)}deg) rotateZ(${motion.lyricsRoll.toFixed(3)}deg)`);
				setStyleValue(dom.lyricMeta, "transform", `translate(calc(-50% + ${lyricsX.toFixed(2)}px), calc(-50% + ${lyricMetaY.toFixed(2)}px))`);
				setStyleValue(dom.player, "transform", `translateX(calc(-50% + ${playerX.toFixed(2)}px)) translateY(calc(${playerY.toFixed(2)}px + var(--novaplayer-player-reveal-y))) scale(${motion.playerScale.toFixed(4)})`);
				state.lastMotionUpdate = time;
				state.motionStylesApplied = true;
			} else if (state.motionStylesApplied) {
				clearMotionStyles();
				state.lastMotionUpdate = time;
				state.motionStylesApplied = false;
			}
			updateBackgroundFlow(time);
			if (state.renderProgressDirty || Math.abs(state.progressMs - Number(dom.progress.dataset.progressMs || 0)) > 650) {
				updateProgress();
			}
			const lyricInterval = state.hasWordTiming ? 90 : state.hasWordHighlight ? 130 : 220;
			if (!state.lastLyricCheck || time - state.lastLyricCheck >= lyricInterval) {
				updateActiveLyric();
				state.lastLyricCheck = time;
			}
			if (state.hasWordHighlight) {
				updateLyricWordProgress();
			}
			prepareTrackOutro();
			const visualAnimating = Boolean(visualizer.isAnimating?.(time));
			const visualMoving = state.open && !state.isPaused && state.debug.options.world3d;
			const targetVisualFps = visualAnimating || visualMoving ? state.debug.options.visualFps : state.debug.options.pausedVisualFps;
			const visualInterval = 1000 / Math.max(1, targetVisualFps || 24);
			const shouldRenderVisual = state.debug.options.visual && (!state.lastVisualRender || time - state.lastVisualRender >= visualInterval);
			let visualStats = state.lastVisualStats;

			if (!state.debug.options.visual) {
				visualStats = visualizer.getStats?.() || {
					pointCount: 0,
					drawCalls: 0,
					renderMs: 0,
					visual: false,
				};
			} else if (shouldRenderVisual) {
				visualStats = visualizer.render(time);
				state.lastVisualRender = time;
			} else if (visualStats) {
				visualStats = {
					...visualStats,
					drawCalls: 0,
					renderMs: 0,
					skipped: true,
					targetVisualFps,
				};
			}

			state.lastVisualStats = visualStats;
			recordDebugFrame(rawDelta, performance.now() - frameStart, visualStats, time);

			state.raf = requestAnimationFrame(frame);
		};

		state.raf = requestAnimationFrame(frame);
	}

	function stopTiltLoop() {
		if (state.raf) {
			cancelAnimationFrame(state.raf);
			state.raf = 0;
		}

		clearMotionStyles();
		setStyleProperty(dom.cosmos, "--novaplayer-flow-opacity", "0.28");
		setStyleProperty(dom.cosmos, "--novaplayer-flow-scale", "1");
		cosmosRenderer.pause?.();
		visualizer.pause();
		state.targetTiltX = 0;
		state.targetTiltY = 0;
		state.tiltX = 0;
		state.tiltY = 0;
		state.cameraZoom = 0;
		state.targetCameraZoom = 0;
		state.lastFrame = 0;
		state.lastMotionUpdate = 0;
		state.motionStylesApplied = false;
		state.lastLoopWork = 0;
		state.lastLyricCheck = 0;
		state.lastFlowUpdate = 0;
		state.lastVisualRender = 0;
	}

	function handleSongChange(event) {
		updateAllFromPlayer(false, event?.data);
	}

	function handlePlayPause(event) {
		if (event?.data) {
			state.isPaused = Boolean(event.data.isPaused);
		}
		state.lastProgressSync = performance.now();
		updateControlState();
	}

	function handleProgress(event) {
		const progress = Number(event?.data);
		if (Number.isFinite(progress)) {
			state.progressMs = progress;
		} else {
			state.progressMs = getProgressSafe();
		}

		state.lastProgressSync = performance.now();
		state.renderProgressDirty = true;
		if (!state.open) {
			updateProgress();
		}
	}

	function syncProgressForFrame(time, delta) {
		const syncAge = state.lastProgressSync ? time - state.lastProgressSync : Infinity;
		const duration = state.durationMs || 0;

		if (!state.isPaused && syncAge < 1800) {
			state.progressMs = duration
				? clamp(state.progressMs + delta, 0, duration)
				: Math.max(0, state.progressMs + delta);
			return;
		}

		if (syncAge < 900) {
			return;
		}

		state.progressMs = getProgressSafe();
		state.lastProgressSync = time;
	}

	function updateAllFromPlayer(forceTransition, playerData = Spicetify.Player.data) {
		if (!playerData?.item) {
			return;
		}

		const info = normalizeTrack(playerData.item);
		const isNewTrack = Boolean(info.uri && info.uri !== state.trackUri);

		state.trackInfo = info;
		state.durationMs = getDurationSafe(playerData);
		state.progressMs = getProgressSafe();
		state.lastProgressSync = performance.now();
		state.isPaused = Boolean(playerData.isPaused);
		state.shuffle = Boolean(playerData.shuffle ?? Spicetify.Player.getShuffle?.());
		state.repeat = Number(playerData.repeat ?? Spicetify.Player.getRepeat?.() ?? 0);
		state.heart = getHeartSafe();

		if (isNewTrack || forceTransition) {
			state.trackUri = info.uri;
			state.queueOffset = 0;
			state.queueWheelRemainder = 0;
			if (isNewTrack) {
				cancelPendingPaletteWork();
			}
			triggerTrackTransition();
			applyCover(info.cover);
			renderTrackInfo(info);
			loadAudioAnalysis(info);
			loadLyrics(info);
		} else {
			renderTrackInfo(info);
		}

		renderQueue(playerData);
		updateProgress();
		updateControlState();
	}

	function renderTrackInfo(info) {
		dom.nowTitle.textContent = info.title;
		dom.nowArtist.textContent = info.artist || info.album || "Spotify";
		dom.metaTitle.textContent = info.title;
		dom.metaArtist.textContent = info.artist;
		dom.nowCover.style.backgroundImage = cssBackground(info.cover);
	}

	function applyCover(cover) {
		const image = normalizeCoverUrl(cover || fallbackCover);

		root.style.setProperty("--novaplayer-cover", cssBackground(image));
		visualizer.setCover(image, state.trackUri);
	}

	function applyCoverPalette(palette) {
		if (!palette) {
			return;
		}

		const target = normalizePaletteRaw(palette);
		const token = ++state.paletteApplyToken;
		clearScheduledPalette();
		if (state.paletteFrame) {
			cancelAnimationFrame(state.paletteFrame);
			state.paletteFrame = 0;
		}

		const delay = state.paletteReady ? TRACK_PALETTE_DELAY : 0;
		if (delay > 0) {
			state.paletteScheduleTimer = setTimeout(() => {
				state.paletteScheduleTimer = 0;
				requestAnimationFrame(() => commitCoverPalette(target, token));
			}, delay);
			return;
		}

		commitCoverPalette(target, token);
	}

	function clearScheduledPalette() {
		if (state.paletteScheduleTimer) {
			clearTimeout(state.paletteScheduleTimer);
			state.paletteScheduleTimer = 0;
		}
	}

	function commitCoverPalette(target, token) {
		if (token !== state.paletteApplyToken) {
			return;
		}

		const from = state.paletteRaw || readCurrentPaletteRaw() || target;
		const duration = state.paletteReady ? PALETTE_TRANSITION_DURATION : 0;
		state.paletteReady = true;
		scheduleCosmosTextureUpdate(target, token, duration ? 80 : 0);

		if (state.paletteFrame) {
			cancelAnimationFrame(state.paletteFrame);
			state.paletteFrame = 0;
		}

		if (!duration) {
			applyPaletteRaw(target);
			state.paletteRaw = target;
			return;
		}

		const start = performance.now();
		let lastUpdate = 0;
		const step = (now) => {
			if (token !== state.paletteApplyToken) {
				state.paletteFrame = 0;
				return;
			}

			const progress = clamp((now - start) / duration, 0, 1);
			const eased = easeInOutCubic(progress);
			if (!lastUpdate || now - lastUpdate >= PALETTE_UPDATE_INTERVAL || progress >= 1) {
				applyPaletteRaw(mixPaletteRaw(from, target, eased));
				lastUpdate = now;
			}

			if (progress < 1) {
				state.paletteFrame = requestAnimationFrame(step);
			} else {
				applyPaletteRaw(target);
				state.paletteRaw = target;
				state.paletteFrame = 0;
			}
		};

		state.paletteFrame = requestAnimationFrame(step);
	}

	function scheduleCosmosTextureUpdate(target, token, delay = 0) {
		const run = () => {
			requestAnimationFrame(() => {
				if (token === state.paletteApplyToken) {
					updateCosmosTexture(target);
				}
			});
		};

		if (delay > 0) {
			setTimeout(run, delay);
		} else {
			run();
		}
	}

	async function loadAudioAnalysis(info) {
		const token = ++state.audioToken;
		state.audioData = null;
		state.audioSegmentIndex = 0;
		state.audioBeatIndex = 0;

		if (!info?.uri?.startsWith("spotify:track:") || typeof Spicetify.getAudioData !== "function") {
			return;
		}

		try {
			const response = Spicetify.getAudioData.length
				? await Spicetify.getAudioData.call(Spicetify, info.uri)
				: await Spicetify.getAudioData.call(Spicetify);
			if (token !== state.audioToken || info.uri !== state.trackUri) {
				return;
			}

			state.audioData = normalizeAudioAnalysis(response);
		} catch (error) {
			if (token === state.audioToken) {
				state.audioData = null;
			}
		}
	}

	function normalizeAudioAnalysis(response) {
		const source = response?.audioAnalysis || response?.analysis || response || {};
		const segments = normalizeTimedItems(source.segments);
		const beats = normalizeTimedItems(source.beats);

		if (!segments.length && !beats.length) {
			return null;
		}

		return { segments, beats };
	}

	function normalizeTimedItems(items) {
		if (!Array.isArray(items)) {
			return [];
		}

		return items
			.map((item) => {
				const start = Number(item.start);
				const duration = Math.max(0.04, Number(item.duration) || 0.25);
				if (!Number.isFinite(start)) {
					return null;
				}

				return {
					start,
					duration,
					end: start + duration,
					confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : 0.55,
					loudness:
						Number(item.loudness_max) ||
						Number(item.loudnessMax) ||
						Number(item.loudness_start) ||
						Number(item.loudnessStart) ||
						-28,
				};
			})
			.filter(Boolean)
			.sort((a, b) => a.start - b.start);
	}

	function updateBackgroundFlow(time) {
		if (!state.debug.options.visual) {
			return;
		}

		if (FLOW_UPDATE_INTERVAL > 0 && state.lastFlowUpdate && time - state.lastFlowUpdate < FLOW_UPDATE_INTERVAL) {
			return;
		}

		const elapsed = state.lastFlowUpdate ? Math.min(120, time - state.lastFlowUpdate) : 16;
		state.lastFlowUpdate = time;
		const settings = state.settings;
		const motionAmount = Math.max(0, settings.nebulaMotion);
		state.flowClock += (elapsed / 1000) * (state.isPaused ? 0.28 : 1) * motionAmount;
		const seconds = Math.max(0, (state.progressMs || 0) / 1000);
		const targetEnergy = state.isPaused ? 0.07 : getMusicEnergy(seconds);
		const energySmooth = 1 - Math.pow(0.0025, elapsed / 1000);
		state.flowEnergy = lerp(state.flowEnergy, targetEnergy, energySmooth);

		const seed = seededRandom(state.trackUri || "novaplayer-flow") * Math.PI * 2;
		const flowSeconds = state.flowClock;
		const phase = seed + flowSeconds * (0.11 + state.flowEnergy * 0.035);
		const altPhase = seed * 0.7 + flowSeconds * (0.085 + state.flowEnergy * 0.026);
		const slowPhase = seed * 1.23 + flowSeconds * (0.044 + state.flowEnergy * 0.014);
		const x = 50 + Math.sin(phase * 0.86) * 13 + Math.cos(slowPhase * 0.52) * 4.5;
		const y = 50 + Math.cos(phase * 0.73) * 10 + Math.sin(slowPhase * 0.43) * 3.5;
		const altX = 50 + Math.cos(altPhase * 0.91) * 15 + Math.sin(slowPhase * 0.61) * 3.5;
		const altY = 50 + Math.sin(altPhase * 0.67) * 13 + Math.cos(slowPhase * 0.47) * 3.5;
		const thirdX = 50 + Math.sin(slowPhase * 0.86 + 1.7) * 17;
		const thirdY = 50 + Math.cos(slowPhase * 0.74 + 0.4) * 14;
		const opacity = state.isPaused ? 0.62 : 0.7 + state.flowEnergy * 0.12;
		const scale = 1.015 + state.flowEnergy * 0.07;
		const saturation = 1.1 + state.flowEnergy * 0.32;
		const blur = 30 - state.flowEnergy * 8;
		const intensity = Math.max(0, settings.nebulaIntensity);
		const nebulaOpacity = (0.34 + state.flowEnergy * 0.2) * Math.min(1.35, 0.45 + intensity * 0.72);
		const nebulaHotAlpha = (0.075 + state.flowEnergy * 0.115) * intensity;
		const nebulaCyanAlpha = (0.06 + state.flowEnergy * 0.095) * intensity;
		const nebulaLimeAlpha = (0.04 + state.flowEnergy * 0.075) * intensity;
		const rotate = Math.sin(slowPhase * 0.22) * 0.55 * motionAmount;
		const flow = state.flowState;
		const smooth = state.flowReady ? 1 - Math.pow(0.035, elapsed / 1000) : 1;
		const alphaSmooth = state.flowReady ? 1 - Math.pow(0.08, elapsed / 1000) : 1;
		flow.x = lerp(flow.x, x, smooth);
		flow.y = lerp(flow.y, y, smooth);
		flow.altX = lerp(flow.altX, altX, smooth);
		flow.altY = lerp(flow.altY, altY, smooth);
		flow.thirdX = lerp(flow.thirdX, thirdX, smooth);
		flow.thirdY = lerp(flow.thirdY, thirdY, smooth);
		flow.opacity = lerp(flow.opacity, opacity, alphaSmooth);
		flow.scale = lerp(flow.scale, scale, alphaSmooth);
		flow.saturation = lerp(flow.saturation, saturation, alphaSmooth);
		flow.blur = lerp(flow.blur, blur, alphaSmooth);
		flow.nebulaOpacity = lerp(flow.nebulaOpacity, nebulaOpacity, alphaSmooth);
		flow.hotAlpha = lerp(flow.hotAlpha, nebulaHotAlpha, alphaSmooth);
		flow.cyanAlpha = lerp(flow.cyanAlpha, nebulaCyanAlpha, alphaSmooth);
		flow.limeAlpha = lerp(flow.limeAlpha, nebulaLimeAlpha, alphaSmooth);
		flow.rotate = lerp(flow.rotate, rotate, smooth);
		state.flowReady = true;

		const flowShiftX = ((flow.x - 50) * 0.32 * motionAmount).toFixed(2);
		const flowShiftY = ((flow.y - 50) * 0.24 * motionAmount).toFixed(2);

		setStyleProperty(dom.cosmos, "--novaplayer-flow-x", `${flow.x.toFixed(2)}%`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-y", `${flow.y.toFixed(2)}%`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-alt-x", `${flow.altX.toFixed(2)}%`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-alt-y", `${flow.altY.toFixed(2)}%`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-third-x", `${flow.thirdX.toFixed(2)}%`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-third-y", `${flow.thirdY.toFixed(2)}%`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-opacity", flow.opacity.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-flow-scale", flow.scale.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-flow-saturation", flow.saturation.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-flow-blur", `${flow.blur.toFixed(1)}px`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-shift-x", `${flowShiftX}px`);
		setStyleProperty(dom.cosmos, "--novaplayer-flow-shift-y", `${flowShiftY}px`);
		setStyleProperty(dom.cosmos, "--novaplayer-nebula-opacity", flow.nebulaOpacity.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-nebula-hot-alpha", flow.hotAlpha.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-nebula-cyan-alpha", flow.cyanAlpha.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-nebula-lime-alpha", flow.limeAlpha.toFixed(3));
		setStyleProperty(dom.cosmos, "--novaplayer-nebula-rotate", `${flow.rotate.toFixed(3)}deg`);
		cosmosRenderer.setFlow?.({
			shiftX: Number(flowShiftX),
			shiftY: Number(flowShiftY),
			starOpacity: settings.starIntensity,
		});
		cosmosRenderer.render?.(time);
	}

	function getMusicEnergy(seconds) {
		const analysis = state.audioData;
		const seed = seededRandom(state.trackUri || "novaplayer-energy") * 11;
		let energy = 0.22 + Math.sin(seconds * 0.92 + seed) * 0.06 + Math.sin(seconds * 1.73 + seed * 0.5) * 0.04;

		if (analysis?.segments?.length) {
			const segment = getCurrentTimedItem(analysis.segments, seconds, "audioSegmentIndex");
			if (segment) {
				const loudness = clamp((segment.loudness + 42) / 42, 0, 1);
				energy = 0.12 + loudness * 0.66;
			}
		}

		if (analysis?.beats?.length) {
			const beat = getCurrentTimedItem(analysis.beats, seconds, "audioBeatIndex");
			if (beat) {
				const beatT = clamp((seconds - beat.start) / Math.max(beat.duration, 0.08), 0, 1);
				const beatPulse = Math.max(0, 1 - beatT * 2.5) * clamp(beat.confidence, 0.2, 1);
				energy += beatPulse * 0.16;
			}
		}

		return clamp(energy, 0.06, 0.88);
	}

	function getCurrentTimedItem(items, seconds, cursorKey) {
		if (!items?.length) {
			return null;
		}

		let cursor = clamp(Number(state[cursorKey]) || 0, 0, items.length - 1);
		while (cursor > 0 && items[cursor].start > seconds) {
			cursor -= 1;
		}
		while (cursor < items.length - 1 && items[cursor].end <= seconds) {
			cursor += 1;
		}
		state[cursorKey] = cursor;
		return items[cursor] || null;
	}

	async function loadLyrics(info) {
		const token = ++state.fetchToken;
		state.lyrics = fallbackLyrics(info, "Loading lyrics");
		state.lyricsHidden = false;
		state.instrumentalBreak = null;
		state.hasSyncedLyrics = false;
		state.activeLine = 0;
		state.activeWord = -1;
		state.hasWordTiming = false;
		state.hasWordHighlight = false;
		state.renderLyricLineKey = "";
		state.backVocalKeys = new Set();
		dom.backs.replaceChildren();
		state.renderedActiveWord = -1;
		state.activeWordNode = null;
		renderLyrics();

		if (!info.uri?.startsWith("spotify:track:")) {
			hideLyrics();
			return;
		}

		try {
			const id = info.uri.split(":")[2];
			const response = await Spicetify.CosmosAsync.get(`${LYRIC_ENDPOINT + id}?format=json&vocalRemoval=false&market=from_token`);

			if (token !== state.fetchToken) {
				return;
			}

			const rawLyrics = response?.lyrics;
			const lines = Array.isArray(rawLyrics?.lines)
				? rawLyrics.lines
						.map((line) => createLyricLine(line))
						.filter((line) => isRenderableLyricText(line.text) || line.backVocals?.length)
				: [];

			if (!lines.length) {
				hideLyrics();
				return;
			} else {
				for (let index = 0; index < lines.length; index += 1) {
					lines[index].end = lines[index + 1]?.start || getDurationSafe() || lines[index].start + 3600;
					syncBackVocalTiming(lines[index]);
					lines[index].instrumentalBreaks = getWordInstrumentalBreaks(lines[index]);
					const instrumentalBreak = isPrimaryLyricLine(lines[index]) ? getLineInstrumentalBreak(lines[index], lines[index].end) : null;
					lines[index].instrumentalStart = instrumentalBreak?.start || 0;
					lines[index].instrumentalEnd = instrumentalBreak?.end || 0;
					if (!lines[index].words.length && rawLyrics.syncType === "LINE_SYNCED") {
						lines[index].words = estimateLyricWords(lines[index]);
						lines[index].estimatedWords = true;
					}
				}

				state.lyrics = lines;
				state.lyricsHidden = false;
				state.hasSyncedLyrics = rawLyrics.syncType === "LINE_SYNCED";
				state.hasWordTiming = state.hasSyncedLyrics && lines.some((line) => line.words.length && !line.estimatedWords);
				state.hasWordHighlight = state.hasSyncedLyrics && lines.some((line) => line.words.length);
			}

			state.activeLine = 0;
			state.activeWord = -1;
			state.renderLyricLineKey = "";
			updateActiveLyric(true);
		} catch (error) {
			if (token !== state.fetchToken) {
				return;
			}

			hideLyrics();
		}
	}

	function fallbackLyrics(info, message) {
		return [
			{ start: 0, end: 1, text: message, words: [], role: "", roleLabel: "" },
			{ start: 1, end: 2, text: info.title || "Unknown track", words: [], role: "", roleLabel: "" },
			{ start: 2, end: 3, text: info.artist || info.album || "Spotify", words: [], role: "", roleLabel: "" },
		];
	}

	function hideLyrics() {
		state.lyrics = [];
		state.lyricsHidden = true;
		state.instrumentalBreak = null;
		state.hasSyncedLyrics = false;
		state.activeLine = 0;
		state.activeWord = -1;
		state.hasWordTiming = false;
		state.hasWordHighlight = false;
		state.renderLyricLineKey = "";
		state.backVocalKeys = new Set();
		state.renderedActiveWord = -1;
		state.activeWordNode = null;
		renderLyrics();
	}

	function updateActiveLyric(force = false) {
		if (!state.lyrics.length) {
			return;
		}

		let nextIndex = 0;

		if (state.hasSyncedLyrics) {
			const position = state.progressMs + 120;
			for (let index = 0; index < state.lyrics.length; index += 1) {
				if (state.lyrics[index].start <= position) {
					nextIndex = index;
				} else {
					break;
				}
			}
		}

		const instrumentalBreak = getInstrumentalBreakState(state.progressMs, nextIndex);
		const nextWord = !instrumentalBreak && state.hasWordHighlight ? getActiveWordIndex(state.lyrics[nextIndex], state.progressMs) : -1;
		if (!instrumentalBreak) {
			showTimedBackVocals(state.progressMs + 70, nextIndex);
		}

		const preLyricsChanged = dom.lyrics.classList.contains("is-pre-lyrics") !== isBeforeFirstLyric();
		const breakChanged = (state.instrumentalBreak?.key || "") !== (instrumentalBreak?.key || "");
		const lineChanged = force || nextIndex !== state.activeLine || preLyricsChanged || breakChanged;
		const wordChanged = nextWord !== state.activeWord;

		if (lineChanged) {
			state.activeLine = nextIndex;
			state.instrumentalBreak = instrumentalBreak;
			state.activeWord = nextWord;
			renderLyrics(true);
		} else if (wordChanged) {
			state.instrumentalBreak = instrumentalBreak;
			state.activeWord = nextWord;
			updateLyricWordClasses(nextWord);
		}
	}

	function renderLyrics(animated = false) {
		if (state.lyricsHidden || !state.lyrics.length) {
			cancelLyricCarouselAnimations();
			state.backVocalKeys = new Set();
			dom.backs.replaceChildren();
			dom.lyricPrev.textContent = "";
			dom.lyricCurrent.replaceChildren();
			dom.lyricNext.textContent = "";
			dom.vocalRole.textContent = "";
			dom.vocalRole.hidden = true;
			dom.lyrics.dataset.role = "";
			dom.lyrics.classList.toggle("is-hidden", state.lyricsHidden);
			dom.lyrics.classList.remove("has-synced", "has-word-sync", "is-line-changing", "is-pre-lyrics", "is-instrumental");
			return;
		}

		dom.lyrics.classList.remove("is-hidden");
		if (isBeforeFirstLyric()) {
			cancelLyricCarouselAnimations();
			state.backVocalKeys = new Set();
			dom.backs.replaceChildren();
			dom.lyricPrev.textContent = "";
			dom.lyricCurrent.replaceChildren();
			dom.lyricNext.textContent = "";
			dom.vocalRole.textContent = "";
			dom.vocalRole.hidden = true;
			dom.lyrics.dataset.role = "";
			dom.lyrics.classList.add("is-pre-lyrics");
			dom.lyrics.classList.remove("has-synced", "has-word-sync", "is-line-changing", "is-instrumental");
			return;
		}
		dom.lyrics.classList.remove("is-pre-lyrics");

		if (state.instrumentalBreak) {
			renderInstrumentalBreak(state.instrumentalBreak, animated);
			return;
		}

		dom.lyrics.classList.remove("is-instrumental");
		const active = state.lyrics[state.activeLine] || state.lyrics[0] || { text: "" };

		const displayIndex = active.role === "back" || !active.text ? findDisplayLyricIndex(state.activeLine) : state.activeLine;
		const current = state.lyrics[displayIndex] || active;
		const previous = findNeighborLyric(displayIndex, -1);
		const next = findNeighborLyric(displayIndex, 1);

		const lineKey = `${displayIndex}:${current.text}:${current.role || ""}`;
		const lineChanged = lineKey !== state.renderLyricLineKey;

		if (lineChanged) {
			const carouselSnapshot = animated ? captureLyricCarouselSnapshot() : null;
			state.renderLyricLineKey = lineKey;
			dom.lyricPrev.textContent = previous?.text || "";
			renderCurrentLyric(current);
			dom.lyricNext.textContent = next?.text || "";
			dom.vocalRole.textContent =
				current.roleLabel || (state.hasSyncedLyrics ? (state.hasWordTiming ? "WORD SYNC" : state.hasWordHighlight ? "WORD FLOW" : "LINE SYNC") : "UNSYNCED");
			dom.vocalRole.hidden = !current.roleLabel && !state.hasSyncedLyrics;
			dom.lyrics.dataset.role = current.role || "";
			dom.lyrics.classList.toggle("has-synced", state.hasSyncedLyrics);
			dom.lyrics.classList.toggle("has-word-sync", state.hasWordHighlight);
			updateLyricWordClasses(state.hasWordHighlight && displayIndex === state.activeLine ? state.activeWord : -1);
			if (carouselSnapshot) {
				playLyricCarouselTransition(carouselSnapshot);
			}
			return;
		}

		updateLyricWordClasses(state.hasWordHighlight && displayIndex === state.activeLine ? state.activeWord : -1);
	}

	function renderInstrumentalBreak(breakInfo, animated = false) {
		const lineKey = `instrumental:${breakInfo.key}`;
		const lineChanged = lineKey !== state.renderLyricLineKey;

		if (lineChanged) {
			const carouselSnapshot = animated ? captureLyricCarouselSnapshot() : null;
			state.renderLyricLineKey = lineKey;
			state.renderedActiveWord = -1;
			state.activeWordNode = null;
			state.backVocalKeys = new Set();
			dom.backs.replaceChildren();
			dom.lyricPrev.textContent = breakInfo.previousText || breakInfo.previous?.text || "";
			dom.lyricCurrent.replaceChildren(createInstrumentalIndicator());
			dom.lyricNext.textContent = breakInfo.nextText || breakInfo.next?.text || "";
			dom.vocalRole.textContent = "INTERLUDE";
			dom.vocalRole.hidden = false;
			dom.lyrics.dataset.role = "instrumental";
			dom.lyrics.classList.add("is-instrumental", "has-synced");
			dom.lyrics.classList.remove("has-word-sync");
			if (carouselSnapshot) {
				playLyricCarouselTransition(carouselSnapshot);
			}
		}
	}

	function captureLyricCarouselSnapshot() {
		cancelLyricCarouselAnimations();
		const slots = getLyricCarouselSlots()
			.map(({ slot, node }) => captureLyricSlot(slot, node))
			.filter(Boolean);
		return { slots };
	}

	function captureLyricSlot(slot, node) {
		if (!isLyricSlotVisible(node)) {
			return null;
		}

		const text = cleanLyricLine(node.textContent || "");
		if (!text) {
			return null;
		}

		const rect = node.getBoundingClientRect();
		if (!rect.width || !rect.height) {
			return null;
		}

		const style = window.getComputedStyle(node);
		return {
			slot,
			text,
			rect: {
				left: rect.left,
				top: rect.top,
				width: rect.width,
				height: rect.height,
			},
			frame: getLyricSlotFrame(node, rect),
			clone: node.cloneNode(true),
			role: dom.lyrics.dataset.role || "",
			isInstrumental: dom.lyrics.classList.contains("is-instrumental"),
			opacity: Number.parseFloat(style.opacity) || 1,
			filter: style.filter && style.filter !== "none" ? style.filter : "blur(0)",
			font: {
				color: style.color,
				fontSize: style.fontSize,
				fontWeight: style.fontWeight,
				lineHeight: style.lineHeight,
				textShadow: style.textShadow,
				whiteSpace: style.whiteSpace,
			},
		};
	}

	function playLyricCarouselTransition(snapshot) {
		if (!snapshot?.slots?.length || !dom.lyrics.isConnected) {
			return;
		}

		const targetSlots = getLyricCarouselSlots()
			.map(({ slot, node }) => captureLyricSlot(slot, node))
			.filter(Boolean);
		const usedOldSlots = new Set();
		const jobs = [];

		for (const targetSlot of targetSlots) {
			const oldSlot = findMatchingLyricSlot(snapshot.slots, targetSlot.text, usedOldSlots);
			if (oldSlot) {
				usedOldSlots.add(oldSlot);
				jobs.push(createLyricGhostMoveJob(oldSlot, targetSlot));
			} else {
				jobs.push(createLyricGhostFadeInJob(targetSlot));
			}
		}

		for (const oldSlot of snapshot.slots) {
			if (!usedOldSlots.has(oldSlot)) {
				jobs.push(createLyricGhostFadeOutJob(oldSlot));
			}
		}

		if (!jobs.length) {
			return;
		}

		syncLyricWordFlowGhostsFromCurrent();
		forceLyricGhostFrame(jobs);
		dom.lyrics.classList.add("is-lyric-carousel-running");

		for (const job of jobs) {
			const animation = job.ghost.animate(job.frames, job.options);
			trackLyricSlotAnimation(animation, job.ghost);
		}
	}

	function getLyricCarouselSlots() {
		return [
			{ slot: "prev", node: dom.lyricPrev },
			{ slot: "current", node: dom.lyricCurrent },
			{ slot: "next", node: dom.lyricNext },
		];
	}

	function isLyricSlotVisible(node) {
		if (!node || !node.isConnected || !node.getClientRects().length) {
			return false;
		}

		const style = window.getComputedStyle(node);
		return style.display !== "none" && style.visibility !== "hidden";
	}

	function findMatchingLyricSlot(slots, text, usedSlots) {
		const normalized = cleanLyricLine(text);
		if (!normalized) {
			return null;
		}

		return slots.find((slot) => !usedSlots.has(slot) && slot.text === normalized) || null;
	}

	function createLyricGhostMoveJob(oldSlot, targetSlot) {
		const ghost = createLyricGhost(targetSlot, targetSlot, targetSlot, {
			trackWordFlow: targetSlot.slot === "current",
		});
		const frames = [
			{
				transform: lyricGhostTransformBetween(oldSlot, targetSlot),
			},
			{
				transform: "translate3d(0, 0, 0) scale(1)",
			},
		];
		applyLyricGhostAnimationFrame(ghost, frames[0]);
		return { ghost, frames, options: getLyricCarouselTiming() };
	}

	function createLyricGhostFadeInJob(targetSlot) {
		const ghost = createLyricGhost(targetSlot, targetSlot, targetSlot, {
			trackWordFlow: targetSlot.slot === "current",
		});
		const y = targetSlot.slot === "prev" ? -18 : targetSlot.slot === "next" ? 18 : 34;
		const frames = [
			{
				opacity: 0,
				filter: targetSlot.slot === "current" ? "blur(9px)" : "blur(4px)",
				transform: `translate3d(0, ${y}px, 0) scale(.96)`,
			},
			{
				opacity: targetSlot.opacity,
				filter: targetSlot.filter,
				transform: "translate3d(0, 0, 0) scale(1)",
			},
		];
		applyLyricGhostAnimationFrame(ghost, frames[0]);
		return { ghost, frames, options: getLyricCarouselTiming() };
	}

	function createLyricGhostFadeOutJob(oldSlot) {
		const ghost = createLyricGhost(oldSlot, oldSlot);
		const y = oldSlot.slot === "prev" ? -24 : oldSlot.slot === "next" ? 24 : -34;
		const frames = [
			{
				opacity: oldSlot.opacity,
				filter: oldSlot.filter,
				transform: "translate3d(0, 0, 0) scale(1)",
			},
			{
				opacity: 0,
				filter: "blur(7px)",
				transform: `translate3d(0, ${y}px, 0) scale(.96)`,
			},
		];
		const options = {
			duration: Math.round(LYRIC_CAROUSEL_DURATION * 0.78),
			easing: "cubic-bezier(.22, .72, .18, 1)",
			fill: "both",
		};
		applyLyricGhostAnimationFrame(ghost, frames[0]);
		return { ghost, frames, options };
	}

	function createLyricGhost(slot, targetSlot, frameSlot = slot, options = {}) {
		const ghost = slot.clone.cloneNode(true);
		const ghostSlot = targetSlot?.slot || slot.slot;
		ghost.removeAttribute("id");
		ghost.classList.add("novaplayer__lyric-ghost", `novaplayer__lyric-ghost--${ghostSlot}`);
		ghost.dataset.role = slot.role || "";
		if (options.trackWordFlow) {
			ghost.dataset.wordFlowSource = "current";
		}
		ghost.setAttribute("aria-hidden", "true");
		ghost.classList.toggle("is-instrumental", Boolean(slot.isInstrumental));
		applyLyricGhostFrame(ghost, frameSlot);
		dom.lyrics.append(ghost);
		state.lyricCarouselGhosts.push(ghost);
		return ghost;
	}

	function slotFrame(slot) {
		return {
			left: `${slot.frame.left.toFixed(2)}px`,
			top: `${slot.frame.top.toFixed(2)}px`,
			width: `${slot.frame.width.toFixed(2)}px`,
			height: `${slot.frame.height.toFixed(2)}px`,
			minHeight: `${slot.frame.height.toFixed(2)}px`,
			opacity: slot.opacity,
			filter: slot.filter,
			color: slot.font.color,
			fontSize: slot.font.fontSize,
			fontWeight: slot.font.fontWeight,
			lineHeight: slot.font.lineHeight,
			textShadow: slot.font.textShadow,
			transformOrigin: "50% 50%",
			transform: "translate3d(0, 0, 0) scale(1)",
		};
	}

	function getLyricSlotFrame(node, rect) {
		return {
			left: Number.isFinite(node.offsetLeft) ? node.offsetLeft : rect.left,
			top: Number.isFinite(node.offsetTop) ? node.offsetTop : rect.top,
			width: node.offsetWidth || rect.width,
			height: node.offsetHeight || rect.height,
		};
	}

	function applyLyricGhostFrame(ghost, slot) {
		const frame = slotFrame(slot);
		for (const [property, value] of Object.entries(frame)) {
			ghost.style[property] = String(value);
		}
	}

	function applyLyricGhostAnimationFrame(ghost, frame) {
		for (const [property, value] of Object.entries(frame)) {
			ghost.style[property] = String(value);
		}
	}

	function forceLyricGhostFrame(jobs) {
		for (const job of jobs) {
			job.ghost.getBoundingClientRect();
		}
	}

	function lyricGhostTransformBetween(fromSlot, toSlot) {
		const fromCenterX = fromSlot.frame.left + fromSlot.frame.width / 2;
		const fromCenterY = fromSlot.frame.top + fromSlot.frame.height / 2;
		const toCenterX = toSlot.frame.left + toSlot.frame.width / 2;
		const toCenterY = toSlot.frame.top + toSlot.frame.height / 2;
		const scale = lyricGhostFontScale(fromSlot, toSlot);
		return `translate3d(${(fromCenterX - toCenterX).toFixed(2)}px, ${(fromCenterY - toCenterY).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
	}

	function lyricGhostFontScale(fromSlot, toSlot) {
		const fromSize = parseCssPixels(fromSlot.font.fontSize, 1);
		const toSize = parseCssPixels(toSlot.font.fontSize, fromSize);
		return clamp(fromSize / Math.max(toSize, 1), 0.24, 4.4);
	}

	function parseCssPixels(value, fallback) {
		const parsed = Number.parseFloat(value);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
	}

	function getLyricCarouselTiming() {
		return {
			duration: LYRIC_CAROUSEL_DURATION,
			easing: "cubic-bezier(.2, .82, .16, 1)",
			fill: "both",
		};
	}

	function trackLyricSlotAnimation(animation, ghost = null) {
		state.lyricSlotAnimations.push(animation);
		const cleanup = () => {
			if (ghost) {
				ghost.remove();
				state.lyricCarouselGhosts = state.lyricCarouselGhosts.filter((node) => node !== ghost);
			}
			state.lyricSlotAnimations = state.lyricSlotAnimations.filter((item) => item !== animation);
			if (!state.lyricSlotAnimations.length) {
				dom.lyrics.classList.remove("is-lyric-carousel-running");
			}
		};
		animation.addEventListener("finish", cleanup, { once: true });
		animation.addEventListener("cancel", cleanup, { once: true });
	}

	function cancelLyricCarouselAnimations() {
		for (const animation of state.lyricSlotAnimations.splice(0)) {
			try {
				animation.cancel();
			} catch (error) {
				// Ignore stale Web Animations handles.
			}
		}
		for (const ghost of state.lyricCarouselGhosts.splice(0)) {
			ghost.remove();
		}
		dom.lyrics.classList.remove("is-lyric-carousel-running");
	}

	function createInstrumentalIndicator() {
		const indicator = document.createElement("div");
		indicator.className = "novaplayer__instrumental";
		indicator.setAttribute("aria-label", "Instrumental break");

		const meter = document.createElement("span");
		meter.className = "novaplayer__instrumental-meter";
		for (let index = 0; index < 3; index += 1) {
			const dot = document.createElement("span");
			dot.className = "novaplayer__instrumental-dot";
			meter.append(dot);
		}

		const label = document.createElement("strong");
		label.textContent = "Instrumental";

		indicator.append(meter, label);
		return indicator;
	}

	function getInstrumentalBreakState(position, activeIndex) {
		if (!state.hasSyncedLyrics || !state.lyrics.length || state.lyricsHidden || isBeforeFirstLyric()) {
			return null;
		}

		const currentIndex = findRenderableLyricIndexAtOrBefore(activeIndex);
		if (currentIndex < 0) {
			return null;
		}

		const current = state.lyrics[currentIndex];
		const wordBreak = findWordInstrumentalBreakAt(current, position);
		if (wordBreak && !hasTimedVocalAtPosition(position, currentIndex, currentIndex + 1)) {
			return {
				key: `word:${currentIndex}:${wordBreak.wordIndex}:${wordBreak.nextWordIndex}:${Math.round(wordBreak.start)}:${Math.round(wordBreak.end)}`,
				previous: current,
				next: current,
				previousText: wordBreak.previousText,
				nextText: wordBreak.nextText,
				start: wordBreak.start,
				end: wordBreak.end,
				previousIndex: currentIndex,
				nextIndex: currentIndex,
			};
		}

		const nextIndex = findNextRenderableLyricIndex(currentIndex + 1);
		const next = nextIndex >= 0 ? state.lyrics[nextIndex] : null;
		const breakInfo = getLineInstrumentalBreak(current, Number(next ? next.start : (state.durationMs || current.end || 0)));

		if (!breakInfo) {
			return null;
		}

		if (position < breakInfo.start || position >= breakInfo.end) {
			return null;
		}
		if (hasTimedVocalAtPosition(position, currentIndex, nextIndex)) {
			return null;
		}

		return {
			key: `${currentIndex}:${nextIndex}:${Math.round(breakInfo.start)}:${Math.round(breakInfo.end)}`,
			previous: current,
			next,
			start: breakInfo.start,
			end: breakInfo.end,
			previousIndex: currentIndex,
			nextIndex,
		};
	}

	function getLineInstrumentalBreak(line, breakEnd) {
		const end = Number(breakEnd);
		const breakStart = getInstrumentalBreakStart(line, end);
		if (
			!line ||
			!Number.isFinite(end) ||
			end <= line.start ||
			end - line.start < INSTRUMENTAL_GAP_MIN_MS ||
			end - breakStart < INSTRUMENTAL_MIN_VISIBLE_MS
		) {
			return null;
		}

		return { start: breakStart, end };
	}

	function getWordInstrumentalBreaks(line) {
		if (!line?.words?.length || line.estimatedWords) {
			return [];
		}

		const orderedWords = line.words
			.map((word, index) => ({
				...word,
				index,
				start: Number(word.start),
				end: Number(word.end),
			}))
			.filter((word) => Number.isFinite(word.start) && Number.isFinite(word.end))
			.sort((a, b) => a.start - b.start);
		const breaks = [];

		for (let index = 0; index < orderedWords.length - 1; index += 1) {
			const current = orderedWords[index];
			const next = orderedWords[index + 1];
			const gap = next.start - current.end;
			if (gap < INSTRUMENTAL_WORD_GAP_MIN_MS) {
				continue;
			}

			const start = Math.min(next.start - 120, current.end + 140);
			const end = next.start;
			if (end - start < INSTRUMENTAL_MIN_VISIBLE_MS) {
				continue;
			}

			breaks.push({
				start,
				end,
				wordIndex: current.index,
				nextWordIndex: next.index,
				previousText: getLyricTextSegment(line.text, 0, current.index + 1),
				nextText: getLyricTextSegment(line.text, next.index, Infinity),
			});
		}

		return breaks;
	}

	function findWordInstrumentalBreakAt(line, position) {
		if (!line?.instrumentalBreaks?.length) {
			return null;
		}

		return line.instrumentalBreaks.find((breakInfo) => position >= breakInfo.start && position < breakInfo.end) || null;
	}

	function getLyricTextSegment(text, fromWordIndex, toWordIndex) {
		let output = "";
		let wordIndex = 0;
		for (const token of tokenizeLyricText(text)) {
			if (token.space) {
				if (output && wordIndex > fromWordIndex && wordIndex < toWordIndex) {
					output += token.text;
				}
				continue;
			}

			if (wordIndex >= fromWordIndex && wordIndex < toWordIndex) {
				output += token.text;
			}
			wordIndex += 1;
		}
		return cleanLyricLine(output);
	}

	function findRenderableLyricIndexAtOrBefore(startIndex) {
		const from = clamp(Number(startIndex) || 0, 0, Math.max(0, state.lyrics.length - 1));
		for (let index = from; index >= 0; index -= 1) {
			if (isPrimaryLyricLine(state.lyrics[index])) {
				return index;
			}
		}
		return -1;
	}

	function findNextRenderableLyricIndex(startIndex) {
		for (let index = Math.max(0, startIndex); index < state.lyrics.length; index += 1) {
			if (isPrimaryLyricLine(state.lyrics[index])) {
				return index;
			}
		}
		return -1;
	}

	function hasTimedVocalAtPosition(position, currentIndex, nextIndex) {
		const lastIndex = nextIndex >= 0 ? nextIndex - 1 : state.lyrics.length - 1;
		for (let index = currentIndex; index <= lastIndex; index += 1) {
			const line = state.lyrics[index];
			if (!line) {
				continue;
			}

			if (
				index !== currentIndex &&
				line.role === "back" &&
				isRenderableLyricText(line.text) &&
				isTimeInRange(position, line.start, line.end)
			) {
				return true;
			}

			for (const backVocal of line.backVocals || []) {
				if (isRenderableLyricText(backVocal.text) && isTimeInRange(position, backVocal.start, backVocal.end)) {
					return true;
				}
			}
		}
		return false;
	}

	function isTimeInRange(position, start, end) {
		const from = Number(start);
		const to = Number(end);
		return Number.isFinite(from) && Number.isFinite(to) && position >= from - 80 && position <= to;
	}

	function isPrimaryLyricLine(line) {
		return Boolean(line && line.role !== "back" && isRenderableLyricText(line.text));
	}

	function getInstrumentalBreakStart(line, breakEnd) {
		const lineStart = Number(line?.start) || 0;
		const concreteWordEnd = getConcreteWordEnd(line);
		const lyricHoldEnd = concreteWordEnd
			? Math.max(concreteWordEnd + 260, lineStart + 1100)
			: lineStart + estimateLyricHoldMs(line?.text);

		return Math.min(breakEnd - INSTRUMENTAL_LEAD_MS, Math.max(lineStart + 1200, lyricHoldEnd));
	}

	function getConcreteWordEnd(line) {
		if (line?.estimatedWords || !Array.isArray(line?.words) || !line.words.length) {
			return 0;
		}

		return line.words.reduce((maxEnd, word) => {
			const end = Number(word?.end);
			return Number.isFinite(end) ? Math.max(maxEnd, end) : maxEnd;
		}, 0);
	}

	function estimateLyricHoldMs(text) {
		const wordCount = tokenizeLyricText(text)
			.filter((token) => !token.space && token.text)
			.length || 1;
		return clamp(1000 + wordCount * 310, 1900, 5200);
	}

	function findDisplayLyricIndex(startIndex) {
		for (let index = startIndex - 1; index >= 0; index -= 1) {
			if (state.lyrics[index]?.text && state.lyrics[index].role !== "back") {
				return index;
			}
		}

		for (let index = startIndex + 1; index < state.lyrics.length; index += 1) {
			if (state.lyrics[index]?.text && state.lyrics[index].role !== "back") {
				return index;
			}
		}

		return startIndex;
	}

	function isBeforeFirstLyric() {
		if (!state.settings.hideIntroLyrics || !state.hasSyncedLyrics || !state.lyrics.length) {
			return false;
		}

		const first = state.lyrics.find((line) => line?.text && line.role !== "back");
		return Boolean(first && state.progressMs < first.start - 120);
	}

	function findNeighborLyric(startIndex, direction) {
		for (let index = startIndex + direction; index >= 0 && index < state.lyrics.length; index += direction) {
			const line = state.lyrics[index];
			if (line?.text && line.role !== "back") {
				return line;
			}
		}
		return null;
	}

	function syncBackVocalTiming(line) {
		const duration = Math.max(700, (line.end || line.start + 3200) - line.start);
		for (const backVocal of line.backVocals || []) {
			const startRatio = clamp(Number(backVocal.startRatio) || 0, 0, 0.94);
			const endRatio = clamp(Number(backVocal.endRatio) || startRatio + 0.22, startRatio + 0.08, 1);
			const phraseStart = line.start + duration * startRatio;
			const phraseEnd = line.start + duration * endRatio;
			const minDuration = Math.min(1900, Math.max(760, duration * 0.24));
			backVocal.start = Math.min(line.end - 80, phraseStart);
			backVocal.end = Math.min(line.end, Math.max(phraseEnd, backVocal.start + minDuration));
		}
	}

	function showTimedBackVocals(position, activeIndex = state.activeLine) {
		if (!state.lyrics.length || state.lyricsHidden || isBeforeFirstLyric() || getBackVocalEffect() === "none") {
			return;
		}

		const baseIndex = clamp(activeIndex, 0, Math.max(0, state.lyrics.length - 1));
		const from = Math.max(0, baseIndex - 1);
		const to = Math.min(state.lyrics.length - 1, baseIndex + 2);
		for (let index = from; index <= to; index += 1) {
			const line = state.lyrics[index];
			if (!line) {
				continue;
			}

			if (line.role === "back" && isRenderableLyricText(line.text) && position >= line.start - 80 && position <= line.end) {
				showBackVocal(line, `line-${index}`);
			}

			for (const backVocal of line.backVocals || []) {
				if (position >= backVocal.start - 80 && position <= backVocal.end) {
					showBackVocal(backVocal, `paren-${index}-${backVocal.index ?? 0}`);
				}
			}
		}
	}

	function showBackVocal(line, suffix = "") {
		const effect = getBackVocalEffect();
		if (effect === "none") {
			return;
		}

		const text = cleanLyricLine(line?.text || "");
		if (!isRenderableLyricText(text)) {
			return;
		}

		const key = `${line.start}:${line.end}:${suffix}:${text}`;
		if (state.backVocalKeys.has(key)) {
			return;
		}
		state.backVocalKeys.add(key);

		const seedBase = `${state.trackUri}:${key}`;
		let x = lerp(10, 90, seededRandom(`${seedBase}:x`));
		let y = lerp(12, 78, seededRandom(`${seedBase}:y`));
		if (x > 30 && x < 70 && y > 34 && y < 66) {
			y = seededRandom(`${seedBase}:side`) > 0.5
				? lerp(68, 84, seededRandom(`${seedBase}:lower`))
				: lerp(12, 28, seededRandom(`${seedBase}:upper`));
		}

		const node = document.createElement("div");
		node.className = "novaplayer__back-vocal";
		node.dataset.effect = effect;
		node.dataset.text = text;
		node.textContent = text;
		node.style.setProperty("--novaplayer-back-x", `${x.toFixed(2)}vw`);
		node.style.setProperty("--novaplayer-back-y", `${y.toFixed(2)}vh`);
		node.style.setProperty("--novaplayer-back-drift-x", `${lerp(-34, 34, seededRandom(`${seedBase}:dx`)).toFixed(2)}px`);
		node.style.setProperty("--novaplayer-back-drift-y", `${lerp(-38, -18, seededRandom(`${seedBase}:dy`)).toFixed(2)}px`);
		node.style.setProperty("--novaplayer-back-tilt-x", `${lerp(-8, 8, seededRandom(`${seedBase}:tx`)).toFixed(2)}deg`);
		node.style.setProperty("--novaplayer-back-tilt-y", `${lerp(-18, 18, seededRandom(`${seedBase}:ty`)).toFixed(2)}deg`);
		node.style.setProperty("--novaplayer-back-tilt-z", `${lerp(-8, 8, seededRandom(`${seedBase}:tz`)).toFixed(2)}deg`);
		node.style.setProperty("--novaplayer-back-spin-z", `${lerp(-24, 24, seededRandom(`${seedBase}:spin`)).toFixed(2)}deg`);
		node.style.setProperty("--novaplayer-back-sweep-x", `${lerp(-54, 54, seededRandom(`${seedBase}:sx`)).toFixed(2)}px`);
		node.style.setProperty("--novaplayer-back-sweep-y", `${lerp(-30, 30, seededRandom(`${seedBase}:sy`)).toFixed(2)}px`);
		dom.backs.append(node);
		node.addEventListener("animationend", () => node.remove(), { once: true });
	}

	function clearBackVocals() {
		state.backVocalKeys = new Set();
		dom.backs.replaceChildren();
	}

	function renderCurrentLyric(line) {
		dom.lyricCurrent.replaceChildren();
		state.renderedActiveWord = -1;
		state.activeWordNode = null;

		if (!state.hasWordHighlight || !line?.words?.length) {
			dom.lyricCurrent.textContent = line?.text || "";
			return;
		}

		const tokens = tokenizeLyricText(line.text);
		let wordIndex = 0;

		for (const token of tokens) {
			if (token.space) {
				dom.lyricCurrent.append(document.createTextNode(token.text));
				continue;
			}

			const span = document.createElement("span");
			span.className = "novaplayer__lyric-word";
			span.textContent = token.text;
			span.dataset.wordIndex = String(wordIndex);
			span.dataset.wordText = token.text;
			const timing = line.words[wordIndex];
			if (timing) {
				span.dataset.wordStart = String(Math.round(timing.start));
				span.dataset.wordEnd = String(Math.round(timing.end));
			}
			span.style.setProperty("--novaplayer-word-progress", "0%");
			dom.lyricCurrent.append(span);
			wordIndex += 1;
		}
	}

	function updateLyricWordClasses(activeWord) {
		if (!state.hasWordHighlight) {
			return;
		}

		if (activeWord === state.renderedActiveWord) {
			return;
		}

		const previousWord = state.activeWordNode;
		const previousIndex = state.renderedActiveWord;
		const jumped = previousIndex >= 0 && Math.abs(activeWord - previousIndex) > 1;
		const needsFullSync = previousIndex < 0 || activeWord < previousIndex || jumped;

		if (needsFullSync) {
			syncLyricWordClasses(activeWord);
			return;
		}

		if (previousWord) {
			previousWord.classList.remove("is-current");
			previousWord.classList.toggle("is-sung", previousIndex >= 0 && previousIndex < activeWord);
		}

		const nextWord = activeWord >= 0 ? dom.lyricCurrent.querySelector(`[data-word-index="${activeWord}"]`) : null;
		if (nextWord) {
			nextWord.classList.remove("is-sung");
			nextWord.classList.add("is-current");
		}

		state.renderedActiveWord = activeWord;
		state.activeWordNode = nextWord;
		updateLyricWordProgress(activeWord);
	}

	function syncLyricWordClasses(activeWord) {
		let activeNode = null;
		for (const word of dom.lyricCurrent.children) {
			if (!word.classList?.contains("novaplayer__lyric-word")) {
				continue;
			}

			const index = Number(word.dataset.wordIndex);
			const isCurrent = index === activeWord;
			word.classList.toggle("is-sung", index < activeWord);
			word.classList.toggle("is-current", isCurrent);
			if (isCurrent) {
				activeNode = word;
			}
		}

		state.renderedActiveWord = activeWord;
		state.activeWordNode = activeNode;
		updateLyricWordProgress(activeWord);
	}

	function updateLyricWordProgress(activeWord = state.activeWord) {
		if (!state.hasWordHighlight || !dom.lyricCurrent.children.length) {
			return;
		}

		for (const word of dom.lyricCurrent.children) {
			if (!word.classList?.contains("novaplayer__lyric-word")) {
				continue;
			}

			const index = Number(word.dataset.wordIndex);
			let progress = index < activeWord ? 1 : 0;
			if (index === activeWord) {
				const start = Number(word.dataset.wordStart);
				const end = Number(word.dataset.wordEnd);
				progress = Number.isFinite(start) && Number.isFinite(end) && end > start
					? clamp((state.progressMs - start + 30) / (end - start), 0, 1)
					: 1;
			}
			word.style.setProperty("--novaplayer-word-progress", `${(-4 + progress * 108).toFixed(2)}%`);
		}
		syncLyricWordFlowGhostsFromCurrent();
	}

	function syncLyricWordFlowGhostsFromCurrent() {
		if (!state.lyricCarouselGhosts.length || !dom.lyricCurrent.children.length) {
			return;
		}

		const currentWords = new Map();
		for (const word of dom.lyricCurrent.children) {
			if (word.classList?.contains("novaplayer__lyric-word")) {
				currentWords.set(word.dataset.wordIndex, word);
			}
		}
		if (!currentWords.size) {
			return;
		}

		for (const ghost of state.lyricCarouselGhosts) {
			if (!ghost.isConnected || ghost.dataset.wordFlowSource !== "current") {
				continue;
			}
			for (const ghostWord of ghost.querySelectorAll(".novaplayer__lyric-word")) {
				const sourceWord = currentWords.get(ghostWord.dataset.wordIndex);
				if (!sourceWord) {
					continue;
				}
				ghostWord.classList.toggle("is-sung", sourceWord.classList.contains("is-sung"));
				ghostWord.classList.toggle("is-current", sourceWord.classList.contains("is-current"));
				ghostWord.style.setProperty(
					"--novaplayer-word-progress",
					sourceWord.style.getPropertyValue("--novaplayer-word-progress") || "0%"
				);
			}
		}
	}

	function createLyricLine(rawLine) {
		const rawText = cleanLyricLine(rawLine.words || rawLine.text || rawLine.line || rawLine.lyrics || "");
		const tagged = extractPerformerTag(rawText);
		const parenthetical = extractParentheticalBackVocals(tagged.text);
		const roleInfo = getLyricRole(rawLine, tagged.performer);
		const start = normalizeLyricTime(rawLine.startTimeMs ?? rawLine.start ?? rawLine.time ?? 0, rawLine.startTimeMs != null);
		const words = extractTimedWords(rawLine, parenthetical.text, start);
		const isBackOnly = !isRenderableLyricText(parenthetical.text) && parenthetical.backVocals.length > 0;

		return {
			start,
			end: start + 3200,
			text: parenthetical.text,
			words,
			backVocals: parenthetical.backVocals.map((backVocal, index) => ({
				start,
				end: start + 3200,
				text: backVocal.text,
				index,
				startRatio: backVocal.startRatio,
				endRatio: backVocal.endRatio,
			})),
			role: isBackOnly ? "back" : roleInfo.role,
			roleLabel: isBackOnly ? "BACK VOCAL" : roleInfo.label,
		};
	}

	function extractTimedWords(rawLine, text, lineStart) {
		const candidates = [rawLine.syllables, rawLine.wordTimings, rawLine.tokens, Array.isArray(rawLine.words) ? rawLine.words : null]
			.filter(Array.isArray)
			.flat();

		if (!candidates.length) {
			return [];
		}

		const timed = candidates
			.map((word) => {
				const wordText = cleanLyricLine(word.text || word.word || word.syllable || word.value || "");
				if (!wordText) {
					return null;
				}

				const start = normalizeLyricTime(word.startTimeMs ?? word.start ?? word.time ?? lineStart, word.startTimeMs != null);
				const end = normalizeLyricTime(word.endTimeMs ?? word.end ?? word.endTime ?? start + 260, word.endTimeMs != null);
				return {
					text: wordText,
					start,
					end: Math.max(start + 80, end),
				};
			})
			.filter(Boolean)
			.filter((word) => text.includes(word.text) || word.text.length > 1);

		const textWords = tokenizeLyricText(text).filter((token) => !token.space);
		if (timed.length > textWords.length && textWords.length) {
			return textWords.map((word, index) => {
				const startIndex = Math.floor((index / textWords.length) * timed.length);
				const endIndex = Math.max(startIndex, Math.floor(((index + 1) / textWords.length) * timed.length) - 1);
				return {
					text: word.text,
					start: timed[startIndex]?.start ?? lineStart,
					end: timed[Math.min(endIndex, timed.length - 1)]?.end ?? lineStart + 260,
				};
			});
		}

		return timed;
	}

	function estimateLyricWords(line) {
		const words = tokenizeLyricText(line.text).filter((token) => !token.space);
		if (!words.length) {
			return [];
		}

		const start = line.start;
		const end = getLyricWordTimingEnd(line);
		const duration = Math.max(700, end - start);
		const totalWeight = words.reduce((sum, word) => sum + Math.max(0.85, Math.sqrt(word.text.length)), 0);
		let cursor = start;

		return words.map((word, index) => {
			const weight = Math.max(0.85, Math.sqrt(word.text.length));
			const wordDuration = index === words.length - 1 ? Math.max(90, end - cursor) : Math.max(90, duration * (weight / totalWeight));
			const result = {
				text: word.text,
				start: cursor,
				end: Math.min(end, cursor + wordDuration),
			};
			cursor += wordDuration;
			return result;
		});
	}

	function getLyricWordTimingEnd(line) {
		const start = Number(line?.start) || 0;
		const fallbackEnd = Number(line?.end) || start + 2600;
		const instrumentalStart = Number(line?.instrumentalStart) || 0;
		if (instrumentalStart > start + 700 && instrumentalStart < fallbackEnd) {
			return instrumentalStart;
		}
		return fallbackEnd;
	}

	function getActiveWordIndex(line, progressMs) {
		if (!line?.words?.length) {
			return -1;
		}

		if (progressMs >= getLyricWordTimingEnd(line) + 80) {
			return line.words.length;
		}

		for (let index = 0; index < line.words.length; index += 1) {
			const word = line.words[index];
			if (progressMs >= word.start - 40 && progressMs < word.end + 80) {
				return index;
			}
			if (progressMs < word.start) {
				const previous = index > 0 ? line.words[index - 1] : null;
				if (previous && progressMs >= previous.end + 80) {
					return index - 0.5;
				}
				return Math.max(0, index - 1);
			}
		}

		return line.words.length - 1;
	}

	function tokenizeLyricText(text) {
		return String(text || "")
			.split(/(\s+)/)
			.filter((part) => part.length)
			.map((part) => ({
				text: part,
				space: /^\s+$/.test(part),
			}));
	}

	function normalizeLyricTime(value, assumeMs = false) {
		const number = Number(value);
		if (!Number.isFinite(number)) {
			return 0;
		}

		return assumeMs || number > 600 ? number : number * 1000;
	}

	function extractPerformerTag(text) {
		const match = String(text || "").match(/^\s*[\[(]([^)\]]{2,36})[\])]\s*(.+)$/);
		if (!match) {
			return { text, performer: "" };
		}

		return {
			performer: match[1].trim(),
			text: cleanLyricLine(match[2]),
		};
	}

	function extractParentheticalBackVocals(text) {
		const backVocals = [];
		const source = String(text || "");
		const sourceLength = Math.max(1, source.length);
		const main = source.replace(/\(([^()]{1,180})\)/g, (full, value, offset) => {
			const phrase = cleanLyricLine(value);
			if (isRenderableLyricText(phrase)) {
				backVocals.push({
					text: phrase,
					startRatio: clamp(offset / sourceLength, 0, 1),
					endRatio: clamp((offset + full.length) / sourceLength, 0, 1),
				});
			}
			return " ";
		});

		return {
			text: cleanLyricLine(main.replace(/\s+([,.;:!?])/g, "$1")),
			backVocals,
		};
	}

	function getLyricRole(rawLine, taggedPerformer) {
		const performer =
			taggedPerformer ||
			rawLine.performer ||
			rawLine.singer ||
			rawLine.speaker ||
			rawLine.artist ||
			rawLine.vocalist ||
			"";
		const roleText = String(rawLine.role || rawLine.vocalType || rawLine.type || "").toLowerCase();
		const isBack =
			Boolean(rawLine.background || rawLine.isBackground || rawLine.backing || rawLine.isBacking) ||
			/(back|background|harmony|adlib|choir)/i.test(roleText) ||
			/(back|background|adlib)/i.test(performer);
		const isResponse = Boolean(rawLine.oppositeAligned || rawLine.response || rawLine.duet) || /(duet|response|other)/i.test(roleText);

		if (isBack) {
			return { role: "back", label: performer && !/back|background/i.test(performer) ? `BACK - ${performer}` : "BACK VOCAL" };
		}

		if (isResponse) {
			return { role: "response", label: performer ? `RESPONSE - ${performer}` : "RESPONSE" };
		}

		if (performer) {
			return { role: "voice", label: performer };
		}

		return { role: "", label: "" };
	}

	function renderQueue(playerData = Spicetify.Player.data) {
		const itemLimit = getQueueVisibleLimit();
		const candidates = [
			...(Array.isArray(Spicetify.Queue?.nextTracks) ? Spicetify.Queue.nextTracks : []),
			...(Array.isArray(playerData?.nextItems) ? playerData.nextItems : []),
		];

		const tracks = [];
		const seen = new Set();

		for (const item of candidates) {
			const track = normalizeTrack(extractQueueTrack(item));
			if (!track.uri || seen.has(track.uri) || track.uri === state.trackUri) {
				continue;
			}
			seen.add(track.uri);
			tracks.push(track);
			if (tracks.length >= itemLimit) {
				break;
			}
		}

		dom.queueCount.textContent = String(tracks.length);
		state.queueLength = tracks.length;
		state.queueOffset = clamp(state.queueOffset, 0, getMaxQueueOffset());
		state.queueWheelRemainder = 0;
		dom.queueList.replaceChildren(...tracks.map((track, index) => createQueueItem(track, index)));
		updateQueueCarouselLayout();

		if (!tracks.length) {
			const empty = document.createElement("div");
			empty.className = "novaplayer__queue-empty";
			empty.textContent = "Queue is empty";
			dom.queueList.append(empty);
		}
	}

	function createQueueItem(track, index) {
		const item = document.createElement("button");
		item.type = "button";
		item.className = "novaplayer__queue-item";
		item.dataset.queueIndex = String(index);
		item.title = `${track.title}${track.artist ? ` - ${track.artist}` : ""}`;
		item.addEventListener("click", () => {
			if (track.uri) {
				Spicetify.Player.playUri(track.uri).catch(() => Spicetify.showNotification?.("Could not play this queue item", true));
			}
		});

		const cover = document.createElement("span");
		cover.className = "novaplayer__queue-cover";
		cover.style.backgroundImage = cssBackground(track.cover);

		const copy = document.createElement("span");
		copy.className = "novaplayer__queue-copy";

		const title = document.createElement("span");
		title.className = "novaplayer__queue-title";
		title.textContent = track.title;

		const artist = document.createElement("span");
		artist.className = "novaplayer__queue-artist";
		artist.textContent = track.artist || track.album || "Spotify";

		const indexNode = document.createElement("span");
		indexNode.className = "novaplayer__queue-index";
		indexNode.textContent = String(index + 1).padStart(2, "0");

		copy.append(title, artist);
		item.append(cover, copy, indexNode);
		return item;
	}

	function setQueueOffset(nextOffset) {
		const next = clamp(nextOffset, 0, getMaxQueueOffset());
		if (next === state.queueOffset) {
			return;
		}

		state.queueOffset = next;
		updateQueueCarouselLayout();
	}

	function updateQueueCarouselLayout() {
		const items = [...dom.queueList.querySelectorAll(".novaplayer__queue-item")];
		if (!items.length) {
			return;
		}

		for (const item of items) {
			const index = Number(item.dataset.queueIndex || 0);
			const relative = index - state.queueOffset;
			const visible = relative >= 0 && relative < getQueueVisibleLimit();
			const isFront = relative === 0;
			const opacity = visible ? (isFront ? 1 : Math.max(0.52, 0.9 - relative * 0.075)) : 0;

			item.classList.toggle("is-next", isFront);
			item.classList.toggle("is-past", relative < 0);
			item.classList.toggle("is-hidden", !visible);
			item.style.setProperty("--novaplayer-depth-x", "0px");
			item.style.setProperty("--novaplayer-depth-y", "0px");
			item.style.setProperty("--novaplayer-depth-z", "0px");
			item.style.setProperty("--novaplayer-depth-rotate", "0deg");
			item.style.setProperty("--novaplayer-depth-scale", "1");
			item.style.setProperty("--novaplayer-depth-opacity", opacity.toFixed(3));
			item.style.setProperty("--novaplayer-depth-blur", "0px");
			item.style.zIndex = String(100 - Math.max(0, relative));
		}
	}

	function getQueueVisibleLimit() {
		const def = SETTING_DEFS.queueVisibleCount;
		return Math.round(clamp(Number(state.settings.queueVisibleCount) || 16, def.min, def.max));
	}

	function getMaxQueueOffset() {
		return Math.max(0, state.queueLength - getQueueVisibleLimit());
	}

	function updateProgress() {
		const duration = state.durationMs || getDurationSafe();
		const progress = Math.max(0, Math.min(state.progressMs || getProgressSafe(), duration || 0));
		const percent = duration ? clamp((progress / duration) * 100, 0, 100) : 0;

		dom.progress.dataset.progressMs = String(Math.round(progress));
		dom.elapsed.textContent = formatTime(progress);
		dom.duration.textContent = formatTime(duration);
		dom.progressFill.style.width = `${percent}%`;
		dom.progressThumb.style.left = `${percent}%`;
		state.renderProgressDirty = false;
	}

	function seekFromProgressClick(event) {
		const duration = state.durationMs || getDurationSafe();
		if (!duration) {
			return;
		}

		const rect = dom.progress.getBoundingClientRect();
		const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
		const position = ratio * duration;
		Spicetify.Player.seek(position);
		state.progressMs = position;
		state.lastProgressSync = performance.now();
		state.renderProgressDirty = true;
		updateProgress();
		updateActiveLyric();
	}

	function handleVolumeInput(event) {
		const volume = clamp(Number(event.currentTarget.value), 0, 1);
		setPlayerVolume(volume);
		updateVolumeUi(volume);
	}

	function handleHeartClick() {
		const nextHeart = !getHeartSafe();
		setHeartButtonState(nextHeart);

		try {
			let result;
			if (typeof Spicetify.Player.setHeart === "function") {
				result = Spicetify.Player.setHeart(nextHeart);
			} else if (typeof Spicetify.Player.toggleHeart === "function") {
				result = Spicetify.Player.toggleHeart();
			} else {
				throw new Error("Spicetify heart controls are unavailable");
			}

			Promise.resolve(result).catch(() => {
				updateControlState();
			});
		} catch (error) {
			updateControlState();
			return;
		}

		setTimeout(updateControlState, 150);
		setTimeout(updateControlState, 700);
	}

	function updateControlState() {
		state.isPaused = !Spicetify.Player.isPlaying?.();
		state.shuffle = getShuffleSafe();
		state.repeat = getRepeatSafe();
		state.heart = getHeartSafe();
		updateVolumeUi(getVolumeSafe());

		buttons.play.innerHTML = svgIcon(state.isPaused ? "play" : "pause", 24);
		buttons.repeat.innerHTML = svgIcon(state.repeat === 2 ? "repeat-once" : "repeat", 18);

		buttons.shuffle.classList.toggle("is-active", state.shuffle);
		buttons.repeat.classList.toggle("is-active", state.repeat > 0);
		setHeartButtonState(state.heart);
		buttons.play.classList.toggle("is-playing", !state.isPaused);
		root.classList.toggle("is-playing", !state.isPaused);
	}

	function setHeartButtonState(isActive) {
		state.heart = Boolean(isActive);
		buttons.heart.innerHTML = svgIcon(state.heart ? "heart-active" : "heart", 18);
		buttons.heart.classList.toggle("is-active", state.heart);
		buttons.heart.setAttribute("aria-label", state.heart ? "Remove saved track" : "Save track");
		buttons.heart.title = state.heart ? "Remove saved track" : "Save track";
	}

	function updateVolumeUi(volume) {
		const nextVolume = clamp(Number(volume), 0, 1);
		state.volume = nextVolume;
		if (dom.volumeSlider && document.activeElement !== dom.volumeSlider) {
			dom.volumeSlider.value = nextVolume.toFixed(2);
		}
		setStyleProperty(dom.volumeSlider, "--novaplayer-volume", `${(nextVolume * 100).toFixed(1)}%`);
		if (dom.volumeIcon) {
			const icon = nextVolume <= 0.01 ? "volume-off" : nextVolume < 0.46 ? "volume-one-wave" : "volume-two-wave";
			dom.volumeIcon.innerHTML = svgIcon(icon, 16);
		}
	}

	function updateButtonActiveState() {
		topbarButton.element?.classList.toggle("novaplayer-launcher-active", state.open);
		playbarButton.element?.classList.toggle("novaplayer-launcher-active", state.open);
	}

	function triggerTrackTransition() {
		restartClass(root, "is-track-changing");
		clearTimeout(state.trackTransitionTimer);
		state.trackTransitionTimer = setTimeout(() => {
			root.classList.remove("is-track-changing");
			state.trackTransitionTimer = 0;
		}, 900);
		visualizer.startTrackSwitch?.(state.trackUri);
	}

	function prepareTrackOutro() {
		if (!state.open || state.isPaused || !state.trackUri || !state.durationMs) {
			return;
		}

		const remaining = state.durationMs - state.progressMs;
		if (remaining > 120 && remaining <= 9400) {
			visualizer.prepareOutro?.(state.trackUri);
		} else if (remaining > 12800) {
			visualizer.cancelOutro?.(state.trackUri);
		}
	}

	function restartClass(element, className) {
		element.classList.remove(className);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				element.classList.add(className);
			});
		});
	}

	function normalizeTrack(raw) {
		const track = raw || {};
		const metadata = track.metadata || track.contextTrack?.metadata || {};
		const artists = Array.isArray(track.artists)
			? track.artists
					.map((artist) => artist?.name)
					.filter(Boolean)
					.join(", ")
			: "";

		return {
			uri: track.uri || metadata.entity_uri || metadata.uri || "",
			title: track.name || track.title || metadata.title || metadata.name || "Unknown track",
			artist: artists || metadata.artist_name || metadata["artist_name:1"] || metadata.album_artist_name || "",
			album: track.album?.name || metadata.album_title || "",
			cover: pickCover(track, metadata),
		};
	}

	function extractQueueTrack(item) {
		return item?.track || item?.item || item?.contextTrack || item || {};
	}

	function pickCover(track, metadata = track?.metadata || {}) {
		const images = [
			metadata.image_xlarge_url,
			metadata.image_large_url,
			metadata.image_url,
			metadata.image_small_url,
			track?.album?.images?.[0]?.url,
			track?.images?.[0]?.url,
			track?.coverArt?.sources?.[0]?.url,
		].filter(Boolean);

		return normalizeCoverUrl(images[0] || fallbackCover);
	}

	function normalizeCoverUrl(url) {
		const value = String(url || "").trim();
		const imageMatch = value.match(/^spotify:image:(.+)$/);

		if (imageMatch?.[1]) {
			return `https://i.scdn.co/image/${imageMatch[1]}`;
		}

		return value || fallbackCover;
	}

	function getDurationSafe(playerData = Spicetify.Player.data) {
		return (
			Number(playerData?.duration) ||
			Number(playerData?.item?.duration?.milliseconds) ||
			Number(playerData?.item?.metadata?.duration) ||
			Number(Spicetify.Player.getDuration?.()) ||
			0
		);
	}

	function getProgressSafe() {
		try {
			return Number(Spicetify.Player.getProgress?.()) || 0;
		} catch (error) {
			return 0;
		}
	}

	function getHeartSafe() {
		try {
			return Boolean(Spicetify.Player.getHeart?.());
		} catch (error) {
			return false;
		}
	}

	function getShuffleSafe() {
		try {
			return Boolean(Spicetify.Player.getShuffle?.());
		} catch (error) {
			return false;
		}
	}

	function getRepeatSafe() {
		try {
			return Number(Spicetify.Player.getRepeat?.()) || 0;
		} catch (error) {
			return 0;
		}
	}

	function getVolumeSafe() {
		try {
			const value = Spicetify.Player.getVolume?.();
			const normalized = normalizeVolumeValue(value);
			if (Number.isFinite(normalized)) {
				return normalized;
			}
		} catch (error) {
			// Fall back to the last slider value when Spotify does not expose volume.
		}

		return state.volume;
	}

	function setPlayerVolume(volume) {
		const nextVolume = clamp(Number(volume), 0, 1);
		try {
			if (typeof Spicetify.Player.setVolume === "function") {
				const currentRaw = Number(Spicetify.Player.getVolume?.());
				Spicetify.Player.setVolume(Number.isFinite(currentRaw) && currentRaw > 1 ? Math.round(nextVolume * 100) : nextVolume);
				return;
			}
		} catch (error) {
			// Fall through to step-based volume control.
		}

		const current = getVolumeSafe();
		const method = nextVolume > current ? Spicetify.Player.increaseVolume : Spicetify.Player.decreaseVolume;
		if (typeof method !== "function") {
			return;
		}

		const steps = Math.min(10, Math.ceil(Math.abs(nextVolume - current) / 0.1));
		for (let index = 0; index < steps; index += 1) {
			method.call(Spicetify.Player);
		}
	}

	function normalizeVolumeValue(value) {
		const numeric = Number(value);
		if (!Number.isFinite(numeric)) {
			return Number.NaN;
		}

		return clamp(numeric > 1 ? numeric / 100 : numeric, 0, 1);
	}

	function formatTime(ms) {
		if (Spicetify.Player.formatTime) {
			return Spicetify.Player.formatTime(ms || 0);
		}

		const total = Math.max(0, Math.floor((ms || 0) / 1000));
		const minutes = Math.floor(total / 60);
		const seconds = String(total % 60).padStart(2, "0");
		return `${minutes}:${seconds}`;
	}

	function cleanLyricLine(value) {
		return String(value || "")
			.replace(/\s+/g, " ")
			.trim();
	}

	function isRenderableLyricText(value) {
		const text = cleanLyricLine(value);
		const withoutMusicNotes = text
			.replace(/[\u2669\u266A\u266B\u266C\u266D\u266E\u266F\u{1F3B5}\u{1F3B6}]/gu, "")
			.replace(/[()[\]{}.,!?;:'"`~_+=|\\/<>-]/g, "")
			.trim();

		return Boolean(withoutMusicNotes) && !/^no lyrics(?: in spotify)?$/i.test(withoutMusicNotes);
	}

	function cssBackground(url) {
		return `url("${normalizeCoverUrl(url || fallbackCover).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
	}

	function normalizeStringSetting(key, value) {
		if (key === "backVocalEffect") {
			const nextValue = String(value || "");
			return BACK_VOCAL_EFFECTS.some((option) => option.value === nextValue) ? nextValue : DEFAULT_SETTINGS.backVocalEffect;
		}

		return String(value ?? DEFAULT_SETTINGS[key]);
	}

	function getBackVocalEffect() {
		return normalizeStringSetting("backVocalEffect", state.settings.backVocalEffect);
	}

	function loadSettings() {
		let parsed = {};
		try {
			parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}") || {};
		} catch (error) {
			parsed = {};
		}
		const settings = { ...DEFAULT_SETTINGS };
		for (const [key, value] of Object.entries(parsed)) {
			if (!(key in DEFAULT_SETTINGS)) {
				continue;
			}
			if (typeof DEFAULT_SETTINGS[key] === "boolean") {
				settings[key] = Boolean(value);
				continue;
			}
			if (typeof DEFAULT_SETTINGS[key] === "string") {
				settings[key] = normalizeStringSetting(key, value);
				continue;
			}
			const def = SETTING_DEFS[key];
			const numeric = Number(value);
			if (Number.isFinite(numeric)) {
				settings[key] = clamp(numeric, def?.min ?? 0, def?.max ?? 1);
			}
		}
		return settings;
	}

	function settingsSlider(key) {
		const def = SETTING_DEFS[key];
		const value = state.settings[key];
		return `
			<label class="novaplayer__setting-row">
				<span>
					<strong>${def.label}</strong>
					<small data-setting-output="${key}">${formatSettingValue(key, value)}</small>
				</span>
				<input type="range" min="${def.min}" max="${def.max}" step="${def.step}" value="${value}" data-setting="${key}">
			</label>
		`;
	}

	function settingsToggle(key, label, description) {
		return `
			<label class="novaplayer__setting-row novaplayer__setting-row--toggle">
				<span>
					<strong>${label}</strong>
					<small>${description}</small>
				</span>
				<input type="checkbox" data-setting="${key}" ${state.settings[key] ? "checked" : ""}>
			</label>
		`;
	}

	function settingsSelect(key, label, description, options) {
		const value = state.settings[key];
		const items = options
			.map((option) => `<option value="${option.value}" ${option.value === value ? "selected" : ""}>${option.label}</option>`)
			.join("");
		return `
			<label class="novaplayer__setting-row">
				<span>
					<strong>${label}</strong>
					<small>${description}</small>
				</span>
				<select data-setting="${key}">${items}</select>
			</label>
		`;
	}

	function formatSettingValue(key, value) {
		const def = SETTING_DEFS[key];
		return def?.format ? def.format(Number(value)) : String(value ?? "");
	}

	function svgIcon(name, size = 18) {
		const raw = Spicetify.SVGIcons?.[name] || Spicetify.SVGIcons?.visualizer || "";
		return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 16 16" fill="currentColor">${raw}</svg>`;
	}

	function seededRandom(input) {
		let hash = 2166136261;
		for (let index = 0; index < input.length; index += 1) {
			hash ^= input.charCodeAt(index);
			hash = Math.imul(hash, 16777619);
		}
		return ((hash >>> 0) % 10000) / 10000;
	}

	function lerp(from, to, amount) {
		return from + (to - from) * amount;
	}

	function clamp(value, min, max) {
		return Math.min(max, Math.max(min, value));
	}

	function easeInOutCubic(value) {
		const t = clamp(value, 0, 1);
		return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
	}

	function parseCssColor(value) {
		const text = String(value || "").trim();
		const rgbMatch = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
		if (rgbMatch) {
			return {
				r: Number(rgbMatch[1]) / 255,
				g: Number(rgbMatch[2]) / 255,
				b: Number(rgbMatch[3]) / 255,
			};
		}

		const hexMatch = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
		if (!hexMatch) {
			return null;
		}

		const hex = hexMatch[1].length === 3
			? hexMatch[1].split("").map((char) => char + char).join("")
			: hexMatch[1];
		return {
			r: parseInt(hex.slice(0, 2), 16) / 255,
			g: parseInt(hex.slice(2, 4), 16) / 255,
			b: parseInt(hex.slice(4, 6), 16) / 255,
		};
	}

	function normalizePaletteRaw(palette) {
		return {
			hot: palette.accentRaw || parseCssColor(palette.accent),
			cyan: palette.secondaryRaw || parseCssColor(palette.secondary),
			lime: palette.highlightRaw || parseCssColor(palette.highlight),
			bg1: parseCssColor(palette.bg1),
			bg2: parseCssColor(palette.bg2),
			bg3: parseCssColor(palette.bg3),
		};
	}

	function readCurrentPaletteRaw() {
		const current = {
			hot: parseCssColor(cssVar("--novaplayer-hot")),
			cyan: parseCssColor(cssVar("--novaplayer-cyan")),
			lime: parseCssColor(cssVar("--novaplayer-lime")),
			bg1: parseCssColor(cssVar("--novaplayer-bg-1")),
			bg2: parseCssColor(cssVar("--novaplayer-bg-2")),
			bg3: parseCssColor(cssVar("--novaplayer-bg-3")),
		};
		return Object.values(current).every(Boolean) ? current : null;
	}

	function mixRgb(from, to, value) {
		const t = clamp(value, 0, 1);
		return {
			r: lerp(from.r, to.r, t),
			g: lerp(from.g, to.g, t),
			b: lerp(from.b, to.b, t),
		};
	}

	function mixPaletteRaw(from, to, value) {
		return {
			hot: mixRgb(from.hot, to.hot, value),
			cyan: mixRgb(from.cyan, to.cyan, value),
			lime: mixRgb(from.lime, to.lime, value),
			bg1: mixRgb(from.bg1, to.bg1, value),
			bg2: mixRgb(from.bg2, to.bg2, value),
			bg3: mixRgb(from.bg3, to.bg3, value),
		};
	}

	function applyPaletteRaw(palette) {
		const display = getDisplayPaletteRaw(palette);
		root.style.setProperty("--novaplayer-hot", rgbCss(display.hot));
		root.style.setProperty("--novaplayer-hot-rgb", rgbVar(display.hot));
		root.style.setProperty("--novaplayer-cyan", rgbCss(display.cyan));
		root.style.setProperty("--novaplayer-cyan-rgb", rgbVar(display.cyan));
		root.style.setProperty("--novaplayer-lime", rgbCss(display.lime));
		root.style.setProperty("--novaplayer-lime-rgb", rgbVar(display.lime));
		root.style.setProperty("--novaplayer-bg-1", rgbCss(display.bg1));
		root.style.setProperty("--novaplayer-bg-1-rgb", rgbVar(display.bg1));
		root.style.setProperty("--novaplayer-bg-2", rgbCss(display.bg2));
		root.style.setProperty("--novaplayer-bg-2-rgb", rgbVar(display.bg2));
		root.style.setProperty("--novaplayer-bg-3", rgbCss(display.bg3));
		root.style.setProperty("--novaplayer-bg-3-rgb", rgbVar(display.bg3));
	}

	function getDisplayPaletteRaw(palette) {
		if (!state.settings.invertAccents) {
			return palette;
		}

		return {
			...palette,
			hot: invertRgb(palette.hot),
			cyan: invertRgb(palette.cyan),
			lime: invertRgb(palette.lime),
		};
	}

	function invertRgb(rgb) {
		return {
			r: 1 - (Number(rgb?.r) || 0),
			g: 1 - (Number(rgb?.g) || 0),
			b: 1 - (Number(rgb?.b) || 0),
		};
	}

	function refreshAccentPalette() {
		const palette = state.paletteRaw || readCurrentPaletteRaw();
		if (palette) {
			applyPaletteRaw(palette);
		}
	}

	function updateCosmosTexture(palette) {
		if (!dom.cosmos || !palette) {
			return;
		}

		const signature = [
			state.trackUri || "track",
			rgbVar(palette.hot),
			rgbVar(palette.cyan),
			rgbVar(palette.lime),
			rgbVar(palette.bg1),
			rgbVar(palette.bg2),
			rgbVar(palette.bg3),
		].join("|");
		if (signature === state.cosmosSignature) {
			return;
		}

		const texture = createCosmosTexture(palette, signature);
		if (!texture) {
			return;
		}

		const duration = state.cosmosReady ? PALETTE_TRANSITION_DURATION : 0;
		state.cosmosSignature = signature;

		cosmosRenderer.setTexture?.(texture, duration);
		cosmosRenderer.render?.(performance.now());
		state.cosmosReady = true;
	}

	function cancelPendingPaletteWork() {
		state.paletteApplyToken += 1;
		clearScheduledPalette();
		if (state.paletteFrame) {
			cancelAnimationFrame(state.paletteFrame);
			state.paletteFrame = 0;
		}
	}

	function createCosmosTexture(palette, seedKey) {
		const canvas = document.createElement("canvas");
		canvas.width = COSMOS_TEXTURE_WIDTH;
		canvas.height = COSMOS_TEXTURE_HEIGHT;
		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) {
			return "";
		}

		const width = canvas.width;
		const height = canvas.height;
		const minSide = Math.min(width, height);
		let randomSeed = 2166136261;
		for (let index = 0; index < seedKey.length; index += 1) {
			randomSeed ^= seedKey.charCodeAt(index);
			randomSeed = Math.imul(randomSeed, 16777619);
		}
		const rand = () => {
			randomSeed += 0x6D2B79F5;
			let value = randomSeed;
			value = Math.imul(value ^ (value >>> 15), value | 1);
			value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
			return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
		};
		const rgba = (rgb, alpha) => {
			const r = Math.round(clamp(rgb.r, 0, 1) * 255);
			const g = Math.round(clamp(rgb.g, 0, 1) * 255);
			const b = Math.round(clamp(rgb.b, 0, 1) * 255);
			return `rgba(${r},${g},${b},${alpha})`;
		};

		ctx.clearRect(0, 0, width, height);

		ctx.globalCompositeOperation = "screen";
		const colors = [palette.hot, palette.cyan, palette.lime, mixRgb(palette.hot, { r: 1, g: 1, b: 1 }, 0.42)];
		const armSeed = rand("arm") * Math.PI * 2;
		ctx.filter = "blur(18px)";
		for (let index = 0; index < 7; index += 1) {
			const x = width * (0.24 + rand(`veil-x-${index}`) * 0.52);
			const y = height * (0.22 + rand(`veil-y-${index}`) * 0.58);
			const radius = minSide * (0.34 + rand(`veil-r-${index}`) * 0.28);
			const color = colors[index % colors.length];
			const veil = ctx.createRadialGradient(x, y, 0, x, y, radius);
			veil.addColorStop(0, rgba(mixRgb(color, { r: 1, g: 1, b: 1 }, 0.16), 0.055));
			veil.addColorStop(0.45, rgba(color, 0.026));
			veil.addColorStop(1, rgba(color, 0));
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(rand(`veil-rot-${index}`) * Math.PI);
			ctx.scale(2.15 + rand(`veil-sx-${index}`) * 1.2, 0.55 + rand(`veil-sy-${index}`) * 0.55);
			ctx.fillStyle = veil;
			ctx.beginPath();
			ctx.arc(0, 0, radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
		ctx.filter = "blur(10px)";
		for (let index = 0; index < 46; index += 1) {
			const t = index / 45;
			const wave = Math.sin(t * Math.PI * 2.2 + armSeed);
			const drift = Math.cos(t * Math.PI * 1.7 + armSeed * 0.63);
			const x = width * (0.18 + t * 0.7 + wave * 0.06);
			const y = height * (0.5 + Math.sin(t * Math.PI * 2.7 + armSeed * 1.4) * 0.23 + drift * 0.08);
			const radius = minSide * (0.16 + rand(`neb-r-${index}`) * 0.22);
			const color = colors[index % colors.length];
			const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
			glow.addColorStop(0, rgba(mixRgb(color, { r: 1, g: 1, b: 1 }, 0.2), 0.065 + rand(`neb-a-${index}`) * 0.045));
			glow.addColorStop(0.36, rgba(color, 0.032 + rand(`neb-b-${index}`) * 0.034));
			glow.addColorStop(1, rgba(color, 0));
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(-0.55 + t * 1.2 + rand(`neb-rot-${index}`) * 0.4);
			ctx.scale(1.85 + rand(`neb-sx-${index}`) * 1.3, 0.48 + rand(`neb-sy-${index}`) * 0.62);
			ctx.fillStyle = glow;
			ctx.beginPath();
			ctx.arc(0, 0, radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
		ctx.filter = "none";

		ctx.globalCompositeOperation = "lighter";
		ctx.filter = "blur(1.4px)";
		for (let index = 0; index < 1150; index += 1) {
			const t = rand(`dust-t-${index}`);
			const angle = t * Math.PI * 2.6 + armSeed;
			const spread = (rand(`dust-spread-${index}`) - 0.5) * minSide * 0.5;
			const x = width * (0.18 + t * 0.72) + Math.cos(angle) * spread;
			const y = height * (0.52 + Math.sin(t * Math.PI * 2.4 + armSeed) * 0.22) + Math.sin(angle) * spread * 0.62;
			const size = 1.2 + rand(`dust-size-${index}`) * 2.8;
			const color = colors[Math.floor(rand(`dust-color-${index}`) * colors.length) % colors.length];
			const dust = ctx.createRadialGradient(x, y, 0, x, y, size);
			dust.addColorStop(0, rgba(color, 0.018 + rand(`dust-alpha-${index}`) * 0.028));
			dust.addColorStop(1, rgba(color, 0));
			ctx.fillStyle = dust;
			ctx.fillRect(x - size, y - size, size * 2, size * 2);
		}
		ctx.filter = "none";

		ctx.globalCompositeOperation = "source-over";
		for (let index = 0; index < 6; index += 1) {
			const x = width * rand(`hole-x-${index}`);
			const y = height * rand(`hole-y-${index}`);
			const radius = minSide * (0.12 + rand(`hole-r-${index}`) * 0.22);
			const hole = ctx.createRadialGradient(x, y, 0, x, y, radius);
			hole.addColorStop(0, "rgba(0,0,0,0.26)");
			hole.addColorStop(1, "rgba(0,0,0,0)");
			ctx.fillStyle = hole;
			ctx.fillRect(0, 0, width, height);
		}

		ctx.globalCompositeOperation = "lighter";
		for (let index = 0; index < 720; index += 1) {
			const x = rand(`star-x-${index}`) * width;
			const y = rand(`star-y-${index}`) * height;
			const hot = rand(`star-hot-${index}`);
			const size = hot > 0.992 ? 1.15 + rand(`star-big-${index}`) * 1.25 : 0.38 + rand(`star-size-${index}`) * 0.62;
			const alpha = hot > 0.992 ? 0.66 : 0.18 + rand(`star-alpha-${index}`) * 0.48;
			const tint = hot > 0.82 ? colors[Math.floor(rand(`star-color-${index}`) * colors.length) % colors.length] : { r: 1, g: 1, b: 1 };
			const glowRadius = size * (hot > 0.992 ? 4.9 : 3.1);
			const star = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
			star.addColorStop(0, rgba(mixRgb(tint, { r: 1, g: 1, b: 1 }, 0.72), alpha * 0.74));
			star.addColorStop(0.18, rgba(tint, alpha * 0.42));
			star.addColorStop(1, rgba(tint, 0));
			ctx.fillStyle = star;
			ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
			ctx.fillStyle = rgba(mixRgb(tint, { r: 1, g: 1, b: 1 }, 0.82), Math.min(0.9, alpha + 0.16));
			ctx.beginPath();
			ctx.arc(x, y, Math.max(0.28, size * 0.42), 0, Math.PI * 2);
			ctx.fill();
			if (hot > 0.997) {
				ctx.strokeStyle = rgba(tint, alpha * 0.55);
				ctx.lineWidth = 0.8;
				ctx.beginPath();
				ctx.moveTo(x - size * 3.2, y);
				ctx.lineTo(x + size * 3.2, y);
				ctx.moveTo(x, y - size * 3.2);
				ctx.lineTo(x, y + size * 3.2);
				ctx.stroke();
			}
		}

		ctx.globalCompositeOperation = "source-over";
		const vignette = ctx.createRadialGradient(width * 0.5, height * 0.5, minSide * 0.18, width * 0.5, height * 0.5, width * 0.68);
		vignette.addColorStop(0, "rgba(0,0,0,0)");
		vignette.addColorStop(1, "rgba(0,0,0,0.62)");
		ctx.fillStyle = vignette;
		ctx.fillRect(0, 0, width, height);

		return canvas;
	}

	function createCosmosTextureRenderer(canvas) {
		if (!canvas) {
			return {
				setTexture() {},
				setFlow() {},
				render() {},
				pause() {},
				getStats() {
					return { mode: "none", ready: false };
				},
			};
		}

		const gl =
			canvas.getContext("webgl", {
				alpha: true,
				antialias: false,
				depth: false,
				preserveDrawingBuffer: false,
				powerPreference: "high-performance",
			}) || canvas.getContext("experimental-webgl");

		if (!gl) {
			return createCosmosCanvasFallback(canvas);
		}

		const vertexSource = `
attribute vec2 a_position;
attribute vec2 a_uv;
uniform vec2 u_translate;
uniform float u_rotation;
uniform float u_scale;
varying vec2 v_uv;

void main() {
	vec2 position = a_position * u_scale;
	float c = cos(u_rotation);
	float s = sin(u_rotation);
	position = vec2(position.x * c - position.y * s, position.x * s + position.y * c);
	position += u_translate;
	gl_Position = vec4(position, 0.0, 1.0);
	v_uv = a_uv;
}
`;
		const fragmentSource = `
precision mediump float;
uniform sampler2D u_texture;
uniform float u_opacity;
varying vec2 v_uv;

vec3 saturateColor(vec3 color, float amount) {
	float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
	return mix(vec3(luma), color, amount);
}

void main() {
	vec4 color = texture2D(u_texture, v_uv);
	color.rgb = saturateColor(color.rgb, 1.05);
	color.rgb = (color.rgb - 0.5) * 1.10 + 0.5;
	color.rgb *= 1.02;
	gl_FragColor = vec4(max(color.rgb, vec3(0.0)), color.a * u_opacity);
}
`;
		const program = createProgram(gl, vertexSource, fragmentSource);
		if (!program) {
			return createCosmosCanvasFallback(canvas);
		}

		const positionBuffer = gl.createBuffer();
		const uvBuffer = gl.createBuffer();
		const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
		const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);

		const renderer = {
			current: null,
			previous: null,
			transitionStart: 0,
			transitionDuration: 0,
			flow: {
				shiftX: 0,
				shiftY: 0,
				starOpacity: 1,
			},
			viewport: {
				width: 1,
				height: 1,
				cssWidth: 1,
				cssHeight: 1,
			},
			viewportDirty: true,
			resizeObserver: null,
			stats: {
				mode: "webgl",
				ready: false,
				canvas: { width: 0, height: 0 },
				texture: { width: 0, height: 0 },
				transition: 1,
				renderMs: 0,
			},
		};

		const locations = {
			position: gl.getAttribLocation(program, "a_position"),
			uv: gl.getAttribLocation(program, "a_uv"),
			texture: gl.getUniformLocation(program, "u_texture"),
			opacity: gl.getUniformLocation(program, "u_opacity"),
			translate: gl.getUniformLocation(program, "u_translate"),
			rotation: gl.getUniformLocation(program, "u_rotation"),
			scale: gl.getUniformLocation(program, "u_scale"),
		};

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		const uploadTexture = (source) => {
			const texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
			return { texture, width: source.width, height: source.height };
		};

		const deleteTexture = (textureInfo) => {
			if (textureInfo?.texture) {
				gl.deleteTexture(textureInfo.texture);
			}
		};

		const setViewportSize = (cssWidth, cssHeight) => {
			const safeCssWidth = Math.max(1, Number(cssWidth) || 1);
			const safeCssHeight = Math.max(1, Number(cssHeight) || 1);
			const dpr = Math.min(window.devicePixelRatio || 1, 1);
			const rawWidth = Math.max(1, Math.floor(safeCssWidth * dpr));
			const rawHeight = Math.max(1, Math.floor(safeCssHeight * dpr));
			const capScale = Math.min(1, COSMOS_TEXTURE_WIDTH / rawWidth, COSMOS_TEXTURE_HEIGHT / rawHeight);
			const width = Math.max(1, Math.floor(rawWidth * capScale));
			const height = Math.max(1, Math.floor(rawHeight * capScale));
			const current = renderer.viewport;
			if (
				current.width === width &&
				current.height === height &&
				Math.abs(current.cssWidth - safeCssWidth) < 0.1 &&
				Math.abs(current.cssHeight - safeCssHeight) < 0.1
			) {
				return;
			}

			renderer.viewport = {
				width,
				height,
				cssWidth: safeCssWidth,
				cssHeight: safeCssHeight,
			};
			renderer.viewportDirty = true;
			renderer.stats.canvas = {
				width,
				height,
				cssWidth: round(safeCssWidth),
				cssHeight: round(safeCssHeight),
			};
		};

		const measureViewport = () => {
			const rect = canvas.getBoundingClientRect();
			setViewportSize(rect.width, rect.height);
		};

		const installResizeObserver = () => {
			if (typeof ResizeObserver === "function") {
				renderer.resizeObserver = new ResizeObserver((entries) => {
					const entry = entries[0];
					if (entry?.contentRect) {
						setViewportSize(entry.contentRect.width, entry.contentRect.height);
					}
				});
				renderer.resizeObserver.observe(canvas);
			} else {
				window.addEventListener("resize", measureViewport, { passive: true });
			}
			measureViewport();
		};

		const getViewportSize = () => {
			const viewport = renderer.viewport;
			if (!viewport.width || !viewport.height) {
				measureViewport();
			}
			return renderer.viewport;
		};

		const resize = () => {
			const viewport = getViewportSize();
			if (canvas.width !== viewport.width || canvas.height !== viewport.height) {
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				renderer.viewportDirty = true;
			}
			if (renderer.viewportDirty) {
				gl.viewport(0, 0, viewport.width, viewport.height);
				renderer.viewportDirty = false;
			}
			renderer.stats.canvas = {
				width: viewport.width,
				height: viewport.height,
				cssWidth: round(viewport.cssWidth),
				cssHeight: round(viewport.cssHeight),
			};
			return viewport;
		};

		installResizeObserver();

		const bindQuad = () => {
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.enableVertexAttribArray(locations.position);
			gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
			gl.enableVertexAttribArray(locations.uv);
			gl.vertexAttribPointer(locations.uv, 2, gl.FLOAT, false, 0, 0);
		};

		const drawLayer = (textureInfo, opacity, rotation, scale, viewport) => {
			if (!textureInfo || opacity <= 0.001) {
				return;
			}

			const translateX = viewport.cssWidth ? (renderer.flow.shiftX * 2) / viewport.cssWidth : 0;
			const translateY = viewport.cssHeight ? (-renderer.flow.shiftY * 2) / viewport.cssHeight : 0;
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
			gl.uniform1i(locations.texture, 0);
			gl.uniform1f(locations.opacity, opacity);
			gl.uniform2f(locations.translate, translateX, translateY);
			gl.uniform1f(locations.rotation, rotation);
			gl.uniform1f(locations.scale, scale);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		};

		return {
			setTexture(source, duration = 0) {
				const next = uploadTexture(source);
				if (renderer.previous && renderer.previous !== renderer.current) {
					deleteTexture(renderer.previous);
				}
				renderer.previous = renderer.current;
				renderer.current = next;
				renderer.transitionStart = performance.now();
				renderer.transitionDuration = Math.max(0, Number(duration) || 0);
				renderer.stats.ready = true;
				renderer.stats.texture = { width: next.width, height: next.height };
			},
			setFlow(flow) {
				Object.assign(renderer.flow, flow || {});
			},
			resize() {
				measureViewport();
				resize();
			},
			render(time = performance.now()) {
				if (!renderer.current) {
					return renderer.stats;
				}

				const start = performance.now();
				const viewport = resize();
				const progress = renderer.transitionDuration
					? clamp((time - renderer.transitionStart) / renderer.transitionDuration, 0, 1)
					: 1;
				const eased = easeInOutCubic(progress);
				const starOpacity = clamp(Number(renderer.flow.starOpacity) || 0, 0, 1.6);

				gl.clearColor(0, 0, 0, 0);
				gl.clear(gl.COLOR_BUFFER_BIT);
				gl.useProgram(program);
				bindQuad();
				drawLayer(renderer.previous, (1 - eased) * starOpacity, -0.006981317, 1.055, viewport);
				drawLayer(renderer.current, starOpacity * (renderer.previous ? eased : 1), 0.009599311, 1.05, viewport);

				if (progress >= 1 && renderer.previous) {
					deleteTexture(renderer.previous);
					renderer.previous = null;
				}

				renderer.stats.transition = round(eased, 3);
				renderer.stats.renderMs = round(performance.now() - start, 3);
				return renderer.stats;
			},
			pause() {
				if (!renderer.current) {
					return;
				}
				this.setFlow({ shiftX: 0, shiftY: 0 });
				this.render(performance.now());
			},
			getStats() {
				return { ...renderer.stats };
			},
		};
	}

	function createCosmosCanvasFallback(canvas) {
		const ctx = canvas.getContext("2d", { alpha: true });
		const renderer = {
			current: null,
			viewport: {
				width: 1,
				height: 1,
				cssWidth: 1,
				cssHeight: 1,
			},
			resizeObserver: null,
			stats: {
				mode: "2d",
				ready: false,
				canvas: { width: 0, height: 0 },
				texture: { width: 0, height: 0 },
				transition: 1,
				renderMs: 0,
			},
		};

		const setViewportSize = (cssWidth, cssHeight) => {
			const safeCssWidth = Math.max(1, Number(cssWidth) || 1);
			const safeCssHeight = Math.max(1, Number(cssHeight) || 1);
			const dpr = Math.min(window.devicePixelRatio || 1, 1);
			const rawWidth = Math.max(1, Math.floor(safeCssWidth * dpr));
			const rawHeight = Math.max(1, Math.floor(safeCssHeight * dpr));
			const capScale = Math.min(1, COSMOS_TEXTURE_WIDTH / rawWidth, COSMOS_TEXTURE_HEIGHT / rawHeight);
			const width = Math.max(1, Math.floor(rawWidth * capScale));
			const height = Math.max(1, Math.floor(rawHeight * capScale));
			renderer.viewport = { width, height, cssWidth: safeCssWidth, cssHeight: safeCssHeight };
			renderer.stats.canvas = { width, height, cssWidth: round(safeCssWidth), cssHeight: round(safeCssHeight) };
		};

		const measureViewport = () => {
			const rect = canvas.getBoundingClientRect();
			setViewportSize(rect.width, rect.height);
		};

		if (typeof ResizeObserver === "function") {
			renderer.resizeObserver = new ResizeObserver((entries) => {
				const entry = entries[0];
				if (entry?.contentRect) {
					setViewportSize(entry.contentRect.width, entry.contentRect.height);
				}
			});
			renderer.resizeObserver.observe(canvas);
		} else {
			window.addEventListener("resize", measureViewport, { passive: true });
		}
		measureViewport();

		const resize = () => {
			const { width, height, cssWidth, cssHeight } = renderer.viewport;
			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}
			renderer.stats.canvas = { width, height, cssWidth: round(cssWidth), cssHeight: round(cssHeight) };
			return renderer.viewport;
		};

		return {
			setTexture(source) {
				renderer.current = source;
				renderer.stats.ready = Boolean(source);
				renderer.stats.texture = source ? { width: source.width, height: source.height } : { width: 0, height: 0 };
			},
			setFlow() {},
			resize() {
				measureViewport();
				resize();
			},
			render() {
				if (!ctx || !renderer.current) {
					return renderer.stats;
				}

				const start = performance.now();
				const { width, height } = resize();
				ctx.clearRect(0, 0, width, height);
				ctx.globalAlpha = 1;
				ctx.drawImage(renderer.current, 0, 0, width, height);
				renderer.stats.renderMs = round(performance.now() - start, 3);
				return renderer.stats;
			},
			pause() {},
			getStats() {
				return { ...renderer.stats };
			},
		};
	}

	function createPointCloudVisualizer(canvas, fallbackCoverUrl, onPalette) {
		const gl =
			canvas.getContext("webgl", {
				alpha: true,
				antialias: false,
				depth: false,
				preserveDrawingBuffer: false,
				powerPreference: "high-performance",
			}) || canvas.getContext("experimental-webgl");

		const visual = {
			gl,
			pointCount: 0,
			target: new Float32Array(CLOUD_MAX_POINTS * 3),
			source: new Float32Array(CLOUD_MAX_POINTS * 3),
			color: new Float32Array(CLOUD_MAX_POINTS * 4),
			seed: new Float32Array(CLOUD_MAX_POINTS),
			brightness: new Float32Array(CLOUD_MAX_POINTS),
			transitionStart: performance.now(),
			transitionDuration: 2200,
			ringStart: -10000,
			ringDuration: 2600,
			outroStart: -10000,
			outroDuration: 6400,
			outroTrackUri: "",
			switchStart: -10000,
			switchDuration: TRACK_SWITCH_RING_RAMP_DURATION,
			switchFrom: 0,
			switchTo: TRACK_SWITCH_RING_TARGET,
			switchApplyTimer: 0,
			coverToken: 0,
			releaseStart: -10000,
			releaseDuration: 2200,
			releaseFrom: 0,
			switchingCover: false,
			lastCover: "",
			needsResize: true,
			accent: { r: 0.96, g: 0.58, b: 0.18 },
			secondary: { r: 0.18, g: 0.78, b: 0.54 },
			accentFrom: { r: 0.96, g: 0.58, b: 0.18 },
			secondaryFrom: { r: 0.18, g: 0.78, b: 0.54 },
			paletteStart: performance.now(),
			paletteDuration: PALETTE_TRANSITION_DURATION,
			motion: { pitch: 0, yaw: 0, roll: 0 },
			options: {
				visual: true,
				chroma: false,
				maxDpr: 1.1,
				pointBudget: 8000,
				visualFps: 24,
				pausedVisualFps: 1,
				depthScale: 1,
				pointScale: 1,
			},
			lastStats: null,
			lastPoints: null,
			program: null,
			buffers: {},
			locations: {},
		};

		if (!gl) {
			canvas.classList.add("is-fallback");
			return {
				setCover() {},
				burst() {},
				prepareOutro() {},
				startTrackSwitch() {},
				cancelOutro() {},
				resize() {},
				render() {},
				pause() {},
				setMotion() {},
				setOptions() {},
				getStats() {
					return { pointCount: 0, drawCalls: 0, renderMs: 0, visual: false };
				},
				isAnimating() {
					return false;
				},
			};
		}

		const vertexSource = `
attribute vec3 a_source;
attribute vec3 a_target;
attribute vec4 a_color;
attribute float a_seed;
attribute float a_brightness;
uniform float u_dpr;
uniform float u_time;
uniform float u_cover_t;
uniform float u_ring_t;
uniform float u_ring_hold;
uniform float u_chroma;
uniform float u_pitch;
uniform float u_yaw;
uniform float u_roll;
uniform float u_depth_scale;
uniform float u_point_scale;
uniform vec3 u_accent;
uniform vec3 u_secondary;
uniform vec3 u_accent_from;
uniform vec3 u_secondary_from;
uniform vec3 u_accent_to;
uniform vec3 u_secondary_to;
uniform float u_palette_t;
varying vec4 v_color;

float easeOutCubic(float value) {
	float inv = 1.0 - value;
	return 1.0 - inv * inv * inv;
}

float smootherStep(float value) {
	float t = clamp(value, 0.0, 1.0);
	return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

mat2 rotate2d(float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return mat2(c, -s, s, c);
}

float hash1(float value) {
	return fract(sin(value * 127.1 + 311.7) * 43758.5453123);
}

vec3 rotateX3(vec3 p, float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
}

vec3 rotateY3(vec3 p, float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
}

vec3 rotateZ3(vec3 p, float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return vec3(p.x * c - p.y * s, p.x * s + p.y * c, p.z);
}

void main() {
	float rawCover = clamp(u_cover_t, 0.0, 1.0);
	float pointDelay = a_seed * 0.16;
	float coverEase = smootherStep((rawCover - pointDelay) / max(0.001, 1.0 - pointDelay));
	float pulse = sin(3.14159265359 * clamp(u_ring_t, 0.0, 1.0)) * step(u_ring_t, 1.0);
	float shapeWeight = smootherStep(clamp(u_ring_hold, 0.0, 1.0));
	float shapeMix = 1.0 - pow(1.0 - shapeWeight, 3.0);

	float ringAngle = hash1(a_seed + 3.1) * 6.28318530718;
	float ringFill = hash1(a_seed + 7.4);
	float innerRadius = 0.32;
	float outerRadius = 0.56;
	float ringRadius = sqrt(mix(innerRadius * innerRadius, outerRadius * outerRadius, ringFill));
	float ringJitter = (hash1(a_seed + 9.2) - 0.5) * 0.012;
	vec2 loaderRing = vec2(cos(ringAngle), sin(ringAngle)) * (ringRadius + ringJitter);
	vec2 spinner = rotate2d(u_time * 0.00105 - 0.78) * loaderRing;
	vec3 shape = vec3(
		spinner.x * 1.03,
		spinner.y,
		(ringRadius - 0.44) * 0.5 + sin(ringAngle * 2.0 + u_time * 0.0011) * 0.018
	);

	vec3 pos = mix(a_source, a_target, coverEase);
	pos = mix(pos, shape, shapeMix);
	pos.z *= u_depth_scale;

	float waveA = sin(u_time * 0.0021 + a_seed * 77.0);
	float waveB = cos(u_time * 0.0017 + a_seed * 113.0);
	float transitionEnergy = shapeMix + pulse * 0.18;
	float dance = transitionEnergy * 0.005;
	float spread = 1.0 + shapeMix * 0.035;
	pos.xy = pos.xy * spread + vec2(waveA, waveB * 0.8) * dance;
	pos.z += (waveA + waveB) * dance * 0.78;
	pos = rotateX3(pos, u_pitch);
	pos = rotateY3(pos, u_yaw);
	pos = rotateZ3(pos, u_roll);

	float perspective = 1.0 / (1.0 + max(pos.z, -0.86) * 0.25);
	vec2 chromaOffset = vec2(u_chroma * (0.0022 + abs(pos.z) * 0.0012), u_chroma * -0.00055);
	gl_Position = vec4(pos.xy * perspective + chromaOffset, pos.z * 0.28, 1.0);

	vec3 accent = mix(u_accent, u_secondary, step(0.0, sin(a_seed * 17.0 + u_time * 0.001)));
	vec3 lifted = pow(clamp(a_color.rgb, 0.0, 1.0), vec3(0.88));
	float luma = dot(lifted, vec3(0.299, 0.587, 0.114));
	vec3 saturated = mix(vec3(luma), lifted, 1.34);
	vec3 readable = clamp(saturated * 1.08 + vec3(0.012), 0.0, 1.0);
	float loaderPhase = fract(ringAngle / 6.28318530718 + 0.1);
	float loaderRamp = smoothstep(0.07, 0.92, loaderPhase);
	float loaderSeam = 1.0 - smoothstep(0.94, 1.0, loaderPhase) * 0.72;
	float loaderHead = smoothstep(0.0, 0.035, loaderPhase) * (1.0 - smoothstep(0.18, 0.26, loaderPhase));
	float loaderTint = smoothstep(0.16, 0.88, loaderPhase);
	float loaderDensity = clamp(0.1 + loaderRamp * 0.9, 0.1, 1.0) * loaderSeam;
	loaderDensity = max(loaderDensity, loaderHead * 0.98);
	float densityLimit = mix(1.0, loaderDensity, shapeMix);
	float densityMask = step(hash1(a_seed + 29.3), densityLimit);
	vec3 loaderFrom = mix(u_accent_from, u_secondary_from, loaderTint);
	vec3 loaderTo = mix(u_accent_to, u_secondary_to, loaderTint);
	vec3 loaderPalette = mix(loaderFrom, loaderTo, smootherStep(u_palette_t));
	float loaderLight = 0.66 + loaderRamp * 0.34 + loaderHead * 0.18;
	vec3 loaderRgb = clamp(loaderPalette * loaderLight + vec3(loaderHead * 0.035), 0.0, 1.0);
	vec3 baseRgb = mix(readable, accent, pulse * 0.02);
	vec3 rgb = mix(baseRgb, loaderRgb, clamp(shapeMix * 0.92 + pulse * 0.04, 0.0, 0.96));
	float alpha = mix(clamp(a_color.a, 0.62, 0.96), 0.94, shapeMix * 0.88) * densityMask;
	if (u_chroma > 0.1) {
		rgb = vec3(rgb.r * 0.82, rgb.g * 0.08, rgb.b * 0.08);
		alpha *= 0.12;
	} else if (u_chroma < -0.1) {
		rgb = vec3(rgb.r * 0.06, rgb.g * 0.44, rgb.b * 0.82);
		alpha *= 0.11;
	}

	float size = (3.25 + a_brightness * 2.35 + shapeMix * 1.58 + pulse * 0.22) * u_dpr * perspective * u_point_scale;
	gl_PointSize = max(3.1, size);
	v_color = vec4(rgb, alpha);
}
`;

		const fragmentSource = `
precision mediump float;
varying vec4 v_color;

void main() {
	vec2 p = gl_PointCoord - vec2(0.5);
	float d = length(p);
	vec2 box = abs(p);
	float edge = max(box.x, box.y);
	float square = smoothstep(0.5, 0.38, edge);
	float roundMask = smoothstep(0.68, 0.16, d);
	float mask = max(square * 0.88, roundMask * 0.74);
	float core = smoothstep(0.26, 0.04, d);
	vec3 lit = min(v_color.rgb * (1.0 + core * 0.05), vec3(1.0));
	gl_FragColor = vec4(lit, v_color.a * mask);
}
`;

		visual.program = createProgram(gl, vertexSource, fragmentSource);
		if (!visual.program) {
			return {
				setCover() {},
				burst() {},
				prepareOutro() {},
				startTrackSwitch() {},
				cancelOutro() {},
				resize() {},
				render() {},
				pause() {},
				setMotion() {},
				setOptions() {},
				getStats() {
					return { pointCount: 0, drawCalls: 0, renderMs: 0, visual: false };
				},
				isAnimating() {
					return false;
				},
			};
		}

		gl.useProgram(visual.program);
		visual.locations.source = gl.getAttribLocation(visual.program, "a_source");
		visual.locations.target = gl.getAttribLocation(visual.program, "a_target");
		visual.locations.color = gl.getAttribLocation(visual.program, "a_color");
		visual.locations.seed = gl.getAttribLocation(visual.program, "a_seed");
		visual.locations.brightness = gl.getAttribLocation(visual.program, "a_brightness");
		visual.locations.dpr = gl.getUniformLocation(visual.program, "u_dpr");
		visual.locations.time = gl.getUniformLocation(visual.program, "u_time");
		visual.locations.coverT = gl.getUniformLocation(visual.program, "u_cover_t");
		visual.locations.ringT = gl.getUniformLocation(visual.program, "u_ring_t");
		visual.locations.ringHold = gl.getUniformLocation(visual.program, "u_ring_hold");
		visual.locations.chroma = gl.getUniformLocation(visual.program, "u_chroma");
		visual.locations.pitch = gl.getUniformLocation(visual.program, "u_pitch");
		visual.locations.yaw = gl.getUniformLocation(visual.program, "u_yaw");
		visual.locations.roll = gl.getUniformLocation(visual.program, "u_roll");
		visual.locations.depthScale = gl.getUniformLocation(visual.program, "u_depth_scale");
		visual.locations.pointScale = gl.getUniformLocation(visual.program, "u_point_scale");
		visual.locations.accent = gl.getUniformLocation(visual.program, "u_accent");
		visual.locations.secondary = gl.getUniformLocation(visual.program, "u_secondary");
		visual.locations.accentFrom = gl.getUniformLocation(visual.program, "u_accent_from");
		visual.locations.secondaryFrom = gl.getUniformLocation(visual.program, "u_secondary_from");
		visual.locations.accentTo = gl.getUniformLocation(visual.program, "u_accent_to");
		visual.locations.secondaryTo = gl.getUniformLocation(visual.program, "u_secondary_to");
		visual.locations.paletteT = gl.getUniformLocation(visual.program, "u_palette_t");
		visual.buffers.source = gl.createBuffer();
		visual.buffers.target = gl.createBuffer();
		visual.buffers.color = gl.createBuffer();
		visual.buffers.seed = gl.createBuffer();
		visual.buffers.brightness = gl.createBuffer();

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.disable(gl.DEPTH_TEST);

		const api = {
			setCover(url, uri) {
				clearPendingSwitchApply();
				const coverUrl = normalizeCoverUrl(url || fallbackCoverUrl);
				if (coverUrl === visual.lastCover && visual.pointCount) {
					if (visual.switchingCover) {
						releaseRingToCurrentCover();
					}
					return;
				}
				visual.lastCover = coverUrl;
				const coverToken = ++visual.coverToken;
				const activeLength = visual.pointCount * 3;
				if (activeLength) {
					visual.source.set(visual.target.subarray(0, activeLength), 0);
				} else {
					visual.source.fill(0);
				}
				loadCoverPoints(coverUrl, uri || "", coverToken)
					.then((points) => {
						if (coverToken !== visual.coverToken || coverUrl !== visual.lastCover) {
							return;
						}
						requestAnimationFrame(() => {
							if (coverToken === visual.coverToken && coverUrl === visual.lastCover) {
								applyPointData(points, true, coverToken);
							}
						});
					})
					.catch(() => {
						if (coverToken === visual.coverToken && coverUrl === visual.lastCover) {
							requestAnimationFrame(() => {
								if (coverToken === visual.coverToken && coverUrl === visual.lastCover) {
									applyPointData(createFallbackPoints(uri || ""), true, coverToken);
								}
							});
						}
					});
			},
			burst() {
				visual.ringStart = performance.now();
			},
			prepareOutro(uri) {
				const now = performance.now();
				if (!uri || visual.outroTrackUri === uri || getRingHold(now) > 0.02) {
					return;
				}

				visual.outroTrackUri = uri;
				visual.outroStart = now;
				visual.releaseStart = -10000;
				visual.switchingCover = false;
			},
			startTrackSwitch(uri) {
				const now = performance.now();
				const hold = getRingHold(now);
				clearPendingSwitchApply();
				visual.outroTrackUri = uri || `switch:${now}`;
				visual.releaseStart = -10000;
				visual.switchingCover = true;
				visual.outroStart = -10000;
				visual.switchStart = now;
				visual.switchFrom = hold;
				visual.switchTo = Math.max(TRACK_SWITCH_RING_TARGET, hold);
				visual.ringStart = now;
			},
			cancelOutro(uri) {
				if (visual.switchingCover || !visual.outroTrackUri || (uri && visual.outroTrackUri !== uri)) {
					return;
				}

				const now = performance.now();
				const hold = getRingHold(now);
				if (hold > 0.02) {
					visual.releaseFrom = hold;
					visual.releaseStart = now;
				}
				visual.outroStart = -10000;
				visual.outroTrackUri = "";
			},
			resize,
			render,
			pause() {
				gl.clear(gl.COLOR_BUFFER_BIT);
			},
			setMotion(motion = {}) {
				visual.motion.pitch = Number(motion.pitch) || 0;
				visual.motion.yaw = Number(motion.yaw) || 0;
				visual.motion.roll = Number(motion.roll) || 0;
			},
			setOptions(options) {
				const previousBudget = visual.options.pointBudget;
				const previousVisual = visual.options.visual;
				visual.options = {
					...visual.options,
					...options,
				};
				visual.needsResize = true;
				if (visual.lastPoints && (previousBudget !== visual.options.pointBudget || previousVisual !== visual.options.visual)) {
					applyPointData(visual.lastPoints, false);
				}
			},
			getStats() {
				return {
					...(visual.lastStats || {}),
					pointCount: visual.options.visual ? visual.pointCount : 0,
					drawCalls: 0,
					renderMs: 0,
					visual: Boolean(visual.options.visual),
					skipped: true,
				};
			},
			isAnimating(time = performance.now()) {
				const ringHold = getRingHold(time);
				return (
					time - visual.transitionStart < visual.transitionDuration ||
					time - visual.ringStart < visual.ringDuration ||
					ringHold > 0.01 ||
					visual.switchingCover
				);
			},
		};

		api.setCover(fallbackCoverUrl, "fallback");
		window.addEventListener("resize", () => {
			visual.needsResize = true;
		}, { passive: true });
		resize();
		return api;

		function applyPointData(points, animate = true, coverToken = visual.coverToken) {
			if (coverToken !== visual.coverToken) {
				return;
			}
			visual.lastPoints = points;
			const previousCount = visual.pointCount;
			const now = performance.now();
			const useRingSource = Boolean(animate && visual.switchingCover && previousCount);
			if (useRingSource) {
				const switchWait = getSwitchRampWait(now);
				if (switchWait > 0) {
					scheduleSwitchApply(() => applyPointData(points, animate, coverToken), switchWait);
					return;
				}
				clearPendingSwitchApply();
			}
			const pointBudget = visual.options.visual
				? Math.min(CLOUD_MAX_POINTS, Math.max(1200, Number(visual.options.pointBudget) || CLOUD_MAX_POINTS))
				: 0;
			visual.pointCount = Math.min(points.count, pointBudget);
			const pointStride = visual.pointCount ? points.count / visual.pointCount : 1;
			onPalette?.(points.palette);
			if (points.palette?.accentRaw && points.palette?.secondaryRaw) {
				const displayPalette = getDisplayPalette(now);
				visual.accentFrom = displayPalette.accent;
				visual.secondaryFrom = displayPalette.secondary;
				visual.accent = points.palette.accentRaw;
				visual.secondary = points.palette.secondaryRaw;
				visual.paletteStart = now;
			}

			for (let index = 0; index < visual.pointCount; index += 1) {
				const targetOffset = index * 3;
				const colorOffset = index * 4;
				const point = points.items[Math.min(points.count - 1, Math.floor(index * pointStride))];

				if (useRingSource) {
					const transitionPoint = transitionPosition(point.seed, now);
					visual.source[targetOffset] = transitionPoint.x;
					visual.source[targetOffset + 1] = transitionPoint.y;
					visual.source[targetOffset + 2] = transitionPoint.z;
				} else if (!animate) {
					visual.source[targetOffset] = point.x;
					visual.source[targetOffset + 1] = point.y;
					visual.source[targetOffset + 2] = point.z;
				} else if (!previousCount) {
					visual.source[targetOffset] = point.x * 1.4;
					visual.source[targetOffset + 1] = point.y * 1.4;
					visual.source[targetOffset + 2] = -0.65;
				} else if (index >= previousCount) {
					const angle = point.seed * Math.PI * 2;
					visual.source[targetOffset] = Math.cos(angle) * 0.9;
					visual.source[targetOffset + 1] = Math.sin(angle) * 0.58;
					visual.source[targetOffset + 2] = -0.4;
				}

				visual.target[targetOffset] = point.x;
				visual.target[targetOffset + 1] = point.y;
				visual.target[targetOffset + 2] = point.z;
				visual.color[colorOffset] = point.r;
				visual.color[colorOffset + 1] = point.g;
				visual.color[colorOffset + 2] = point.b;
				visual.color[colorOffset + 3] = point.a;
				visual.seed[index] = point.seed;
				visual.brightness[index] = point.brightness;
			}

			visual.transitionStart = now;
			visual.transitionDuration = useRingSource ? 2500 : 2200;
			if (useRingSource) {
				visual.releaseFrom = Math.max(0.86, getRingHold(now));
				visual.releaseStart = now;
				visual.switchingCover = false;
				visual.switchStart = -10000;
				visual.outroTrackUri = "";
			}
			if (now - visual.ringStart > visual.ringDuration) {
				visual.ringStart = -10000;
			}
			uploadBuffers();
		}

		function releaseRingToCurrentCover() {
			if (!visual.pointCount) {
				visual.switchingCover = false;
				return;
			}

			const now = performance.now();
			const switchWait = getSwitchRampWait(now);
			if (switchWait > 0) {
				scheduleSwitchApply(releaseRingToCurrentCover, switchWait);
				return;
			}

			for (let index = 0; index < visual.pointCount; index += 1) {
				const targetOffset = index * 3;
				const transitionPoint = transitionPosition(visual.seed[index], now);
				visual.source[targetOffset] = transitionPoint.x;
				visual.source[targetOffset + 1] = transitionPoint.y;
				visual.source[targetOffset + 2] = transitionPoint.z;
			}

			visual.transitionStart = now;
			visual.transitionDuration = 2500;
			visual.releaseFrom = Math.max(0.86, getRingHold(now));
			visual.releaseStart = now;
			visual.switchingCover = false;
			visual.switchStart = -10000;
			visual.outroTrackUri = "";
			uploadAttributeBuffer(visual.buffers.source, visual.source, visual.pointCount * 3);
		}

		function clearPendingSwitchApply() {
			if (!visual.switchApplyTimer) {
				return;
			}
			clearTimeout(visual.switchApplyTimer);
			visual.switchApplyTimer = 0;
		}

		function scheduleSwitchApply(callback, wait) {
			clearPendingSwitchApply();
			visual.switchApplyTimer = setTimeout(() => {
				visual.switchApplyTimer = 0;
				callback();
			}, Math.max(16, wait));
		}

		function resize() {
			visual.needsResize = false;
			const rect = canvas.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, visual.options.maxDpr || 1.75);
			const width = Math.max(1, Math.floor(rect.width * dpr));
			const height = Math.max(1, Math.floor(rect.height * dpr));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}
			gl.viewport(0, 0, width, height);
		}

		function uploadBuffers() {
			uploadAttributeBuffer(visual.buffers.source, visual.source, visual.pointCount * 3);
			uploadAttributeBuffer(visual.buffers.target, visual.target, visual.pointCount * 3);
			uploadAttributeBuffer(visual.buffers.color, visual.color, visual.pointCount * 4);
			uploadAttributeBuffer(visual.buffers.seed, visual.seed, visual.pointCount);
			uploadAttributeBuffer(visual.buffers.brightness, visual.brightness, visual.pointCount);
		}

		function uploadAttributeBuffer(buffer, data, length) {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, length), gl.STATIC_DRAW);
		}

		function bindAttribute(buffer, location, size) {
			if (location < 0) {
				return;
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(location);
			gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
		}

		function bindAttributes() {
			bindAttribute(visual.buffers.source, visual.locations.source, 3);
			bindAttribute(visual.buffers.target, visual.locations.target, 3);
			bindAttribute(visual.buffers.color, visual.locations.color, 4);
			bindAttribute(visual.buffers.seed, visual.locations.seed, 1);
			bindAttribute(visual.buffers.brightness, visual.locations.brightness, 1);
		}

		function easeInOutCubic(value) {
			const t = clamp(value, 0, 1);
			return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
		}

		function mixRgb(from, to, value) {
			const t = clamp(value, 0, 1);
			return {
				r: lerp(from.r, to.r, t),
				g: lerp(from.g, to.g, t),
				b: lerp(from.b, to.b, t),
			};
		}

		function hashFloat(value) {
			const raw = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
			return raw - Math.floor(raw);
		}

		function getDisplayPalette(now = performance.now()) {
			const paletteT = easeOutCubic(clamp((now - visual.paletteStart) / visual.paletteDuration, 0, 1));
			return {
				accent: mixRgb(visual.accentFrom, visual.accent, paletteT),
				secondary: mixRgb(visual.secondaryFrom, visual.secondary, paletteT),
			};
		}

		function transitionPosition(seed, now = performance.now()) {
			const angle = hashFloat(seed + 3.1) * Math.PI * 2;
			const innerRadius = 0.32;
			const outerRadius = 0.56;
			const fill = hashFloat(seed + 7.4);
			const radius = Math.sqrt(lerp(innerRadius * innerRadius, outerRadius * outerRadius, fill));
			const jitter = (hashFloat(seed + 9.2) - 0.5) * 0.012;
			let x = Math.cos(angle) * (radius + jitter);
			let y = Math.sin(angle) * (radius + jitter);

			const rotate = now * 0.00105 - 0.78;
			const cos = Math.cos(rotate);
			const sin = Math.sin(rotate);
			return {
				x: (x * cos - y * sin) * 1.03,
				y: x * sin + y * cos,
				z: (radius - 0.44) * 0.5 + Math.sin(angle * 2 + now * 0.0011) * 0.018,
			};
		}

		function getRingHold(now = performance.now()) {
			if (visual.releaseStart > 0) {
				const releaseT = easeInOutCubic((now - visual.releaseStart) / visual.releaseDuration);
				return Math.max(0, visual.releaseFrom * (1 - releaseT));
			}

			const outroT = visual.outroStart > 0
				? easeInOutCubic((now - visual.outroStart) / visual.outroDuration)
				: 0;
			const cappedOutro = Math.min(outroT, 0.9);
			if (visual.switchingCover) {
				const switchT = visual.switchStart > 0
					? easeOutCubic((now - visual.switchStart) / visual.switchDuration)
					: 1;
				const switchHold = lerp(visual.switchFrom, visual.switchTo, switchT);
				return Math.max(cappedOutro, Math.min(switchHold, 0.96));
			}
			return cappedOutro;
		}

		function getSwitchRampWait(now = performance.now()) {
			if (!visual.switchingCover || visual.switchStart <= 0) {
				return 0;
			}
			if (getRingHold(now) >= TRACK_SWITCH_RING_TARGET - 0.02) {
				return 0;
			}
			return Math.max(0, visual.switchDuration - (now - visual.switchStart));
		}

		function render(time) {
			if (!visual.options.visual || !visual.pointCount) {
				visual.lastStats = {
					...(visual.lastStats || {}),
					pointCount: 0,
					drawCalls: 0,
					renderMs: 0,
					visual: Boolean(visual.options.visual),
					skipped: true,
				};
				return visual.lastStats;
			}

			const renderStart = performance.now();
			if (visual.needsResize) {
				resize();
			}

			const now = time || performance.now();
			const coverT = clamp((now - visual.transitionStart) / visual.transitionDuration, 0, 1);
			const ringT = clamp((now - visual.ringStart) / visual.ringDuration, 0, 1);
			const ringHold = getRingHold(now);
			const paletteT = easeOutCubic(clamp((now - visual.paletteStart) / visual.paletteDuration, 0, 1));
			const palette = getDisplayPalette(now);

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(visual.program);
			const dpr = Math.min(window.devicePixelRatio || 1, visual.options.maxDpr || 1.75);
			gl.uniform1f(visual.locations.dpr, dpr);
			gl.uniform1f(visual.locations.time, now);
			gl.uniform1f(visual.locations.coverT, coverT);
			gl.uniform1f(visual.locations.ringT, ringT);
			gl.uniform1f(visual.locations.ringHold, ringHold);
			gl.uniform1f(visual.locations.pitch, visual.motion.pitch);
			gl.uniform1f(visual.locations.yaw, visual.motion.yaw);
			gl.uniform1f(visual.locations.roll, visual.motion.roll);
			gl.uniform1f(visual.locations.depthScale, Number(visual.options.depthScale) || 1);
			gl.uniform1f(visual.locations.pointScale, Number(visual.options.pointScale) || 1);
			gl.uniform3f(visual.locations.accent, palette.accent.r, palette.accent.g, palette.accent.b);
			gl.uniform3f(visual.locations.secondary, palette.secondary.r, palette.secondary.g, palette.secondary.b);
			gl.uniform3f(visual.locations.accentFrom, visual.accentFrom.r, visual.accentFrom.g, visual.accentFrom.b);
			gl.uniform3f(visual.locations.secondaryFrom, visual.secondaryFrom.r, visual.secondaryFrom.g, visual.secondaryFrom.b);
			gl.uniform3f(visual.locations.accentTo, visual.accent.r, visual.accent.g, visual.accent.b);
			gl.uniform3f(visual.locations.secondaryTo, visual.secondary.r, visual.secondary.g, visual.secondary.b);
			gl.uniform1f(visual.locations.paletteT, paletteT);
			bindAttributes();

			let drawCalls = 0;
			if (visual.options.chroma) {
				gl.uniform1f(visual.locations.chroma, 1);
				gl.drawArrays(gl.POINTS, 0, visual.pointCount);
				gl.uniform1f(visual.locations.chroma, -1);
				gl.drawArrays(gl.POINTS, 0, visual.pointCount);
				drawCalls += 2;
			}
			gl.uniform1f(visual.locations.chroma, 0);
			gl.drawArrays(gl.POINTS, 0, visual.pointCount);
			drawCalls += 1;

			visual.lastStats = {
				pointCount: visual.pointCount,
				drawCalls,
				visual: Boolean(visual.options.visual),
				dpr: round(dpr, 2),
				canvas: {
					width: canvas.width,
					height: canvas.height,
				},
				chroma: Boolean(visual.options.chroma),
				maxDpr: visual.options.maxDpr,
				coverT: round(coverT, 3),
				ringT: round(ringT, 3),
				ringHold: round(ringHold, 3),
				paletteT: round(paletteT, 3),
				switchingCover: Boolean(visual.switchingCover),
				beat: 0,
				intensity: 0,
				renderMs: round(performance.now() - renderStart, 3),
				pointBudget: visual.options.pointBudget,
				targetVisualFps: visual.options.visualFps,
				skipped: false,
			};
			return visual.lastStats;
		}

		function waitForNextFrame() {
			return new Promise((resolve) => requestAnimationFrame(resolve));
		}

		async function loadCoverPoints(url, uri, coverToken) {
			const source = normalizeCoverUrl(url || fallbackCoverUrl);

			try {
				return await loadImagePoints(source, uri, true, coverToken);
			} catch (directError) {
				if (coverToken !== visual.coverToken) {
					throw directError;
				}

				let blobUrl = "";
				try {
					blobUrl = await createCoverBlobUrl(source);
					return await loadImagePoints(blobUrl, uri, false, coverToken);
				} finally {
					if (blobUrl) {
						URL.revokeObjectURL(blobUrl);
					}
				}
			}
		}

		function loadImagePoints(source, uri, anonymous, coverToken) {
			return new Promise((resolve, reject) => {
				const image = new Image();
				if (anonymous && !source.startsWith("data:") && !source.startsWith("blob:")) {
					image.crossOrigin = "anonymous";
				}
				image.decoding = "async";
				image.onload = async () => {
					try {
						resolve(await sampleImagePoints(image, uri, coverToken));
					} catch (error) {
						reject(error);
					}
				};
				image.onerror = reject;
				image.src = source;
			});
		}

		async function createCoverBlobUrl(source) {
			if (source.startsWith("data:") || source.startsWith("blob:")) {
				throw new Error("Blob fallback is not needed for inline cover art");
			}

			const response = await fetch(source, {
				cache: "force-cache",
				mode: "cors",
			});

			if (!response.ok) {
				throw new Error(`Cover fetch failed: ${response.status}`);
			}

			return URL.createObjectURL(await response.blob());
		}

		async function sampleImagePoints(image, uri, coverToken) {
			const sampler = document.createElement("canvas");
			sampler.width = CLOUD_SAMPLE_SIZE;
			sampler.height = CLOUD_SAMPLE_SIZE;
			const ctx = sampler.getContext("2d", { willReadFrequently: true });
			ctx.clearRect(0, 0, CLOUD_SAMPLE_SIZE, CLOUD_SAMPLE_SIZE);
			ctx.drawImage(image, 0, 0, CLOUD_SAMPLE_SIZE, CLOUD_SAMPLE_SIZE);

			const imageData = ctx.getImageData(0, 0, CLOUD_SAMPLE_SIZE, CLOUD_SAMPLE_SIZE).data;
			const candidates = [];

			for (let y = 0; y < CLOUD_SAMPLE_SIZE; y += 1) {
				if (coverToken !== visual.coverToken) {
					throw new Error("Cover sampling cancelled");
				}

				for (let x = 0; x < CLOUD_SAMPLE_SIZE; x += 1) {
					const offset = (y * CLOUD_SAMPLE_SIZE + x) * 4;
					const alpha = imageData[offset + 3] / 255;
					if (alpha < 0.25) {
						continue;
					}

					const r = imageData[offset];
					const g = imageData[offset + 1];
					const b = imageData[offset + 2];
					const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
					const maxChannel = Math.max(r, g, b) / 255;
					const minChannel = Math.min(r, g, b) / 255;
					const chroma = maxChannel - minChannel;
					const depthScore = clamp(brightness * 0.72 + chroma * 0.36 + maxChannel * 0.18, 0, 1);
					const seed = seededRandom(`${uri}:${x}:${y}:${r}:${g}:${b}`);
					const keepChance = 0.95 - Math.max(0, 0.045 - brightness) * 0.38;

					if (seed > keepChance) {
						continue;
					}

					const px = (x / (CLOUD_SAMPLE_SIZE - 1) - 0.5) * 1.06;
					const py = (0.5 - y / (CLOUD_SAMPLE_SIZE - 1)) * 1.06;
					const nx = x / (CLOUD_SAMPLE_SIZE - 1) - 0.5;
					const ny = 0.5 - y / (CLOUD_SAMPLE_SIZE - 1);
					const waveDepth =
						Math.sin((nx + 0.5) * Math.PI * 3.35 + brightness * 0.72) *
						Math.cos((ny + 0.5) * Math.PI * 2.35) *
						0.15;
					const edgeVolume = Math.sin((nx + 0.5) * Math.PI) * Math.sin((ny + 0.5) * Math.PI) * 0.055;
					const depth = clamp(0.62 - depthScore * 1.38 + waveDepth + edgeVolume + (seed - 0.5) * 0.052, -0.76, 0.72);
					const lift = Math.sin(seed * 48) * 0.006;
					const vivid = 1.04 + (1 - brightness) * 0.14;
					const liftColor = 0.006 + (1 - brightness) * 0.026;
					const gamma = 0.86;

					candidates.push({
						x: px + (seed - 0.5) * 0.006,
						y: py + lift,
						z: depth,
						r: clamp(Math.pow(r / 255, gamma) * vivid + liftColor, 0, 1),
						g: clamp(Math.pow(g / 255, gamma) * vivid + liftColor, 0, 1),
						b: clamp(Math.pow(b / 255, gamma) * vivid + liftColor, 0, 1),
						a: clamp(0.7 + alpha * 0.18 + brightness * 0.12, 0.64, 0.96),
						seed,
						brightness,
					});
				}

				if (y > 0 && y % COVER_SAMPLE_CHUNK_ROWS === 0) {
					await waitForNextFrame();
				}
			}

			if (coverToken !== visual.coverToken) {
				throw new Error("Cover sampling cancelled");
			}

			const palette = createPaletteFromPoints(candidates);

			if (candidates.length > CLOUD_MAX_POINTS) {
				const stride = candidates.length / CLOUD_MAX_POINTS;
				const items = [];
				for (let index = 0; index < CLOUD_MAX_POINTS; index += 1) {
					items.push(candidates[Math.floor(index * stride)]);
				}
				return { count: items.length, items, palette };
			}

			return candidates.length ? { count: candidates.length, items: candidates, palette } : createFallbackPoints(uri);
		}

		function createFallbackPoints(uri) {
			const items = [];
			const size = 84;
			for (let y = 0; y < size; y += 1) {
				for (let x = 0; x < size; x += 1) {
					const index = y * size + x;
					const seed = seededRandom(`${uri}:fallback:${index}`);
					const nx = x / (size - 1) - 0.5;
					const ny = 0.5 - y / (size - 1);
					const wave = Math.sin((x + seed * 4) * 0.18) * Math.cos((y - seed * 3) * 0.16);
					const brightness = 0.42 + seed * 0.35;
					const depth = clamp(0.55 - brightness * 1.1 + wave * 0.2 + (seed - 0.5) * 0.12, -0.62, 0.6);
					items.push({
						x: nx * 1.04 + (seed - 0.5) * 0.012,
						y: ny * 1.04 + wave * 0.012,
						z: depth,
						r: 0.42 + seed * 0.42,
						g: 0.18 + seededRandom(`${index}:g`) * 0.32,
						b: 0.66 + seededRandom(`${index}:b`) * 0.3,
						a: 0.62 + seededRandom(`${index}:a`) * 0.26,
						seed,
						brightness,
					});
				}
			}
			return { count: items.length, items, palette: createDefaultPalette() };
		}
	}

	function createPaletteFromPoints(points) {
		if (!points?.length) {
			return createDefaultPalette();
		}

		const stride = Math.max(1, Math.floor(points.length / 14000));
		const buckets = new Map();
		let darkR = 0;
		let darkG = 0;
		let darkB = 0;
		let darkW = 0;
		let baseR = 0;
		let baseG = 0;
		let baseB = 0;
		let baseW = 0;
		let saturationTotal = 0;
		let saturationW = 0;

		for (let index = 0; index < points.length; index += stride) {
			const point = points[index];
			const hsl = rgbToHsl(point.r, point.g, point.b);
			const saturation = hsl.s;
			const brightness = point.brightness;
			const alpha = point.a || 1;
			const baseWeight = alpha * (0.25 + saturation) * (0.25 + brightness);

			saturationTotal += saturation * alpha;
			saturationW += alpha;
			baseR += point.r * baseWeight;
			baseG += point.g * baseWeight;
			baseB += point.b * baseWeight;
			baseW += baseWeight;

			if (brightness < 0.52) {
				const darkWeight = alpha * (0.58 - brightness + 0.06);
				darkR += point.r * darkWeight;
				darkG += point.g * darkWeight;
				darkB += point.b * darkWeight;
				darkW += darkWeight;
			}

			if (saturation > 0.08 && brightness > 0.045) {
				const hueBin = Math.floor(hsl.h * 28);
				const satBin = Math.floor(clamp(hsl.s, 0, 0.999) * 5);
				const lightBin = Math.floor(clamp(hsl.l, 0, 0.999) * 5);
				const key = `${hueBin}:${satBin}:${lightBin}`;
				let bucket = buckets.get(key);
				if (!bucket) {
					bucket = { r: 0, g: 0, b: 0, weight: 0, score: 0 };
					buckets.set(key, bucket);
				}

				const chroma = Math.max(0, saturation - 0.06);
				const lightBalance = clamp(1 - Math.abs(hsl.l - 0.52) * 1.35, 0.18, 1);
				const colorWeight = alpha * chroma * (0.3 + brightness) * lightBalance;
				bucket.r += point.r * colorWeight;
				bucket.g += point.g * colorWeight;
				bucket.b += point.b * colorWeight;
				bucket.weight += colorWeight;
				bucket.score += colorWeight * (0.65 + saturation * 0.72);
			}
		}

		const baseHsl = rgbToHsl(baseR / Math.max(baseW, 1), baseG / Math.max(baseW, 1), baseB / Math.max(baseW, 1));
		const darkBase = darkW
			? rgbToHsl(darkR / darkW, darkG / darkW, darkB / darkW)
			: baseHsl;
		const averageSaturation = saturationTotal / Math.max(saturationW, 1);

		if (!buckets.size && averageSaturation < 0.16 && baseHsl.s < 0.18) {
			return createNeutralPalette(baseHsl, darkBase);
		}

		const colorBuckets = Array.from(buckets.values())
			.filter((bucket) => bucket.weight > 0.0001)
			.map((bucket) => {
				const hsl = bucketToHsl(bucket);
				const chroma = Math.max(0, hsl.s - 0.08);
				const lightBalance = clamp(1 - Math.abs(hsl.l - 0.52) * 1.1, 0.25, 1);
				return {
					...bucket,
					hsl,
					rank: bucket.score * (0.55 + chroma) * lightBalance,
				};
			})
			.filter((bucket) => bucket.hsl.s > 0.12 && bucket.hsl.l > 0.08 && bucket.hsl.l < 0.88)
			.sort((a, b) => b.rank - a.rank);

		if (!colorBuckets.length && averageSaturation < 0.2) {
			return createNeutralPalette(baseHsl, darkBase);
		}

		const accentBucket = colorBuckets[0] || null;
		const accentHsl = normalizeAccentHsl(accentBucket?.hsl || baseHsl);
		const secondaryBucket = selectSecondaryPaletteBucket(colorBuckets, accentHsl, accentBucket);
		const highlightBucket =
			colorBuckets.find((bucket) => circularHueDistance(bucket.hsl.h, accentHsl.h) < 0.16 && bucket.hsl.l > accentHsl.l + 0.04) ||
			colorBuckets.find((bucket) => bucket.hsl.l > 0.58 && bucket.hsl.s > 0.16) ||
			null;

		const neutralAccent = accentHsl.s < 0.2 || averageSaturation < 0.18;
		const secondaryFallback = createSecondaryFallbackHsl(accentHsl, neutralAccent);
		const secondaryHsl = normalizeAccentHsl(secondaryBucket?.hsl || secondaryFallback);
		const highlightBase = highlightBucket?.hsl || accentHsl;
		const highlightHsl = normalizeHighlightHsl(highlightBase, accentHsl, neutralAccent);
		const bg1Hsl = {
			h: darkBase.h,
			s: neutralAccent ? clamp(darkBase.s * 0.65, 0, 0.16) : clamp(darkBase.s + 0.12, 0.28, 0.72),
			l: 0.045,
		};
		const bg2Hsl = {
			h: accentHsl.h,
			s: neutralAccent ? clamp(accentHsl.s * 0.58, 0, 0.18) : clamp(accentHsl.s * 0.72, 0.38, 0.76),
			l: 0.095,
		};
		const bg3Hsl = {
			h: secondaryHsl.h,
			s: neutralAccent ? clamp(secondaryHsl.s * 0.52, 0, 0.16) : clamp(secondaryHsl.s * 0.64, 0.32, 0.68),
			l: 0.04,
		};

		return paletteFromHsl(accentHsl, secondaryHsl, highlightHsl, bg1Hsl, bg2Hsl, bg3Hsl);
	}

	function bucketToHsl(bucket) {
		return rgbToHsl(bucket.r / bucket.weight, bucket.g / bucket.weight, bucket.b / bucket.weight);
	}

	function selectSecondaryPaletteBucket(colorBuckets, accentHsl, accentBucket) {
		const minRank = (accentBucket?.rank || 0) * 0.18;
		const minWeight = (accentBucket?.weight || 0) * 0.12;
		const meaningful = colorBuckets.filter((bucket) =>
			bucket !== accentBucket &&
			bucket.rank >= minRank &&
			bucket.weight >= minWeight &&
			bucket.hsl.s > 0.18
		);

		return (
			meaningful.find((bucket) => circularHueDistance(bucket.hsl.h, accentHsl.h) > 0.13) ||
			meaningful.find((bucket) => circularHueDistance(bucket.hsl.h, accentHsl.h) > 0.08) ||
			null
		);
	}

	function createSecondaryFallbackHsl(accentHsl, neutralAccent) {
		if (neutralAccent) {
			return {
				h: shiftHue(accentHsl.h, 0.05),
				s: accentHsl.s * 0.72,
				l: clamp(accentHsl.l - 0.06, 0.38, 0.62),
			};
		}

		const redFamily = accentHsl.h <= 0.08 || accentHsl.h >= 0.92;
		const hueShift = redFamily ? -0.035 : 0.065;
		return {
			h: shiftHue(accentHsl.h, hueShift),
			s: clamp(accentHsl.s * 0.82, 0.34, 0.78),
			l: clamp(accentHsl.l + 0.045, 0.42, 0.68),
		};
	}

	function shiftHue(hue, amount) {
		return ((hue + amount) % 1 + 1) % 1;
	}

	function createDefaultPalette() {
		return paletteFromHsl(
			{ h: 0.095, s: 0.88, l: 0.58 },
			{ h: 0.39, s: 0.72, l: 0.52 },
			{ h: 0.58, s: 0.68, l: 0.62 },
			{ h: 0.57, s: 0.38, l: 0.04 },
			{ h: 0.1, s: 0.52, l: 0.088 },
			{ h: 0.38, s: 0.34, l: 0.038 }
		);
	}

	function createNeutralPalette(baseHsl, darkBase) {
		const hue = baseHsl.s > 0.08 ? baseHsl.h : darkBase.s > 0.08 ? darkBase.h : 0.08;
		const saturation = clamp(Math.max(baseHsl.s, darkBase.s) * 0.62, 0, 0.16);
		const light = clamp(baseHsl.l, 0.18, 0.58);

		return paletteFromHsl(
			{ h: hue, s: saturation, l: clamp(light + 0.24, 0.5, 0.72) },
			{ h: (hue + 0.05) % 1, s: saturation * 0.72, l: clamp(light + 0.1, 0.4, 0.62) },
			{ h: hue, s: saturation * 0.45, l: clamp(light + 0.34, 0.66, 0.84) },
			{ h: hue, s: saturation * 0.42, l: 0.035 },
			{ h: hue, s: saturation * 0.5, l: 0.082 },
			{ h: (hue + 0.05) % 1, s: saturation * 0.38, l: 0.038 }
		);
	}

	function normalizeAccentHsl(hsl) {
		const vivid = hsl.s > 0.18;
		if (!vivid) {
			return {
				h: hsl.h,
				s: clamp(hsl.s * 0.85, 0, 0.18),
				l: clamp(hsl.l, 0.42, 0.68),
			};
		}

		return {
			h: hsl.h,
			s: clamp(hsl.s * 1.04 + 0.03, 0.36, 0.86),
			l: clamp(hsl.l, 0.38, 0.66),
		};
	}

	function normalizeHighlightHsl(source, accent, neutral) {
		return {
			h: source?.h ?? accent.h,
			s: neutral ? clamp((source?.s ?? accent.s) * 0.65, 0, 0.18) : clamp(Math.max(source?.s ?? 0, accent.s * 0.82), 0.42, 0.88),
			l: clamp(Math.max(source?.l ?? 0, accent.l + 0.1), 0.58, 0.78),
		};
	}

	function paletteFromHsl(accent, secondary, highlight, bg1, bg2, bg3) {
		const accentRgb = hslToRgb(accent.h, accent.s, accent.l);
		const secondaryRgb = hslToRgb(secondary.h, secondary.s, secondary.l);
		const highlightRgb = hslToRgb(highlight.h, highlight.s, highlight.l);
		const bg1Rgb = hslToRgb(bg1.h, bg1.s, bg1.l);
		const bg2Rgb = hslToRgb(bg2.h, bg2.s, bg2.l);
		const bg3Rgb = hslToRgb(bg3.h, bg3.s, bg3.l);

		return {
			accent: rgbCss(accentRgb),
			accentRgb: rgbVar(accentRgb),
			accentRaw: accentRgb,
			secondary: rgbCss(secondaryRgb),
			secondaryRgb: rgbVar(secondaryRgb),
			secondaryRaw: secondaryRgb,
			highlight: rgbCss(highlightRgb),
			highlightRgb: rgbVar(highlightRgb),
			highlightRaw: highlightRgb,
			bg1: rgbCss(bg1Rgb),
			bg1Rgb: rgbVar(bg1Rgb),
			bg2: rgbCss(bg2Rgb),
			bg2Rgb: rgbVar(bg2Rgb),
			bg3: rgbCss(bg3Rgb),
			bg3Rgb: rgbVar(bg3Rgb),
		};
	}

	function rgbToHsl(r, g, b) {
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const l = (max + min) / 2;
		const d = max - min;
		let h = 0;
		let s = 0;

		if (d) {
			s = d / (1 - Math.abs(2 * l - 1));
			if (max === r) {
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
			} else if (max === g) {
				h = ((b - r) / d + 2) / 6;
			} else {
				h = ((r - g) / d + 4) / 6;
			}
		}

		return { h, s, l };
	}

	function hslToRgb(h, s, l) {
		const hueToRgb = (p, q, t) => {
			let value = t;
			if (value < 0) value += 1;
			if (value > 1) value -= 1;
			if (value < 1 / 6) return p + (q - p) * 6 * value;
			if (value < 1 / 2) return q;
			if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
			return p;
		};

		if (!s) {
			return { r: l, g: l, b: l };
		}

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		return {
			r: hueToRgb(p, q, h + 1 / 3),
			g: hueToRgb(p, q, h),
			b: hueToRgb(p, q, h - 1 / 3),
		};
	}

	function circularHueDistance(a, b) {
		const diff = Math.abs(a - b);
		return Math.min(diff, 1 - diff);
	}

	function rgbCss(rgb) {
		const r = Math.round(clamp(rgb.r, 0, 1) * 255);
		const g = Math.round(clamp(rgb.g, 0, 1) * 255);
		const b = Math.round(clamp(rgb.b, 0, 1) * 255);
		return `rgb(${r}, ${g}, ${b})`;
	}

	function rgbVar(rgb) {
		const r = Math.round(clamp(rgb.r, 0, 1) * 255);
		const g = Math.round(clamp(rgb.g, 0, 1) * 255);
		const b = Math.round(clamp(rgb.b, 0, 1) * 255);
		return `${r}, ${g}, ${b}`;
	}

	function createProgram(gl, vertexSource, fragmentSource) {
		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
		if (!vertexShader || !fragmentShader) {
			return null;
		}

		const program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.warn("novaplayer WebGL link failed", gl.getProgramInfoLog(program));
			return null;
		}

		return program;
	}

	function compileShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.warn("novaplayer WebGL shader failed", gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	function easeOutCubic(value) {
		return 1 - (1 - value) ** 3;
	}

	function injectStyle() {
		const style = document.createElement("style");
		style.id = `${EXTENSION_ID}-style`;
		style.textContent = `
body.novaplayer-open {
	overflow: hidden;
}

.novaplayer-launcher-active {
	color: var(--novaplayer-hot, #f0a33b) !important;
}

#${ROOT_ID} {
	--novaplayer-tilt-x: 0deg;
	--novaplayer-tilt-y: 0deg;
	--novaplayer-scene-pan-x: 0px;
		--novaplayer-scene-pan-y: 0px;
		--novaplayer-cover-rot-z: -1.5deg;
		--novaplayer-lyrics-pan-x: 0px;
		--novaplayer-lyrics-pan-y: 0px;
		--novaplayer-lyrics-rot-z: 0deg;
		--novaplayer-camera-edge: 0;
		--novaplayer-edge-border: 10px;
		--novaplayer-edge-blur: 58px;
		--novaplayer-edge-opacity: 0.34;
		--novaplayer-player-anchor-y: -18px;
		--novaplayer-player-scale: 1;
		--novaplayer-flow-x: 50%;
		--novaplayer-flow-y: 50%;
		--novaplayer-flow-alt-x: 50%;
		--novaplayer-flow-alt-y: 50%;
		--novaplayer-flow-third-x: 50%;
		--novaplayer-flow-third-y: 50%;
		--novaplayer-flow-opacity: 0.28;
		--novaplayer-flow-scale: 1;
		--novaplayer-flow-saturation: 1.02;
		--novaplayer-flow-blur: 24px;
		--novaplayer-flow-shift-x: 0px;
		--novaplayer-flow-shift-y: 0px;
		--novaplayer-nebula-opacity: 0.34;
		--novaplayer-nebula-hot-alpha: 0.12;
		--novaplayer-nebula-cyan-alpha: 0.1;
		--novaplayer-nebula-lime-alpha: 0.06;
		--novaplayer-nebula-rotate: 0deg;
		--novaplayer-pointer-strength: 0;
		--novaplayer-cloud-brightness: 1;
		--novaplayer-cloud-saturation: 1.28;
		--novaplayer-star-opacity: 0.9;
		--novaplayer-cosmos-brightness: 0.92;
		--novaplayer-word-glow: 1;
		--novaplayer-word-current-scale: 1.055;
		--novaplayer-lyric-current-min: 34px;
		--novaplayer-lyric-current-fluid: 4.8vw;
		--novaplayer-lyric-current-max: 82px;
		--novaplayer-lyric-side-min: 13px;
		--novaplayer-lyric-side-fluid: 1vw;
		--novaplayer-lyric-side-max: 20px;
		--novaplayer-back-vocal-min: 14px;
		--novaplayer-back-vocal-fluid: 1.25vw;
		--novaplayer-back-vocal-max: 24px;
		--novaplayer-lyric-mobile-current-min: 32px;
		--novaplayer-lyric-mobile-current-fluid: 11vw;
		--novaplayer-lyric-mobile-current-max: 58px;
		--novaplayer-back-mobile-min: 13px;
		--novaplayer-back-mobile-fluid: 3.6vw;
		--novaplayer-back-mobile-max: 20px;
		--novaplayer-layout-lyrics-x: 0px;
		--novaplayer-layout-lyrics-y: 0px;
		--novaplayer-layout-lyric-meta-gap: 0px;
		--novaplayer-layout-cloud-x: 0px;
		--novaplayer-layout-cloud-y: 0px;
		--novaplayer-layout-playlists-x: 0px;
		--novaplayer-layout-playlists-y: 0px;
		--novaplayer-layout-queue-x: 0px;
		--novaplayer-layout-queue-y: 0px;
		--novaplayer-layout-player-x: 0px;
		--novaplayer-layout-player-y: 0px;
		--novaplayer-player-reveal-y: 0px;
	--novaplayer-hot: #f0a33b;
	--novaplayer-hot-rgb: 240, 163, 59;
	--novaplayer-cyan: #42c77b;
	--novaplayer-cyan-rgb: 66, 199, 123;
	--novaplayer-lime: #5d9ee0;
	--novaplayer-lime-rgb: 93, 158, 224;
	--novaplayer-bg-1: #05070a;
	--novaplayer-bg-1-rgb: 5, 7, 10;
	--novaplayer-bg-2: #151007;
	--novaplayer-bg-2-rgb: 21, 16, 7;
	--novaplayer-bg-3: #030907;
	--novaplayer-bg-3-rgb: 3, 9, 7;
	--novaplayer-ink: #05070a;
	--novaplayer-panel: rgba(18, 16, 12, 0.64);
	--novaplayer-line: rgba(255, 255, 255, 0.18);
	position: fixed;
	inset: 0;
	width: 100vw;
	height: 100vh;
	height: 100dvh;
	max-height: 100vh;
	max-height: 100dvh;
	z-index: 2147483647;
	color: #fff;
	background: #010103;
	opacity: 0;
	visibility: hidden;
	pointer-events: none;
	transition: opacity 360ms ease, visibility 360ms ease;
	overflow: hidden;
	contain: layout style paint;
	font-family: "SpotifyMixUITitleVariable", "SpotifyMixUITitle", "CircularSp", sans-serif;
	letter-spacing: 0;
}

#${ROOT_ID}.is-open {
	opacity: 1;
	visibility: visible;
	pointer-events: auto;
}

#${ROOT_ID}::before {
	content: "";
	position: absolute;
	inset: 0;
	z-index: 8;
	pointer-events: none;
	box-shadow:
		inset 0 0 0 var(--novaplayer-edge-border) rgba(0,0,0,0.58),
		inset 0 0 var(--novaplayer-edge-blur) rgba(0,0,0,0.88);
	opacity: var(--novaplayer-edge-opacity);
}

#${ROOT_ID}::after {
	content: none;
	position: absolute;
	inset: -20%;
	z-index: 7;
	pointer-events: none;
	opacity: 0;
	background:
		radial-gradient(circle at 50% 50%, transparent 0 10%, rgba(255,255,255,0.18) 10.5%, transparent 11.4%),
		repeating-radial-gradient(circle at 50% 50%, transparent 0 38px, rgba(255,255,255,0.055) 40px, transparent 44px),
		radial-gradient(ellipse at 50% 50%, rgba(var(--novaplayer-hot-rgb),0.22), transparent 32%),
		radial-gradient(ellipse at 50% 50%, rgba(var(--novaplayer-cyan-rgb),0.16), transparent 46%);
	mix-blend-mode: screen;
	filter: blur(0.8px) saturate(1.12);
	transform: scale(0.72);
}

#${ROOT_ID}.is-universe-jump::after {
	animation: none;
}

#${ROOT_ID} *,
#${ROOT_ID} *::before,
#${ROOT_ID} *::after {
	box-sizing: border-box;
	letter-spacing: 0;
}

#${ROOT_ID} button {
	font: inherit;
	color: inherit;
}

#${ROOT_ID} .novaplayer__debug {
	position: absolute;
	left: clamp(12px, 1.5vw, 22px);
	top: clamp(12px, 1.5vw, 22px);
	z-index: 42;
	display: none;
	width: min(520px, calc(100vw - 28px));
	max-height: calc(100vh - 28px);
	overflow: hidden auto;
	padding: 12px;
	border: 1px solid rgba(255,255,255,0.18);
	border-radius: 14px;
	background: rgba(5, 7, 10, 0.92);
	box-shadow: 0 20px 70px rgba(0,0,0,0.54), inset 0 1px 0 rgba(255,255,255,0.12);
	color: rgba(255,255,255,0.88);
	font-size: 12px;
	line-height: 1.25;
	pointer-events: auto;
}

#${ROOT_ID}.is-debug-open .novaplayer__debug {
	display: block;
}

#${ROOT_ID} .novaplayer__debug-head,
#${ROOT_ID} .novaplayer__debug-actions,
#${ROOT_ID} .novaplayer__debug-profiles,
#${ROOT_ID} .novaplayer__debug-toggles {
	display: flex;
	align-items: center;
	gap: 7px;
}

#${ROOT_ID} .novaplayer__debug-head {
	justify-content: space-between;
	margin-bottom: 10px;
}

#${ROOT_ID} .novaplayer__debug-head strong {
	font-size: 13px;
	font-weight: 900;
	text-transform: uppercase;
	color: #fff;
}

#${ROOT_ID} .novaplayer__debug-profiles,
#${ROOT_ID} .novaplayer__debug-toggles {
	flex-wrap: wrap;
	margin-bottom: 9px;
}

#${ROOT_ID} .novaplayer__debug button {
	min-height: 26px;
	padding: 4px 9px;
	border: 1px solid rgba(255,255,255,0.14);
	border-radius: 999px;
	background: rgba(255,255,255,0.06);
	color: rgba(255,255,255,0.76);
	font-size: 11px;
	font-weight: 800;
	cursor: pointer;
}

#${ROOT_ID} .novaplayer__debug button:hover,
#${ROOT_ID} .novaplayer__debug button:focus-visible,
#${ROOT_ID} .novaplayer__debug button.is-active {
	border-color: rgba(var(--novaplayer-lime-rgb),0.54);
	background: rgba(var(--novaplayer-lime-rgb),0.14);
	color: #fff;
	outline: none;
}

#${ROOT_ID} .novaplayer__debug-grid {
	display: grid;
	grid-template-columns: 104px minmax(0, 1fr);
	gap: 5px 9px;
	padding: 10px 0;
	border-top: 1px solid rgba(255,255,255,0.08);
	border-bottom: 1px solid rgba(255,255,255,0.08);
}

#${ROOT_ID} .novaplayer__debug-grid span {
	color: rgba(255,255,255,0.46);
	font-weight: 750;
}

#${ROOT_ID} .novaplayer__debug-grid strong {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: rgba(255,255,255,0.88);
	font-weight: 850;
}

#${ROOT_ID} .novaplayer__debug-snapshot {
	max-height: 180px;
	margin: 10px 0 0;
	padding: 9px;
	border-radius: 10px;
	background: rgba(0,0,0,0.28);
	overflow: auto;
	color: rgba(255,255,255,0.62);
	font: 10px/1.35 Consolas, "Courier New", monospace;
	white-space: pre-wrap;
}

#${ROOT_ID}.novaplayer-debug-no-edge::before {
	content: none;
}

#${ROOT_ID}.novaplayer-debug-no-visual .novaplayer__cloud,
#${ROOT_ID}.novaplayer-debug-no-visual .novaplayer__cosmos,
#${ROOT_ID}.novaplayer-debug-no-visual .novaplayer__cover-echo {
	display: none;
}

#${ROOT_ID}.novaplayer-debug-no-noise .novaplayer__scan,
#${ROOT_ID}.novaplayer-debug-no-noise .novaplayer__grain {
	display: none;
}

#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__playlists,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__playlist-item,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__vocal-role,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__back-vocal,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__queue-head,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__queue-item,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__player {
	backdrop-filter: none !important;
	-webkit-backdrop-filter: none !important;
	filter: none !important;
}

#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__queue-item,
#${ROOT_ID}.novaplayer-debug-no-glass .novaplayer__player {
	box-shadow: 0 12px 34px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.16);
}

#${ROOT_ID}.novaplayer-debug-no-queue3d .novaplayer__queue,
#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__queue {
	transform: translateX(calc(100% - 116px)) !important;
}

#${ROOT_ID}.novaplayer-debug-no-queue3d .novaplayer__queue:hover,
#${ROOT_ID}.novaplayer-debug-no-queue3d .novaplayer__queue:focus-within,
#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__queue:hover,
#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__queue:focus-within {
	transform: translateX(0) !important;
}

#${ROOT_ID}.novaplayer-debug-no-queue3d .novaplayer__queue-item,
#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__queue-item {
	transform: none !important;
}

#${ROOT_ID} .novaplayer__veil {
	position: absolute;
	inset: 0;
	background:
		radial-gradient(ellipse at 50% 50%, transparent 0 48%, rgba(0,0,0,0.42) 78%, rgba(0,0,0,0.88) 100%),
		linear-gradient(90deg, rgba(0,0,0,0.52), transparent 32%, transparent 68%, rgba(0,0,0,0.6));
	z-index: 4;
	pointer-events: none;
}

#${ROOT_ID} .novaplayer__scan {
	position: absolute;
	inset: 0;
	z-index: 5;
	pointer-events: none;
	background:
		linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
		linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
	background-size: 100% 4px, 4px 100%;
	mix-blend-mode: overlay;
	opacity: 0.28;
}

#${ROOT_ID} .novaplayer__grain {
	position: absolute;
	inset: -20%;
	z-index: 6;
	pointer-events: none;
	background-image:
		radial-gradient(circle at 30% 10%, rgba(255,255,255,0.13) 0 1px, transparent 1px),
		radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0 1px, transparent 1px);
	background-size: 9px 9px, 13px 13px;
	opacity: 0.2;
	animation: novaplayer-grain 9s steps(10) infinite;
}

#${ROOT_ID} .novaplayer__playlist-hotzone {
	position: absolute;
	left: 0;
	right: auto;
	top: 0;
	bottom: 0;
	z-index: 34;
	width: 42px;
	pointer-events: auto;
}

#${ROOT_ID}.is-playlists-right .novaplayer__playlist-hotzone {
	left: auto;
	right: 0;
}

#${ROOT_ID}.hide-playlists .novaplayer__playlist-hotzone,
#${ROOT_ID}.hide-playlists .novaplayer__playlists {
	display: none;
}

#${ROOT_ID} .novaplayer__playlists {
	position: absolute;
	left: clamp(14px, 1.6vw, 28px);
	right: auto;
	top: calc(50% + var(--novaplayer-layout-playlists-y));
	z-index: 35;
	width: clamp(280px, 22vw, 380px);
	max-height: min(72vh, 620px);
	padding: 14px;
	border: 1px solid rgba(255,255,255,0.18);
	border-radius: 24px;
	background:
		radial-gradient(circle at 18% 12%, rgba(var(--novaplayer-hot-rgb), 0.18), transparent 34%),
		linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.044) 48%, rgba(255,255,255,0.085)),
		rgba(var(--novaplayer-bg-1-rgb), 0.52);
	box-shadow:
		0 30px 96px rgba(0,0,0,0.48),
		inset 0 1px 0 rgba(255,255,255,0.28),
		inset 0 -1px 0 rgba(255,255,255,0.06);
	backdrop-filter: blur(32px) saturate(1.65);
	-webkit-backdrop-filter: blur(32px) saturate(1.65);
	filter:
		drop-shadow(1.4px 0 0 rgba(var(--novaplayer-hot-rgb),0.16))
		drop-shadow(-1.4px 0 0 rgba(var(--novaplayer-cyan-rgb),0.13));
	transform: translate(calc(-112% + var(--novaplayer-layout-playlists-x)), -50%) scale(.98);
	transform-origin: left center;
	opacity: 0;
	pointer-events: none;
	transition: transform 260ms cubic-bezier(.16, 1, .3, 1), opacity 180ms ease;
}

#${ROOT_ID}.is-playlists-open .novaplayer__playlists {
	transform: translate(var(--novaplayer-layout-playlists-x), -50%) scale(1);
	opacity: 1;
	pointer-events: auto;
}

#${ROOT_ID}.is-playlists-right .novaplayer__playlists {
	left: auto;
	right: clamp(14px, 1.6vw, 28px);
	transform: translate(calc(112% + var(--novaplayer-layout-playlists-x)), -50%) scale(.98);
	transform-origin: right center;
}

#${ROOT_ID}.is-playlists-right.is-playlists-open .novaplayer__playlists {
	transform: translate(var(--novaplayer-layout-playlists-x), -50%) scale(1);
}

#${ROOT_ID} .novaplayer__playlists-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 2px 4px 12px;
	font-size: 12px;
	font-weight: 900;
	text-transform: uppercase;
	color: rgba(255,255,255,0.8);
}

#${ROOT_ID} .novaplayer__playlists-count {
	color: var(--novaplayer-lime);
}

#${ROOT_ID} .novaplayer__playlists-list {
	display: grid;
	gap: 8px;
	max-height: calc(min(72vh, 620px) - 54px);
	overflow: hidden auto;
	padding-right: 4px;
	scrollbar-width: thin;
	scrollbar-color: rgba(255,255,255,0.22) transparent;
}

#${ROOT_ID} .novaplayer__playlist-item {
	display: grid;
	grid-template-columns: 48px minmax(0, 1fr);
	align-items: center;
	gap: 12px;
	width: 100%;
	min-height: 62px;
	padding: 8px;
	border: 1px solid rgba(255,255,255,0.09);
	border-radius: 17px;
	background:
		linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.026)),
		rgba(255,255,255,0.035);
	text-align: left;
	cursor: pointer;
	transition: transform 180ms cubic-bezier(.16, 1, .3, 1), background 180ms ease, border-color 180ms ease, filter 180ms ease;
	filter:
		drop-shadow(1px 0 0 rgba(var(--novaplayer-hot-rgb),0.12))
		drop-shadow(-1px 0 0 rgba(var(--novaplayer-cyan-rgb),0.1));
}

#${ROOT_ID} .novaplayer__playlist-item:hover,
#${ROOT_ID} .novaplayer__playlist-item:focus-visible {
	transform: translateX(6px);
	border-color: rgba(var(--novaplayer-hot-rgb), 0.42);
	background:
		radial-gradient(circle at 22% 18%, rgba(var(--novaplayer-hot-rgb), 0.18), transparent 36%),
		linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.045));
	outline: none;
}

#${ROOT_ID} .novaplayer__playlist-cover {
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background-size: cover;
	background-position: center;
	box-shadow: 0 12px 28px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.12);
}

#${ROOT_ID} .novaplayer__playlist-copy {
	min-width: 0;
	display: grid;
	gap: 4px;
}

#${ROOT_ID} .novaplayer__playlist-title,
#${ROOT_ID} .novaplayer__playlist-owner {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

#${ROOT_ID} .novaplayer__playlist-title {
	font-size: 13px;
	font-weight: 900;
	color: rgba(255,255,255,0.92);
}

#${ROOT_ID} .novaplayer__playlist-owner,
#${ROOT_ID} .novaplayer__playlists-empty {
	font-size: 11px;
	font-weight: 700;
	color: rgba(255,255,255,0.52);
}

#${ROOT_ID} .novaplayer__playlists-empty {
	padding: 22px 10px;
	text-align: center;
}

#${ROOT_ID} .novaplayer__close {
	position: absolute;
	right: clamp(18px, 2.4vw, 34px);
	top: clamp(16px, 2.1vw, 28px);
	z-index: 36;
	display: grid;
	place-items: center;
	width: 42px;
	height: 42px;
	border: 1px solid rgba(255,255,255,0.24);
	border-radius: 50%;
	background: rgba(8, 6, 12, 0.42);
	backdrop-filter: blur(20px);
	cursor: pointer;
	transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

#${ROOT_ID} .novaplayer__close:hover {
	transform: scale(1.06);
	background: rgba(var(--novaplayer-hot-rgb), 0.18);
	border-color: rgba(255,255,255,0.42);
}

#${ROOT_ID} .novaplayer__settings-toggle {
	position: absolute;
	left: clamp(18px, 2.4vw, 34px);
	top: clamp(16px, 2.1vw, 28px);
	z-index: 36;
	display: grid;
	place-items: center;
	width: 42px;
	height: 42px;
	border: 1px solid rgba(255,255,255,0.2);
	border-radius: 50%;
	background: rgba(8, 6, 12, 0.4);
	backdrop-filter: blur(20px);
	cursor: pointer;
	transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

#${ROOT_ID} .novaplayer__settings-toggle:hover,
#${ROOT_ID} .novaplayer__settings-toggle.is-active {
	transform: scale(1.06);
	background: rgba(var(--novaplayer-cyan-rgb), 0.18);
	border-color: rgba(255,255,255,0.42);
}

#${ROOT_ID} .novaplayer__settings {
	position: absolute;
	left: clamp(70px, 5vw, 92px);
	top: clamp(16px, 2.1vw, 28px);
	z-index: 35;
	width: min(392px, calc(100vw - 96px));
	max-height: min(760px, calc(100vh - 54px));
	display: grid;
	grid-template-rows: auto minmax(0, 1fr);
	gap: 14px;
	padding: 16px;
	border: 1px solid rgba(255,255,255,0.16);
	border-radius: 8px;
	background:
		linear-gradient(145deg, rgba(255,255,255,0.105), rgba(255,255,255,0.035)),
		rgba(8, 7, 11, 0.72);
	box-shadow: 0 28px 80px rgba(0,0,0,0.44), inset 0 1px 0 rgba(255,255,255,0.12);
	backdrop-filter: blur(26px) saturate(1.18);
	opacity: 0;
	transform: translateX(-18px) scale(0.985);
	pointer-events: none;
	transition: opacity 180ms ease, transform 180ms ease;
}

#${ROOT_ID}.is-settings-open .novaplayer__settings {
	opacity: 1;
	transform: translateX(0) scale(1);
	pointer-events: auto;
}

#${ROOT_ID} .novaplayer__settings-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

#${ROOT_ID} .novaplayer__settings-head strong {
	font-size: 14px;
	font-weight: 950;
	letter-spacing: .08em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.92);
}

#${ROOT_ID} .novaplayer__settings-actions {
	display: flex;
	gap: 8px;
}

#${ROOT_ID} .novaplayer__settings-actions button {
	height: 30px;
	padding: 0 10px;
	border: 1px solid rgba(255,255,255,0.16);
	border-radius: 7px;
	background: rgba(255,255,255,0.08);
	color: rgba(255,255,255,0.86);
	font-size: 11px;
	font-weight: 850;
	text-transform: uppercase;
	cursor: pointer;
}

#${ROOT_ID} .novaplayer__settings-body {
	display: grid;
	gap: 14px;
	overflow: auto;
	padding-right: 3px;
}

#${ROOT_ID} .novaplayer__settings-group {
	display: grid;
	gap: 10px;
	padding: 12px;
	border: 1px solid rgba(255,255,255,0.12);
	border-radius: 8px;
	background: rgba(255,255,255,0.055);
}

#${ROOT_ID} .novaplayer__settings-group h3 {
	margin: 0 0 2px;
	font-size: 12px;
	font-weight: 950;
	letter-spacing: .08em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.78);
}

#${ROOT_ID} .novaplayer__setting-row {
	display: grid;
	grid-template-columns: minmax(0, 1fr) 132px;
	align-items: center;
	gap: 12px;
}

#${ROOT_ID} .novaplayer__setting-row span {
	display: grid;
	gap: 2px;
	min-width: 0;
}

#${ROOT_ID} .novaplayer__setting-row strong {
	font-size: 12px;
	font-weight: 850;
	color: rgba(255,255,255,0.9);
}

#${ROOT_ID} .novaplayer__setting-row small {
	font-size: 11px;
	font-weight: 760;
	color: rgba(255,255,255,0.48);
}

#${ROOT_ID} .novaplayer__setting-row input[type="range"] {
	width: 132px;
	accent-color: rgb(var(--novaplayer-hot-rgb));
}

#${ROOT_ID} .novaplayer__setting-row select {
	width: 132px;
	min-width: 0;
	height: 32px;
	padding: 0 28px 0 10px;
	border: 1px solid rgba(255,255,255,0.14);
	border-radius: 10px;
	background:
		linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.035)),
		rgba(8, 6, 12, 0.72);
	color: rgba(255,255,255,0.86);
	font: inherit;
	font-size: 11px;
	font-weight: 800;
	outline: none;
	cursor: pointer;
}

#${ROOT_ID} .novaplayer__setting-row select:hover,
#${ROOT_ID} .novaplayer__setting-row select:focus-visible {
	border-color: rgba(var(--novaplayer-cyan-rgb),0.42);
	box-shadow: 0 0 0 1px rgba(var(--novaplayer-cyan-rgb),0.14);
}

#${ROOT_ID} .novaplayer__setting-row:has(input:disabled) {
	opacity: .42;
}

#${ROOT_ID} .novaplayer__setting-row input:disabled {
	cursor: not-allowed;
}

#${ROOT_ID} .novaplayer__setting-row--toggle input {
	justify-self: end;
	width: 18px;
	height: 18px;
	accent-color: rgb(var(--novaplayer-hot-rgb));
}

#${ROOT_ID} .novaplayer__world {
	position: absolute;
	inset: 0;
	z-index: 10;
	display: block;
	grid-template-columns: minmax(0, 1fr) clamp(500px, 30vw, 620px);
	grid-template-rows: minmax(0, 1fr) clamp(128px, 12vh, 156px);
	gap: clamp(10px, 1.1vw, 18px);
	width: auto;
	height: auto;
	max-height: none;
	padding: clamp(18px, 2vw, 30px) clamp(18px, 2.3vw, 38px) clamp(16px, 2.4vh, 28px);
	transform: none;
	transform-style: flat;
	transform-origin: center center;
	transition: filter 220ms ease;
	overflow: visible;
	will-change: auto;
}

#${ROOT_ID} .novaplayer__space {
	position: absolute;
	inset: 0;
	z-index: 1;
	perspective: none;
	transform: none;
	transform-style: flat;
	transform-origin: 50% 50%;
	pointer-events: none;
	contain: layout style;
	will-change: auto;
}

#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__space {
	inset: 0;
	transform: none;
	will-change: auto;
}

#${ROOT_ID} .novaplayer__art {
	position: absolute;
	inset: 0;
	z-index: 0;
	transform-style: flat;
	transform: none;
	transform-origin: center center;
	pointer-events: none;
	overflow: visible;
	contain: layout style;
	will-change: auto;
}

#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__art {
	transform: none;
	will-change: auto;
}

#${ROOT_ID} .novaplayer__cosmos {
	position: fixed;
	inset: -14%;
	z-index: 0;
	display: block;
	overflow: hidden;
	transform: scale(var(--novaplayer-flow-scale));
	transform-style: preserve-3d;
	background:
		radial-gradient(ellipse at var(--novaplayer-flow-x) var(--novaplayer-flow-y), rgba(var(--novaplayer-hot-rgb), var(--novaplayer-nebula-hot-alpha)) 0%, rgba(var(--novaplayer-hot-rgb), calc(var(--novaplayer-nebula-hot-alpha) * 0.42)) 28%, transparent 58%),
		radial-gradient(ellipse at var(--novaplayer-flow-alt-x) var(--novaplayer-flow-alt-y), rgba(var(--novaplayer-cyan-rgb), var(--novaplayer-nebula-cyan-alpha)) 0%, rgba(var(--novaplayer-cyan-rgb), calc(var(--novaplayer-nebula-cyan-alpha) * 0.46)) 34%, transparent 64%),
		radial-gradient(ellipse at var(--novaplayer-flow-third-x) var(--novaplayer-flow-third-y), rgba(var(--novaplayer-lime-rgb), var(--novaplayer-nebula-lime-alpha)) 0%, rgba(var(--novaplayer-lime-rgb), calc(var(--novaplayer-nebula-lime-alpha) * 0.42)) 36%, transparent 68%),
		conic-gradient(from 34deg at var(--novaplayer-flow-alt-x) var(--novaplayer-flow-y), transparent 0 10%, rgba(255,255,255,0.06) 25%, rgba(var(--novaplayer-cyan-rgb),0.075) 37%, transparent 62% 100%),
		conic-gradient(from 214deg at var(--novaplayer-flow-x) var(--novaplayer-flow-alt-y), transparent 0 17%, rgba(var(--novaplayer-hot-rgb),0.08) 36%, rgba(255,255,255,0.05) 46%, transparent 70% 100%),
		radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.025), transparent 24%),
		radial-gradient(ellipse at 50% 54%, rgba(0,0,0,0.02), rgba(0,0,0,0.72) 82%),
		linear-gradient(135deg, rgba(var(--novaplayer-bg-2-rgb),0.92), rgba(var(--novaplayer-bg-3-rgb),0.82) 45%, rgba(var(--novaplayer-bg-1-rgb),0.98));
	background-blend-mode: screen, screen, screen, screen, screen, screen, multiply, normal;
	opacity: var(--novaplayer-flow-opacity);
	mask-image: none;
	-webkit-mask-image: none;
	animation: none;
	contain: paint style;
	filter: saturate(var(--novaplayer-flow-saturation)) brightness(var(--novaplayer-cosmos-brightness));
	transition: none;
}

#${ROOT_ID} .novaplayer__cosmos-texture {
	position: absolute;
	left: -4%;
	top: -4%;
	z-index: 0;
	display: block;
	width: 108%;
	height: 108%;
	pointer-events: none;
	background: transparent;
	mix-blend-mode: normal;
	mask-image: none;
	-webkit-mask-image: none;
	animation: none;
	will-change: opacity;
}

#${ROOT_ID} .novaplayer__aura {
	display: none;
}

#${ROOT_ID} .novaplayer__aura {
	filter: blur(34px) saturate(1.35) brightness(0.68);
	opacity: 0.48;
	mix-blend-mode: screen;
	animation: novaplayer-aura 9s ease-in-out infinite alternate;
}

#${ROOT_ID} .novaplayer__cover-echo {
	position: absolute;
	left: 50%;
	top: 46%;
	z-index: 1;
	display: none;
	width: min(68vmin, 760px);
	height: min(68vmin, 760px);
	border-radius: clamp(18px, 2.4vmin, 30px);
	background-image: var(--novaplayer-cover);
	background-size: cover;
	background-position: center;
	box-shadow:
		0 34px 120px rgba(0,0,0,0.42),
		0 0 0 1px rgba(255,255,255,0.08),
		0 0 72px rgba(var(--novaplayer-hot-rgb), 0.12);
	filter: saturate(1.04) contrast(1.02) brightness(0.82);
	opacity: 0.54;
	transform:
		translate(calc(-50% + var(--novaplayer-scene-pan-x) + var(--novaplayer-layout-cloud-x)), calc(-50% + var(--novaplayer-scene-pan-y) + var(--novaplayer-layout-cloud-y)))
		rotate(var(--novaplayer-cover-rot-z))
		scale(0.985);
	overflow: hidden;
	will-change: transform, opacity;
}

#${ROOT_ID}.is-cover-backdrop .novaplayer__cover-echo {
	display: block;
}

#${ROOT_ID} .novaplayer__cloud {
	position: absolute;
	left: 50%;
	top: 46%;
	width: min(104vmin, 1120px);
	height: min(104vmin, 1120px);
	z-index: 2;
	display: block;
	opacity: 0.98;
	transform:
		translate(calc(-50% + var(--novaplayer-scene-pan-x) + var(--novaplayer-layout-cloud-x)), calc(-50% + var(--novaplayer-scene-pan-y) + var(--novaplayer-layout-cloud-y)))
		rotate(var(--novaplayer-cover-rot-z))
		scale(1);
	filter: saturate(var(--novaplayer-cloud-saturation)) contrast(1.06) brightness(var(--novaplayer-cloud-brightness));
	will-change: transform, opacity, filter;
}

#${ROOT_ID}.is-cover-backdrop .novaplayer__cloud,
#${ROOT_ID}.hide-cover-art.is-cover-backdrop .novaplayer__cover-echo {
	display: none;
}

#${ROOT_ID} .novaplayer__cloud.is-fallback {
	background-image: var(--novaplayer-cover);
	background-size: cover;
	background-position: center;
	opacity: .28;
	filter: blur(5px) saturate(1.4);
}

#${ROOT_ID} .novaplayer__art::after {
	content: none;
}

#${ROOT_ID} .novaplayer__vignette {
	display: none;
}

#${ROOT_ID} .novaplayer__lyrics {
	position: absolute;
	left: 50%;
	top: 52%;
	z-index: 26;
	width: min(74vw, 1240px);
	max-width: 1240px;
	padding: 0 clamp(8px, 1.6vw, 22px);
	text-align: center;
	text-shadow:
		0 0 18px rgba(var(--novaplayer-hot-rgb), 0.42),
		0 12px 58px rgba(0,0,0,0.78);
	transform:
		translate(calc(-50% + var(--novaplayer-lyrics-pan-x) + var(--novaplayer-layout-lyrics-x)), calc(-50% + var(--novaplayer-lyrics-pan-y) + var(--novaplayer-layout-lyrics-y)))
		rotate(var(--novaplayer-lyrics-rot-z));
	transform-style: flat;
	transform-origin: center center;
	backface-visibility: hidden;
	isolation: isolate;
	contain: layout style;
	will-change: transform;
	transition: opacity 220ms ease, filter 220ms ease;
}

#${ROOT_ID} .novaplayer__lyrics.is-pre-lyrics {
	opacity: 0;
	filter: blur(6px);
	pointer-events: none;
}

#${ROOT_ID} .novaplayer__lyrics.is-hidden {
	display: none;
}

#${ROOT_ID}.novaplayer-debug-no-world3d .novaplayer__lyrics {
	transform: translate(calc(-50% + var(--novaplayer-layout-lyrics-x)), calc(-50% + var(--novaplayer-layout-lyrics-y) + var(--novaplayer-layout-lyric-meta-gap)));
}

#${ROOT_ID} .novaplayer__lyrics::before {
	content: none;
}

#${ROOT_ID} .novaplayer__lyrics::after {
	content: none;
}

#${ROOT_ID} .novaplayer__vocal-role {
	position: relative;
	z-index: 2;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-height: 24px;
	margin-bottom: 6px;
	padding: 4px 10px;
	border: 1px solid rgba(255,255,255,0.18);
	border-radius: 999px;
	background: rgba(255,255,255,0.08);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	font-size: clamp(10px, .78vw, 12px);
	font-weight: 900;
	text-transform: uppercase;
	color: rgba(255,255,255,0.72);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.22);
	filter:
		drop-shadow(1.1px 0 0 rgba(var(--novaplayer-hot-rgb),0.24))
		drop-shadow(-1.1px 0 0 rgba(var(--novaplayer-cyan-rgb),0.18));
}

#${ROOT_ID}.hide-lyric-mode .novaplayer__vocal-role {
	display: none;
}

#${ROOT_ID} .novaplayer__lyric-current {
	min-height: clamp(96px, 13vw, 188px);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
	column-gap: 0.14em;
	row-gap: 0.04em;
	font-size: clamp(var(--novaplayer-lyric-current-min), var(--novaplayer-lyric-current-fluid), var(--novaplayer-lyric-current-max));
	line-height: 1.08;
	font-weight: 900;
	overflow-wrap: anywhere;
	text-wrap: balance;
	color: rgba(255,255,255,0.95);
	position: relative;
	z-index: 2;
	transform-origin: 50% 54%;
	will-change: transform, opacity, filter;
}

#${ROOT_ID}.hide-lyric-current .novaplayer__lyric-current {
	display: none;
	min-height: 0;
}

#${ROOT_ID} .novaplayer__lyric-word {
	display: inline-block;
	--novaplayer-word-progress: 0%;
	position: relative;
	color: rgba(255,255,255,0.36);
	background-image: none;
	background-clip: border-box;
	-webkit-background-clip: border-box;
	-webkit-text-fill-color: currentColor;
	transform: translateY(0) scale(1);
	filter: blur(0);
	text-shadow:
		0 0 calc(4px + 10px * var(--novaplayer-word-glow)) rgba(255,255,255, calc(0.035 * var(--novaplayer-word-glow))),
		0 12px 48px rgba(0,0,0,0.76);
	transition:
		opacity 180ms ease,
		text-shadow 160ms ease,
		transform 220ms cubic-bezier(.16, 1, .3, 1),
		filter 160ms ease;
	will-change: transform, text-shadow;
}

#${ROOT_ID} .novaplayer__lyric-word::after {
	content: attr(data-word-text);
	position: absolute;
	inset: 0;
	pointer-events: none;
	color: rgb(var(--novaplayer-hot-rgb));
	background-image:
		linear-gradient(90deg,
			rgba(var(--novaplayer-hot-rgb), 1) 0%,
			rgba(var(--novaplayer-hot-rgb), .96) 72%,
			rgba(var(--novaplayer-cyan-rgb), .86) 118%);
	background-clip: text;
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	clip-path: inset(0 calc(100% - var(--novaplayer-word-progress)) 0 0);
	opacity: 0;
	text-shadow:
		0 0 calc(7px + 11px * var(--novaplayer-word-glow)) rgba(var(--novaplayer-hot-rgb), calc(0.38 * var(--novaplayer-word-glow))),
		0 0 calc(18px + 16px * var(--novaplayer-word-glow)) rgba(var(--novaplayer-hot-rgb), calc(0.2 * var(--novaplayer-word-glow)));
	transition:
		clip-path 90ms linear,
		opacity 120ms ease;
	will-change: clip-path, opacity;
}

#${ROOT_ID} .novaplayer__lyric-word.is-sung {
	opacity: 0.78;
	background-clip: text;
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-image:
		linear-gradient(90deg,
			rgba(255,255,255,0.96) 0%,
			rgba(255,255,255,0.86) 100%);
	text-shadow:
		0 0 calc(5px + 8px * var(--novaplayer-word-glow)) rgba(255,255,255, calc(0.1 * var(--novaplayer-word-glow))),
		0 12px 46px rgba(0,0,0,0.72);
}

#${ROOT_ID} .novaplayer__lyric-word.is-sung::after {
	opacity: 0;
}

#${ROOT_ID} .novaplayer__lyric-word.is-current {
	opacity: 1;
	color: rgba(255,255,255,0.38);
	-webkit-text-fill-color: currentColor;
	transform: translateY(-0.045em) scale(var(--novaplayer-word-current-scale));
	filter: saturate(1.28);
	text-shadow:
		0 0 calc(5px + 9px * var(--novaplayer-word-glow)) rgba(255,255,255, calc(0.06 * var(--novaplayer-word-glow))),
		0 14px 56px rgba(0,0,0,0.72);
}

#${ROOT_ID} .novaplayer__lyric-word.is-current::after {
	opacity: 1;
}

#${ROOT_ID} .novaplayer__lyrics[data-role="back"] .novaplayer__lyric-word.is-current,
#${ROOT_ID} .novaplayer__lyrics[data-role="back"] .novaplayer__vocal-role {
	color: var(--novaplayer-cyan);
	text-shadow: 0 0 18px rgba(var(--novaplayer-cyan-rgb),0.55);
}

#${ROOT_ID} .novaplayer__lyrics[data-role="response"] .novaplayer__lyric-word.is-current,
#${ROOT_ID} .novaplayer__lyrics[data-role="response"] .novaplayer__vocal-role {
	color: var(--novaplayer-lime);
	text-shadow: 0 0 18px rgba(var(--novaplayer-lime-rgb),0.5);
}

#${ROOT_ID} .novaplayer__lyrics[data-role="instrumental"] .novaplayer__vocal-role {
	color: var(--novaplayer-cyan);
	text-shadow: 0 0 18px rgba(var(--novaplayer-cyan-rgb),0.58);
}

#${ROOT_ID} .novaplayer__lyrics.is-instrumental .novaplayer__lyric-current {
	align-content: center;
	color: rgba(255,255,255,0.9);
}

#${ROOT_ID} .novaplayer__instrumental {
	display: inline-grid;
	justify-items: center;
	gap: 14px;
	font-size: clamp(var(--novaplayer-lyric-side-max), 2.8vw, var(--novaplayer-lyric-current-max));
	line-height: 1;
	color: rgba(255,255,255,0.9);
	text-shadow:
		0 0 24px rgba(var(--novaplayer-cyan-rgb),0.46),
		0 14px 50px rgba(0,0,0,0.76);
}

#${ROOT_ID} .novaplayer__instrumental strong {
	font-size: .42em;
	font-weight: 950;
	letter-spacing: .12em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.68);
}

#${ROOT_ID} .novaplayer__instrumental-meter {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: .2em;
	min-height: .52em;
}

#${ROOT_ID} .novaplayer__instrumental-dot {
	width: .22em;
	height: .22em;
	border-radius: 999px;
	background:
		radial-gradient(circle at 35% 28%, rgba(255,255,255,0.92), rgba(var(--novaplayer-cyan-rgb),0.88) 54%, rgba(var(--novaplayer-hot-rgb),0.6));
	box-shadow:
		0 0 .42em rgba(var(--novaplayer-cyan-rgb),0.54),
		0 .16em .7em rgba(0,0,0,0.44);
	animation: novaplayer-instrumental-dot 1320ms cubic-bezier(.36, 0, .22, 1) infinite;
}

#${ROOT_ID} .novaplayer__instrumental-dot:nth-child(2) {
	animation-delay: 160ms;
}

#${ROOT_ID} .novaplayer__instrumental-dot:nth-child(3) {
	animation-delay: 320ms;
}

#${ROOT_ID} .novaplayer__lyric-prev,
#${ROOT_ID} .novaplayer__lyric-next {
	position: relative;
	z-index: 2;
	min-height: 26px;
	font-size: clamp(var(--novaplayer-lyric-side-min), var(--novaplayer-lyric-side-fluid), var(--novaplayer-lyric-side-max));
	line-height: 1.2;
	font-weight: 700;
	color: rgba(255,255,255,0.34);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	filter: blur(0.8px);
	text-shadow: 0 10px 36px rgba(0,0,0,0.72);
	transition: opacity 220ms ease, filter 220ms ease;
	transform-origin: 50% 50%;
	will-change: transform, opacity, filter;
}

#${ROOT_ID}.hide-lyric-prev .novaplayer__lyric-prev,
#${ROOT_ID}.hide-lyric-next .novaplayer__lyric-next {
	display: none;
	min-height: 0;
}

#${ROOT_ID} .novaplayer__lyric-next {
	color: rgba(var(--novaplayer-cyan-rgb), 0.42);
}

#${ROOT_ID} .novaplayer__lyrics.is-lyric-carousel-running .novaplayer__lyric-prev:not(.novaplayer__lyric-ghost),
#${ROOT_ID} .novaplayer__lyrics.is-lyric-carousel-running .novaplayer__lyric-current:not(.novaplayer__lyric-ghost),
#${ROOT_ID} .novaplayer__lyrics.is-lyric-carousel-running .novaplayer__lyric-next:not(.novaplayer__lyric-ghost) {
	visibility: hidden;
	opacity: 0;
	transition: none;
}

#${ROOT_ID} .novaplayer__lyric-ghost {
	position: absolute;
	z-index: 7;
	margin: 0;
	box-sizing: border-box;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;
	contain: layout paint;
	will-change: transform, opacity, filter;
}

#${ROOT_ID} .novaplayer__lyric-ghost--prev,
#${ROOT_ID} .novaplayer__lyric-ghost--next {
	white-space: nowrap;
}

#${ROOT_ID} .novaplayer__lyric-ghost--current {
	flex-wrap: wrap;
	white-space: normal;
	text-wrap: balance;
}

#${ROOT_ID} .novaplayer__lyric-ghost[data-role="back"] .novaplayer__lyric-word.is-current {
	color: var(--novaplayer-cyan);
	text-shadow: 0 0 18px rgba(var(--novaplayer-cyan-rgb),0.55);
}

#${ROOT_ID} .novaplayer__lyric-ghost[data-role="response"] .novaplayer__lyric-word.is-current {
	color: var(--novaplayer-lime);
	text-shadow: 0 0 18px rgba(var(--novaplayer-lime-rgb),0.5);
}

#${ROOT_ID} .novaplayer__lyric-ghost.is-instrumental.novaplayer__lyric-current {
	align-content: center;
	color: rgba(255,255,255,0.9);
}

#${ROOT_ID} .novaplayer__lyric-meta {
	position: absolute;
	left: 50%;
	top: min(calc(100vh - 132px), calc(46vh + min(42vmin, 390px)));
	z-index: 22;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	max-width: min(74vw, 780px);
	margin: 0;
	padding: 8px 15px;
	border: 1px solid rgba(255,255,255,0.16);
	border-radius: 999px;
	background:
		linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.035)),
		rgba(0,0,0,0.44);
	box-shadow:
		0 18px 54px rgba(0,0,0,0.42),
		inset 0 1px 0 rgba(255,255,255,0.2);
	backdrop-filter: blur(14px) saturate(1.25);
	-webkit-backdrop-filter: blur(14px) saturate(1.25);
	font-size: clamp(12px, .9vw, 14px);
	font-weight: 800;
	text-transform: uppercase;
	color: rgba(255,255,255,0.84);
	text-shadow: 0 10px 32px rgba(0,0,0,0.72);
	transform: translate(calc(-50% + var(--novaplayer-layout-lyrics-x)), calc(-50% + var(--novaplayer-layout-lyrics-y)));
	pointer-events: none;
}

#${ROOT_ID}.hide-lyric-meta .novaplayer__lyric-meta {
	display: none;
}

#${ROOT_ID} .novaplayer__meta-title,
#${ROOT_ID} .novaplayer__meta-artist {
	min-width: 0;
	max-width: min(34vw, 320px);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

#${ROOT_ID} .novaplayer__meta-divider {
	flex: 0 0 36px;
	height: 2px;
	background: linear-gradient(90deg, var(--novaplayer-hot), var(--novaplayer-cyan));
	box-shadow: 0 0 18px rgba(var(--novaplayer-hot-rgb),.45);
}

#${ROOT_ID} .novaplayer__backs {
	position: absolute;
	inset: 0;
	z-index: 14;
	pointer-events: none;
	transform-style: flat;
	transform: none;
	overflow: hidden;
}

#${ROOT_ID}[data-back-vocal-effect="none"] .novaplayer__backs {
	display: none;
}

#${ROOT_ID} .novaplayer__back-vocal {
	position: absolute;
	left: var(--novaplayer-back-x);
	top: var(--novaplayer-back-y);
	max-width: min(34vw, 520px);
	padding: 0;
	border: 0;
	background: transparent;
	box-shadow: none;
	color: rgba(255,255,255,0.72);
	font-size: clamp(var(--novaplayer-back-vocal-min), var(--novaplayer-back-vocal-fluid), var(--novaplayer-back-vocal-max));
	font-weight: 800;
	line-height: 1.12;
	text-wrap: balance;
	mix-blend-mode: screen;
	text-shadow:
		0 0 13px rgba(255,255,255,0.32),
		1.2px 0 0 rgba(var(--novaplayer-hot-rgb),0.34),
		-1.2px 0 0 rgba(var(--novaplayer-cyan-rgb),0.3),
		0 18px 44px rgba(0,0,0,0.82);
	transform:
		translate(-50%, -50%)
		rotate(var(--novaplayer-back-tilt-z))
		scale(.92);
	opacity: 0;
	animation: novaplayer-back-vocal 4200ms cubic-bezier(.16, 1, .3, 1) forwards;
	will-change: transform, opacity, filter;
}

#${ROOT_ID} .novaplayer__back-vocal::before,
#${ROOT_ID} .novaplayer__back-vocal::after {
	content: attr(data-text);
	position: absolute;
	inset: 0;
	pointer-events: none;
	opacity: 0;
}

#${ROOT_ID} .novaplayer__back-vocal[data-effect="echo"] {
	color: rgba(255,255,255,0.62);
	text-shadow:
		0 0 18px rgba(var(--novaplayer-cyan-rgb),0.34),
		0 0 42px rgba(var(--novaplayer-hot-rgb),0.2),
		0 22px 52px rgba(0,0,0,0.82);
	animation: novaplayer-back-vocal-echo 4700ms cubic-bezier(.16, 1, .24, 1) forwards;
}

#${ROOT_ID} .novaplayer__back-vocal[data-effect="echo"]::before {
	color: rgba(var(--novaplayer-hot-rgb),0.42);
	transform: translate(-7px, 4px);
	opacity: .5;
	filter: blur(1.5px);
}

#${ROOT_ID} .novaplayer__back-vocal[data-effect="echo"]::after {
	color: rgba(var(--novaplayer-cyan-rgb),0.38);
	transform: translate(9px, -5px);
	opacity: .46;
	filter: blur(2.5px);
}

#${ROOT_ID} .novaplayer__back-vocal[data-effect="prism"] {
	color: rgba(255,255,255,0.78);
	mix-blend-mode: screen;
	text-shadow:
		1.8px 0 0 rgba(var(--novaplayer-hot-rgb),0.58),
		-1.8px 0 0 rgba(var(--novaplayer-cyan-rgb),0.52),
		0 0 28px rgba(255,255,255,0.18),
		0 18px 46px rgba(0,0,0,0.78);
	animation: novaplayer-back-vocal-prism 3900ms cubic-bezier(.14, .86, .22, 1) forwards;
}

#${ROOT_ID} .novaplayer__back-vocal[data-effect="orbit"] {
	color: rgba(255,255,255,0.68);
	transform-origin: 50% 50%;
	text-shadow:
		0 0 22px rgba(var(--novaplayer-lime-rgb),0.32),
		0 0 38px rgba(var(--novaplayer-cyan-rgb),0.2),
		0 22px 54px rgba(0,0,0,0.82);
	animation: novaplayer-back-vocal-orbit 5200ms cubic-bezier(.18, .78, .18, 1) forwards;
}

#${ROOT_ID}.is-track-changing .novaplayer__lyrics {
	animation: none;
}

#${ROOT_ID} .novaplayer__queue {
	position: absolute;
	z-index: 34;
	right: clamp(14px, 1.8vw, 28px);
	left: auto;
	top: calc(clamp(66px, 8vh, 96px) + var(--novaplayer-layout-queue-y));
	width: clamp(292px, 22vw, 390px);
	height: auto;
	min-height: 0;
	max-height: calc(100vh - 148px);
	margin-left: 0;
	padding: 0;
	transform: translateX(calc(100% - 116px + var(--novaplayer-layout-queue-x)));
	transform-style: flat;
	transform-origin: right top;
	overflow: visible;
	transition: transform 240ms cubic-bezier(.16, 1, .3, 1), filter 220ms ease;
	isolation: isolate;
	pointer-events: auto;
}

#${ROOT_ID} .novaplayer__queue:hover,
#${ROOT_ID} .novaplayer__queue:focus-within {
	transform: translateX(var(--novaplayer-layout-queue-x));
	filter: saturate(1.08) brightness(1.04);
}

#${ROOT_ID}.hide-queue .novaplayer__queue {
	display: none;
}

#${ROOT_ID}.is-queue-left .novaplayer__queue {
	left: clamp(14px, 1.8vw, 28px);
	right: auto;
	transform: translateX(calc(-100% + 116px + var(--novaplayer-layout-queue-x)));
	transform-origin: left top;
}

#${ROOT_ID}.is-queue-left .novaplayer__queue:hover,
#${ROOT_ID}.is-queue-left .novaplayer__queue:focus-within {
	transform: translateX(var(--novaplayer-layout-queue-x));
}

#${ROOT_ID} .novaplayer__queue::before {
	content: none;
}

#${ROOT_ID} .novaplayer__queue-head {
	position: relative;
	z-index: 4;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin: 0 0 10px;
	padding: 6px 11px 6px;
	border: 1px solid rgba(255,255,255,0.2);
	border-radius: 999px;
	background:
		linear-gradient(135deg, rgba(255,255,255,0.19), rgba(255,255,255,0.052)),
		rgba(12, 11, 18, 0.22);
	box-shadow:
		0 16px 40px rgba(0,0,0,0.28),
		inset 0 1px 0 rgba(255,255,255,0.32);
	backdrop-filter: blur(16px) saturate(1.35);
	-webkit-backdrop-filter: blur(16px) saturate(1.35);
	font-size: 11px;
	font-weight: 900;
	text-transform: uppercase;
	color: rgba(255,255,255,0.82);
	transform: none;
	filter:
		drop-shadow(1.2px 0 0 rgba(var(--novaplayer-hot-rgb),0.2))
		drop-shadow(-1.2px 0 0 rgba(var(--novaplayer-cyan-rgb),0.16));
}

#${ROOT_ID} .novaplayer__queue-count {
	color: var(--novaplayer-lime);
}

#${ROOT_ID} .novaplayer__queue-list {
	position: relative;
	display: grid;
	gap: 8px;
	height: auto;
	max-height: min(62vh, 560px);
	min-height: 0;
	overflow: hidden auto;
	padding: 0 4px 4px 0;
	perspective: none;
	perspective-origin: center center;
	transform-style: flat;
	transform: translateX(10px);
	scrollbar-width: thin;
	scrollbar-color: rgba(255,255,255,0.2) transparent;
	mask-image: none;
	-webkit-mask-image: none;
	opacity: 0;
	pointer-events: none;
	transition: opacity 180ms ease, transform 220ms cubic-bezier(.16, 1, .3, 1);
}

#${ROOT_ID}.is-queue-left .novaplayer__queue-list {
	transform: translateX(-10px);
}

#${ROOT_ID} .novaplayer__queue:hover .novaplayer__queue-list,
#${ROOT_ID} .novaplayer__queue:focus-within .novaplayer__queue-list {
	transform: translateX(0);
	opacity: 1;
	pointer-events: auto;
}

#${ROOT_ID} .novaplayer__queue-list::-webkit-scrollbar {
	width: 4px;
}

#${ROOT_ID} .novaplayer__queue-list::-webkit-scrollbar-thumb {
	border-radius: 999px;
	background: rgba(255,255,255,0.2);
}

#${ROOT_ID} .novaplayer__queue-item {
	position: relative;
	left: auto;
	top: auto;
	display: grid;
	grid-template-columns: 42px minmax(0, 1fr) 28px;
	align-items: center;
	gap: 10px;
	width: 100%;
	height: 58px;
	min-height: 58px;
	margin: 0;
	padding: 7px 10px;
	border: 1px solid rgba(255,255,255,0.13);
	border-radius: 14px;
	background:
		linear-gradient(137deg, rgba(255,255,255,0.135), rgba(255,255,255,0.038) 46%, rgba(255,255,255,0.075)),
		rgba(11, 10, 16, 0.26);
	box-shadow:
		0 16px 34px rgba(0,0,0,0.24),
		inset 0 1px 0 rgba(255,255,255,0.26),
		inset 0 -1px 0 rgba(255,255,255,0.045);
	backdrop-filter: blur(16px) saturate(1.35);
	-webkit-backdrop-filter: blur(16px) saturate(1.35);
	color: inherit;
	text-align: left;
	cursor: pointer;
	transform: none;
	transform-origin: 18% center;
	transform-style: flat;
	transition: transform 260ms cubic-bezier(.16, 1, .3, 1), background 220ms ease, border-color 220ms ease, box-shadow 220ms ease, opacity 220ms ease;
	overflow: hidden;
	opacity: var(--novaplayer-depth-opacity);
	filter:
		drop-shadow(1.2px 0 0 rgba(var(--novaplayer-hot-rgb),0.16))
		drop-shadow(-1.2px 0 0 rgba(var(--novaplayer-cyan-rgb),0.12));
	backface-visibility: visible;
	will-change: auto;
}

#${ROOT_ID} .novaplayer__queue-item::before {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	background:
		linear-gradient(112deg, rgba(255,255,255,0.28), transparent 24%, transparent 58%, rgba(255,255,255,0.07)),
		linear-gradient(180deg, rgba(255,255,255,0.08), transparent 42%);
	opacity: 0.55;
	pointer-events: none;
	transform: none;
}

#${ROOT_ID} .novaplayer__queue-item::after {
	content: "";
	position: absolute;
	inset: 8px;
	border-radius: 13px;
	background: linear-gradient(90deg, rgba(255,255,255,0.18), transparent 38%, rgba(255,255,255,0.08));
	opacity: 0.35;
	pointer-events: none;
	transform: scale(.985);
	filter: blur(10px);
}

#${ROOT_ID} .novaplayer__queue-item:hover,
#${ROOT_ID} .novaplayer__queue-item:focus-visible {
	transform: translateX(-5px) scale(1.01);
	background:
		linear-gradient(137deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05) 48%, rgba(255,255,255,0.1)),
		rgba(14, 13, 20, 0.32);
	border-color: rgba(255,255,255,0.34);
	box-shadow:
		0 24px 58px rgba(0,0,0,0.36),
		inset 0 1px 0 rgba(255,255,255,0.36);
	outline: none;
}

#${ROOT_ID}.is-queue-left .novaplayer__queue-item:hover,
#${ROOT_ID}.is-queue-left .novaplayer__queue-item:focus-visible {
	transform: translateX(5px) scale(1.01);
}

#${ROOT_ID} .novaplayer__queue-item.is-next {
	grid-template-columns: 50px minmax(0, 1fr) 28px;
	height: 64px;
	min-height: 64px;
	margin: 0;
	padding: 8px 10px;
	border-radius: 16px;
	background:
		linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.052) 48%, rgba(255,255,255,0.11)),
		rgba(12, 10, 17, 0.32);
	border-color: rgba(255,255,255,0.34);
	box-shadow:
		0 28px 70px rgba(0,0,0,0.42),
		0 0 0 1px rgba(255,255,255,0.04),
		inset 0 1px 0 rgba(255,255,255,0.34),
		inset 0 -1px 0 rgba(255,255,255,0.06);
	transform: none;
}

#${ROOT_ID} .novaplayer__queue-item.is-hidden {
	display: none;
	pointer-events: none;
}

#${ROOT_ID} .novaplayer__queue-item.is-next:hover,
#${ROOT_ID} .novaplayer__queue-item.is-next:focus-visible {
	transform: translateX(-5px) scale(1.012);
}

#${ROOT_ID}.is-queue-left .novaplayer__queue-item.is-next:hover,
#${ROOT_ID}.is-queue-left .novaplayer__queue-item.is-next:focus-visible {
	transform: translateX(5px) scale(1.012);
}

#${ROOT_ID} .novaplayer__queue-cover {
	width: 42px;
	height: 42px;
	border-radius: 10px;
	background-size: cover;
	background-position: center;
	box-shadow:
		0 12px 24px rgba(0,0,0,0.34),
		0 0 0 1px rgba(255,255,255,0.12);
	transform: none;
}

#${ROOT_ID} .novaplayer__queue-item.is-next .novaplayer__queue-cover {
	position: relative;
	left: auto;
	top: auto;
	width: 50px;
	height: 50px;
	border-radius: 12px;
	transform: none;
	box-shadow:
		0 18px 38px rgba(0,0,0,0.42),
		0 0 0 1px rgba(255,255,255,0.22),
		inset 0 1px 0 rgba(255,255,255,0.24);
	z-index: 1;
}

#${ROOT_ID} .novaplayer__queue-copy {
	min-width: 0;
	display: grid;
	gap: 4px;
	transform: none;
}

#${ROOT_ID} .novaplayer__queue-title,
#${ROOT_ID} .novaplayer__queue-artist {
	display: block;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

#${ROOT_ID} .novaplayer__queue-title {
	font-size: 12px;
	font-weight: 900;
	color: rgba(255,255,255,0.93);
}

#${ROOT_ID} .novaplayer__queue-artist {
	font-size: 10px;
	font-weight: 700;
	color: rgba(255,255,255,0.48);
}

#${ROOT_ID} .novaplayer__queue-index {
	font-size: 10px;
	font-weight: 900;
	color: rgba(var(--novaplayer-cyan-rgb),0.62);
	text-align: right;
	transform: none;
}

#${ROOT_ID} .novaplayer__queue-empty {
	padding: 28px 8px;
	text-align: center;
	font-size: 13px;
	font-weight: 800;
	color: rgba(255,255,255,0.5);
}

#${ROOT_ID}.is-track-changing .novaplayer__queue {
	animation: none;
}

#${ROOT_ID} .novaplayer__player-hotzone {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 39;
	display: none;
	height: clamp(96px, 18vh, 180px);
	pointer-events: none;
}

#${ROOT_ID}.is-player-hover-reveal .novaplayer__player-hotzone {
	display: block;
	pointer-events: auto;
}

#${ROOT_ID} .novaplayer__player {
	position: absolute;
	left: 50%;
	right: auto;
	bottom: clamp(16px, 2.4vh, 28px);
	z-index: 40;
	display: grid;
	grid-template-columns: minmax(190px, 0.9fr) auto minmax(260px, 1.35fr) auto;
	align-items: center;
	gap: clamp(10px, 1.4vw, 20px);
	width: min(1220px, calc(100vw - clamp(34px, 6vw, 92px)));
	height: 70px;
	min-height: 70px;
	padding: 8px 12px;
	border: 1px solid rgba(255,255,255,0.18);
	border-radius: 24px;
	background:
		linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.045) 42%, rgba(255,255,255,0.095)),
		radial-gradient(circle at 18% 10%, rgba(255,255,255,0.18), transparent 28%),
		radial-gradient(circle at 75% 95%, rgba(var(--novaplayer-cyan-rgb),0.12), transparent 36%),
		rgba(var(--novaplayer-bg-2-rgb), 0.36);
	box-shadow:
		0 22px 86px rgba(0,0,0,0.36),
		inset 0 1px 0 rgba(255,255,255,0.34),
		inset 0 -1px 0 rgba(255,255,255,0.06);
	backdrop-filter: blur(22px) saturate(1.45);
	-webkit-backdrop-filter: blur(22px) saturate(1.45);
	transform: translateX(calc(-50% + var(--novaplayer-layout-player-x))) translateY(calc(var(--novaplayer-player-anchor-y) + var(--novaplayer-layout-player-y) + var(--novaplayer-player-reveal-y))) scale(var(--novaplayer-player-scale));
	overflow: hidden;
	will-change: transform;
	opacity: 1;
	transition: opacity 180ms ease;
	filter:
		drop-shadow(1.4px 0 0 rgba(var(--novaplayer-hot-rgb),0.18))
		drop-shadow(-1.4px 0 0 rgba(var(--novaplayer-cyan-rgb),0.14));
}

#${ROOT_ID}.is-player-hover-reveal .novaplayer__player {
	--novaplayer-player-reveal-y: 92px;
	opacity: 0;
	pointer-events: none;
}

#${ROOT_ID}.is-player-hover-reveal .novaplayer__player-hotzone:hover + .novaplayer__player,
#${ROOT_ID}.is-player-hover-reveal .novaplayer__player:hover,
#${ROOT_ID}.is-player-hover-reveal .novaplayer__player:focus-within {
	--novaplayer-player-reveal-y: 0px;
	opacity: 1;
	pointer-events: auto;
}

#${ROOT_ID} .novaplayer__player::before {
	content: "";
	position: absolute;
	inset: 0;
	border-radius: inherit;
	padding: 1px;
	background: linear-gradient(125deg, rgba(255,255,255,.58), transparent 28%, rgba(var(--novaplayer-hot-rgb),.14) 55%, rgba(var(--novaplayer-cyan-rgb),.28) 82%, rgba(255,255,255,.28));
	-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
	-webkit-mask-composite: xor;
	mask-composite: exclude;
	pointer-events: none;
}

#${ROOT_ID} .novaplayer__player::after {
	content: "";
	position: absolute;
	left: 12px;
	right: 12px;
	top: 1px;
	height: 1px;
	background: linear-gradient(90deg, transparent, rgba(255,255,255,.64), transparent);
	opacity: .72;
	pointer-events: none;
}

#${ROOT_ID} .novaplayer__now {
	position: relative;
	z-index: 3;
	display: grid;
	grid-template-columns: 48px minmax(0, 1fr);
	align-items: center;
	gap: 11px;
	min-width: 0;
}

#${ROOT_ID}.hide-cover-art .novaplayer__now {
	grid-template-columns: minmax(0, 1fr);
}

#${ROOT_ID}.hide-cover-art .novaplayer__cover {
	display: none;
}

#${ROOT_ID} .novaplayer__cover {
	width: 48px;
	height: 48px;
	border-radius: 13px;
	background-size: cover;
	background-position: center;
	box-shadow: 0 12px 34px rgba(0,0,0,0.52);
}

#${ROOT_ID} .novaplayer__now-copy {
	min-width: 0;
	display: grid;
	gap: 4px;
}

#${ROOT_ID} .novaplayer__now-title,
#${ROOT_ID} .novaplayer__now-artist {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

#${ROOT_ID} .novaplayer__now-title {
	font-size: 14px;
	font-weight: 900;
}

#${ROOT_ID} .novaplayer__now-artist {
	font-size: 11px;
	font-weight: 800;
	color: rgba(255,255,255,0.54);
}

#${ROOT_ID} .novaplayer__control-cluster,
#${ROOT_ID} .novaplayer__side-actions {
	position: relative;
	z-index: 3;
	display: flex;
	align-items: center;
	gap: 5px;
}

#${ROOT_ID} .novaplayer__volume {
	display: grid;
	grid-template-columns: 18px minmax(92px, 128px);
	align-items: center;
	gap: 8px;
	height: 34px;
	padding: 0 10px;
	border-radius: 999px;
	background: rgba(255,255,255,0.045);
	color: rgba(255,255,255,0.72);
}

#${ROOT_ID} .novaplayer__volume-icon {
	display: grid;
	place-items: center;
	width: 18px;
	height: 18px;
}

#${ROOT_ID} .novaplayer__volume-slider {
	--novaplayer-volume: 100%;
	width: 128px;
	height: 16px;
	margin: 0;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background:
		linear-gradient(90deg, var(--novaplayer-hot), var(--novaplayer-cyan)) 0 50% / var(--novaplayer-volume) 4px no-repeat,
		linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.12)) 0 50% / 100% 4px no-repeat;
	accent-color: rgb(var(--novaplayer-hot-rgb));
	cursor: pointer;
	-webkit-appearance: none;
	appearance: none;
}

#${ROOT_ID} .novaplayer__volume-slider::-webkit-slider-thumb {
	width: 12px;
	height: 12px;
	border: 0;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 0 14px rgba(255,255,255,0.62);
	-webkit-appearance: none;
	appearance: none;
}

#${ROOT_ID} .novaplayer__volume-slider::-moz-range-track {
	height: 4px;
	border: 0;
	border-radius: 999px;
	background: rgba(255,255,255,0.18);
}

#${ROOT_ID} .novaplayer__volume-slider::-moz-range-progress {
	height: 4px;
	border-radius: 999px;
	background: linear-gradient(90deg, var(--novaplayer-hot), var(--novaplayer-cyan));
}

#${ROOT_ID} .novaplayer__volume-slider::-moz-range-thumb {
	width: 12px;
	height: 12px;
	border: 0;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 0 14px rgba(255,255,255,0.62);
}

#${ROOT_ID} .novaplayer__icon-button {
	display: grid;
	place-items: center;
	width: 34px;
	height: 34px;
	border: 0;
	border-radius: 50%;
	background: rgba(255,255,255,0.035);
	color: rgba(255,255,255,0.72);
	cursor: pointer;
	transition: transform 220ms cubic-bezier(.16, 1, .3, 1), color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

#${ROOT_ID} .novaplayer__icon-button:hover,
#${ROOT_ID} .novaplayer__icon-button:focus-visible {
	color: #fff;
	background: rgba(255,255,255,0.13);
	transform: translateY(-1px);
	outline: none;
}

#${ROOT_ID} .novaplayer__icon-button.is-active {
	color: var(--novaplayer-hot);
	text-shadow: 0 0 12px rgba(var(--novaplayer-hot-rgb),0.72);
}

#${ROOT_ID} .novaplayer__play {
	width: 48px;
	height: 48px;
	border: 1px solid rgba(255,255,255,0.28);
	color: #fff;
	background:
		linear-gradient(145deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08)),
		rgba(255,255,255,0.08);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.24), 0 0 30px rgba(var(--novaplayer-hot-rgb),0.18);
}

#${ROOT_ID} .novaplayer__play:hover,
#${ROOT_ID} .novaplayer__play.is-playing {
	background:
		linear-gradient(145deg, rgba(255,255,255,0.28), rgba(var(--novaplayer-hot-rgb),0.13)),
		rgba(255,255,255,0.12);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.26), 0 0 36px rgba(var(--novaplayer-hot-rgb),0.28);
}

#${ROOT_ID} .novaplayer__timeline {
	position: relative;
	z-index: 3;
	display: grid;
	grid-template-columns: 42px minmax(130px, 1fr) 42px;
	align-items: center;
	gap: 9px;
	min-width: 0;
}

#${ROOT_ID} .novaplayer__time {
	font-size: 11px;
	font-weight: 900;
	font-variant-numeric: tabular-nums;
	color: rgba(255,255,255,0.6);
	text-align: center;
}

#${ROOT_ID} .novaplayer__progress {
	position: relative;
	display: block;
	width: 100%;
	height: 24px;
	padding: 0;
	border: 0;
	border-radius: 8px;
	background: transparent;
	cursor: pointer;
}

#${ROOT_ID} .novaplayer__progress-rail {
	position: absolute;
	left: 0;
	right: 0;
	top: 50%;
	height: 4px;
	transform: translateY(-50%);
	border-radius: 4px;
	background: rgba(255,255,255,0.18);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.14);
	overflow: visible;
}

#${ROOT_ID} .novaplayer__progress-fill {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	width: 0%;
	border-radius: inherit;
	background: linear-gradient(90deg, var(--novaplayer-hot), rgba(255,255,255,0.92) 54%, var(--novaplayer-cyan));
	box-shadow: 0 0 16px rgba(var(--novaplayer-hot-rgb),0.42), 0 0 20px rgba(var(--novaplayer-cyan-rgb),0.22);
}

#${ROOT_ID} .novaplayer__progress-thumb {
	position: absolute;
	left: 0%;
	top: 50%;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	transform: translate(-50%, -50%);
	background: #fff;
	box-shadow: 0 0 18px rgba(255,255,255,0.64);
}

#${ROOT_ID}.is-track-changing .novaplayer__player {
	animation: none;
}

@keyframes novaplayer-grain {
	0% { transform: translate(0, 0); }
	100% { transform: translate(-4%, 3%); }
}

@keyframes novaplayer-aura {
	0% { transform: translate(-50%, -50%) rotate(-1deg) scale(0.985); opacity: 0.32; }
	100% { transform: translate(-50%, -50%) rotate(1deg) scale(1.025); opacity: 0.44; }
}

@keyframes novaplayer-lidar-sweep {
	0% { transform: translateX(-74%); opacity: 0; }
	12% { opacity: 0.62; }
	58% { opacity: 0.42; }
	100% { transform: translateX(74%); opacity: 0; }
}

@keyframes novaplayer-instrumental-dot {
	0%, 100% {
		opacity: .38;
		transform: translateY(.06em) scale(.76);
	}
	42% {
		opacity: 1;
		transform: translateY(-.12em) scale(1.08);
	}
}

@keyframes novaplayer-back-vocal {
	0% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			rotate(var(--novaplayer-back-tilt-z))
			scale(.88);
		filter: blur(10px);
	}
	18% {
		opacity: .72;
		filter: blur(0);
	}
	72% {
		opacity: .52;
	}
	100% {
		opacity: 0;
		transform:
			translate(-50%, -58%)
			translate(var(--novaplayer-back-drift-x), var(--novaplayer-back-drift-y))
			rotate(var(--novaplayer-back-tilt-z))
			scale(1.06);
		filter: blur(12px);
	}
}

@keyframes novaplayer-back-vocal-echo {
	0% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			translate(0, 12px)
			rotate(var(--novaplayer-back-tilt-z))
			scale(.9);
		filter: blur(12px);
	}
	16% {
		opacity: .74;
		filter: blur(.5px);
	}
	54% {
		opacity: .48;
		transform:
			translate(-50%, -50%)
			translate(var(--novaplayer-back-sweep-x), var(--novaplayer-back-sweep-y))
			rotate(var(--novaplayer-back-tilt-z))
			scale(1.02);
		filter: blur(0);
	}
	100% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			translate(var(--novaplayer-back-drift-x), var(--novaplayer-back-drift-y))
			rotate(var(--novaplayer-back-spin-z))
			scale(1.18);
		filter: blur(16px);
	}
}

@keyframes novaplayer-back-vocal-prism {
	0% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			rotate(var(--novaplayer-back-tilt-z))
			skewX(var(--novaplayer-back-tilt-x))
			scale(.84);
		filter: blur(8px) saturate(1.5);
	}
	14% {
		opacity: .86;
		filter: blur(0) saturate(1.75);
	}
	42% {
		opacity: .68;
		transform:
			translate(-50%, -50%)
			translate(var(--novaplayer-back-sweep-x), 0)
			rotate(var(--novaplayer-back-tilt-z))
			skewX(var(--novaplayer-back-tilt-x))
			scale(1.08);
	}
	100% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			translate(var(--novaplayer-back-drift-x), var(--novaplayer-back-drift-y))
			rotate(var(--novaplayer-back-spin-z))
			skewX(var(--novaplayer-back-tilt-x))
			scale(.98);
		filter: blur(10px) saturate(1.15);
	}
}

@keyframes novaplayer-back-vocal-orbit {
	0% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			perspective(900px)
			rotateX(var(--novaplayer-back-tilt-x))
			rotateY(var(--novaplayer-back-tilt-y))
			rotateZ(var(--novaplayer-back-tilt-z))
			scale(.78);
		filter: blur(10px);
	}
	20% {
		opacity: .72;
		filter: blur(.5px);
	}
	62% {
		opacity: .58;
		transform:
			translate(-50%, -50%)
			translate(var(--novaplayer-back-sweep-x), var(--novaplayer-back-sweep-y))
			perspective(900px)
			rotateX(var(--novaplayer-back-tilt-y))
			rotateY(var(--novaplayer-back-tilt-x))
			rotateZ(var(--novaplayer-back-spin-z))
			scale(1.1);
	}
	100% {
		opacity: 0;
		transform:
			translate(-50%, -50%)
			translate(var(--novaplayer-back-drift-x), var(--novaplayer-back-drift-y))
			perspective(900px)
			rotateX(var(--novaplayer-back-tilt-x))
			rotateY(var(--novaplayer-back-tilt-y))
			rotateZ(var(--novaplayer-back-spin-z))
			scale(1.24);
		filter: blur(14px);
	}
}

@keyframes novaplayer-lyrics-track {
	0% { opacity: 1; transform: translate(-8px, 4px) scale(.996); filter: blur(1px); }
	100% { opacity: 1; transform: translate(0, 0) scale(1); filter: blur(0); }
}

@keyframes novaplayer-queue-track {
	0% { opacity: 1; filter: blur(1px); }
	100% { opacity: 1; filter: blur(0); }
}

@keyframes novaplayer-player-track {
	0% { opacity: 1; filter: blur(1px); }
	100% { opacity: 1; filter: blur(0); }
}

@keyframes novaplayer-nebula-drift {
	0% {
		transform: translate(0, 0) rotateZ(-4deg) scale(1.02);
		filter: blur(30px) saturate(1.12);
		opacity: 0.42;
	}
	100% {
		transform: translate(-3.5%, 2%) rotateZ(8deg) scale(1.08);
		filter: blur(24px) saturate(1.28);
		opacity: 0.58;
	}
}

@keyframes novaplayer-star-drift {
	0% { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
	100% { background-position: 110px -82px, -90px 140px, 160px 120px, -220px -160px, 260px -120px; }
}

@keyframes novaplayer-stars-warp {
	0% {
		transform: translate(0, 0) rotateZ(12deg) scale(1.18);
		filter: blur(0);
		opacity: .32;
	}
	36% {
		transform: translate(0, 0) rotateZ(18deg) scale(1.85);
		filter: blur(4px);
		opacity: .46;
	}
	100% {
		transform: translate(0, 0) rotateZ(-6deg) scale(1.18);
		filter: blur(0);
		opacity: .32;
	}
}

@keyframes novaplayer-nebula-warp {
	0% {
		transform: translate(0, 0) rotateZ(-18deg) scale(1.18);
		filter: blur(32px) saturate(1.08);
		opacity: .22;
	}
	34% {
		transform: translate(0, 0) rotateZ(14deg) scale(1.76);
		filter: blur(22px) saturate(1.28);
		opacity: .4;
	}
	100% {
		transform: translate(0, 0) rotateZ(-12deg) scale(1.18);
		filter: blur(32px) saturate(1.12);
		opacity: .28;
	}
}

@keyframes novaplayer-universe-jump {
	0% {
		opacity: 0;
		transform: scale(0.62);
		filter: blur(10px) saturate(1.05);
	}
	20% {
		opacity: .32;
		transform: scale(1.05);
		filter: blur(4px) saturate(1.22);
	}
	52% {
		opacity: .18;
		transform: scale(1.55);
		filter: blur(3px) saturate(1.28);
	}
	100% {
		opacity: 0;
		transform: scale(2.1);
		filter: blur(14px) saturate(1.05);
	}
}

@media (hover: none) {
	#${ROOT_ID}.is-player-hover-reveal .novaplayer__player-hotzone {
		display: none;
	}

	#${ROOT_ID}.is-player-hover-reveal .novaplayer__player {
		--novaplayer-player-reveal-y: 0px;
		opacity: 1;
		pointer-events: auto;
	}
}

@media (max-width: 1060px) {
	#${ROOT_ID} .novaplayer__world {
		grid-template-columns: 1fr;
		grid-template-rows: minmax(0, 1fr) 152px auto;
		padding-top: 56px;
	}

	#${ROOT_ID} .novaplayer__lyrics {
		left: 50%;
		top: 45%;
		width: min(92vw, 940px);
		transform: translate(calc(-50% + var(--novaplayer-layout-lyrics-x)), calc(-50% + var(--novaplayer-layout-lyrics-y))) rotate(var(--novaplayer-lyrics-rot-z));
	}

	#${ROOT_ID} .novaplayer__lyric-meta {
		top: min(calc(100vh - 146px), calc(45vh + 38vmin));
		max-width: 84vw;
	}

	#${ROOT_ID} .novaplayer__meta-title,
	#${ROOT_ID} .novaplayer__meta-artist {
		max-width: 34vw;
	}

	#${ROOT_ID} .novaplayer__queue {
		left: auto;
		right: 12px;
		top: calc(68px + var(--novaplayer-layout-queue-y));
		width: min(82vw, 360px);
		height: auto;
		max-height: calc(100vh - 148px);
		transform: translateX(calc(100% - 112px + var(--novaplayer-layout-queue-x)));
	}

	#${ROOT_ID} .novaplayer__queue:hover,
	#${ROOT_ID} .novaplayer__queue:focus-within {
		transform: translateX(var(--novaplayer-layout-queue-x));
	}

	#${ROOT_ID}.is-queue-left .novaplayer__queue {
		left: 12px;
		right: auto;
		transform: translateX(calc(-100% + 112px + var(--novaplayer-layout-queue-x)));
	}

	#${ROOT_ID}.is-queue-left .novaplayer__queue:hover,
	#${ROOT_ID}.is-queue-left .novaplayer__queue:focus-within {
		transform: translateX(var(--novaplayer-layout-queue-x));
	}

	#${ROOT_ID} .novaplayer__queue-list {
		overflow: hidden auto;
		height: auto;
		max-height: min(50vh, 420px);
	}

	#${ROOT_ID} .novaplayer__queue-item {
		left: auto;
		top: auto;
		width: 100%;
	}

	#${ROOT_ID} .novaplayer__player {
		grid-row: 3;
		grid-template-columns: minmax(180px, 1fr) auto;
		grid-template-areas:
			"now controls"
			"timeline side";
		height: auto;
		min-height: 108px;
		border-radius: 22px;
	}

	#${ROOT_ID} .novaplayer__now { grid-area: now; }
	#${ROOT_ID} .novaplayer__control-cluster { grid-area: controls; justify-self: end; }
	#${ROOT_ID} .novaplayer__timeline { grid-area: timeline; }
	#${ROOT_ID} .novaplayer__side-actions { grid-area: side; justify-self: end; }
}

@media (max-width: 720px) {
	#${ROOT_ID} .novaplayer__world {
		grid-template-rows: minmax(0, 1fr) auto;
		padding: 64px 14px 14px;
	}

	#${ROOT_ID} .novaplayer__settings-toggle {
		left: 14px;
		top: 14px;
	}

	#${ROOT_ID} .novaplayer__settings {
		left: 14px;
		right: 14px;
		top: 66px;
		width: auto;
		max-height: calc(100vh - 88px);
	}

	#${ROOT_ID} .novaplayer__lyric-current {
		font-size: clamp(var(--novaplayer-lyric-mobile-current-min), var(--novaplayer-lyric-mobile-current-fluid), var(--novaplayer-lyric-mobile-current-max));
		min-height: 150px;
	}

	#${ROOT_ID} .novaplayer__lyrics {
		left: 50%;
		top: 45%;
		width: 96vw;
		transform: translate(calc(-50% + var(--novaplayer-layout-lyrics-x)), calc(-50% + var(--novaplayer-layout-lyrics-y)));
	}

	#${ROOT_ID} .novaplayer__lyric-meta {
		top: auto;
		bottom: 196px;
		max-width: calc(100vw - 34px);
		gap: 8px;
		padding: 7px 11px;
		font-size: 11px;
	}

	#${ROOT_ID} .novaplayer__meta-divider {
		flex-basis: 22px;
	}

	#${ROOT_ID} .novaplayer__meta-title,
	#${ROOT_ID} .novaplayer__meta-artist {
		max-width: 36vw;
	}

	#${ROOT_ID} .novaplayer__back-vocal {
		max-width: 72vw;
		font-size: clamp(var(--novaplayer-back-mobile-min), var(--novaplayer-back-mobile-fluid), var(--novaplayer-back-mobile-max));
	}

	#${ROOT_ID} .novaplayer__queue {
		display: none;
	}

	#${ROOT_ID} .novaplayer__player {
		width: 100%;
		grid-template-columns: 1fr;
		grid-template-areas:
			"now"
			"controls"
			"timeline"
			"side";
		justify-items: stretch;
		height: auto;
		min-height: 164px;
	}

	#${ROOT_ID} .novaplayer__control-cluster,
	#${ROOT_ID} .novaplayer__side-actions {
		justify-content: center;
	}
}

@media (prefers-reduced-motion: reduce) {
	#${ROOT_ID},
	#${ROOT_ID} * {
		animation-duration: 1ms !important;
		transition-duration: 1ms !important;
	}
}
`;
		document.head.append(style);
	}
})();
