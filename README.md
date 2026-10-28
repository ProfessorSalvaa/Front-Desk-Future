# Innovation Orbit + LSHC Experience Arena + Front Desk of the Future (Hyderabad)

Kiosk experience for a 1080 x 1920 portrait display (Proto M2). Open `index.html` in Chrome or Edge.
Double-clicking works. For best results serve it, e.g. in VS Code with the Live Server extension.

## Front Desk of the Future
- The third home entry follows the existing experiences' **five-topic, scene-first layout**: Meet Ava, Service, Inside AI, Guest journey and Your turn. The supplied nine-act narrative is condensed into these topics, with **no more than 40 words in any caption** instead of long scrolling passages.
- Ava is an **interactive 3D orb**, not a humanoid or a photorealistic person: procedural flowing filaments, orbiting particles, a speaking pulse and selectable orbital nodes. Drag the scene to turn it. Normal and Proto styles are supported.
- Proto adds a pearl-finish orb with dark emerald filaments, a soft floor shadow, raised white hotspot cards and clearer depth. Its home entry uses a dedicated two-column layout so the large orb preview cannot shrink or overlap the title and description.
- Orb deformation, glow, particle radius, the circular voice meter and caption waveform follow **measured energy from the actual narration**, sampled at 50 Hz and indexed by the audio playback position. Silent pauses and mute produce zero voice motion; seeking stays synchronized. This uses precomputed local PCM envelopes, not microphone access or a simulated speaking sine wave. Reduced motion keeps these effects static.
- Topic entry now choreographs the scene automatically: the orb unfolds, service nodes appear in sequence, the architecture assembles, rooms rise and the guest follows the arrival route. Visible signal particles connect services and wind through the technology stack; selecting a layer slides it out smoothly.
- Explore 29 glowing hotspots, including all eight technology layers, plus nine voiced Q&A answers. Actions awaken the orb, move a guest through the lobby, assemble the architecture stack layer by layer, and play Ms. Rivera's arrival. The final scene opens a doorway for the host handoff.
- **50 local neural recordings are included**, generated with Kokoro-82M `af_heart` at 0.94 speed. Voice starts on entry and follows hotspot selection. The compact caption matches the spoken words. Voice can be muted, and failures are explicitly reported with a retry control. This is AI narration, not a human recording or a live conversational model.
- Guided tour advances through all 34 introduction/hotspot passages when each recording ends, with a short pause. Manual selection, actions, questions, mute, hidden-tab state and Home stop the tour. Returning Home stops audio and rendering; re-entry resets discovery progress. Three openings avoid consecutive repetition within the page session. Reduced motion disables continuous animation while retaining interactive static views.
- Guest requests are simulations: no microphone, camera, identity collection, bookings, keys, hotel calls or robot commands. Questions are authored answers, not open-ended live AI.
- The final operator-controlled handoff requires an explicit readiness/route confirmation or a human-host alternative. Neither action sends a robot command or pages a team member. An operator must carry out the actual handoff.

### Regenerating Ava's voice
The scripts live in `js/front-desk-content.js`. `js/front-desk-audio.js` embeds PCM recordings so both normal browsers and the VS Code browser can play offline, without `file://` media restrictions or proprietary AAC codecs. This intentionally trades a roughly 33 MiB bundle for reliable offline playback. There is no browser speech-synthesis fallback or network TTS request.

From a development machine with Node.js 22+:
```sh
cd tools/voice
npm ci
npm run generate
```
The first generation downloads public model weights; inference then runs locally. No script content is sent to a synthesis service. Generation writes temporary/ignored WAV masters, a hash/duration manifest in `audio/front-desk/manifest.json`, and the embedded runtime bundle. Unchanged clips are reused when their WAV masters are available. Commit the manifest and bundle together after changing captions. The kiosk itself requires neither npm nor the model.

`npm run pack` rebuilds the embedded audio and its motion envelopes from existing WAV masters without generating speech again.

Browser acceptance: enter all five topics, select every hotspot, drag the scene, try each animated action, mute/unmute, run/stop the guided tour, open all questions, test both operator handoffs and return Home. Check Normal/Proto, portrait and scaled viewports, reduced motion, interrupted audio and hidden-tab behavior. Before a client visit, audition voice quality on the actual device, approve deployment-specific privacy wording, check the physical route and have a human host ready.

## Publish on GitHub Pages
This is a static site: no backend, API keys, build step or paid voice service is required at runtime.

1. Unzip the delivery archive. Put its **contents**, including `index.html`, `.nojekyll`, `assets/`, `audio/`, `css/` and `js/`, at the root of your new repository. Uploading the ZIP itself will not publish a website.
2. Use **GitHub Desktop or Git**, not the browser file uploader: the background video and embedded voice bundle exceed GitHub's 25 MiB browser-upload limit. Each file remains below Git's 100 MiB per-file limit; Git LFS is not needed.
3. Push to your repository's `main` branch. In **Settings > Pages**, choose **Deploy from a branch**, select **main** and **/(root)**, then save.
4. After GitHub finishes deployment, open the Pages URL shown in Settings. It will normally be `https://YOUR-ACCOUNT.github.io/YOUR-REPOSITORY/`. Relative asset paths support repository subdirectories.
5. Test all three experiences, voice, videos and both display modes at the public URL. Keep the site on HTTPS. Fonts use Google Fonts with local system-font fallbacks.

The delivery archive omits `.git`, editor settings, dependencies, model caches and ignored WAV masters. It retains the runtime bundle, documentation, test sources and reproducible voice tooling. The original repository and deployment are not changed or published automatically. **Before making the repository public, confirm permission to publish the organization branding, supplied videos and client-demo content, and retain the licences/credits below.**

## Kiosk UI
- The stage remains fixed at 1080 x 1920. Smaller or landscape windows scale and letterbox the portrait experience; there is no desktop reflow.
- The home page uses Apple-inspired translucent glass, bright edge highlights, and Deloitte-green actions over the supplied background videos. A neutral-black overlay darkens the video by 48-64% without dimming the UI; the start screen has a 32-50% tint behind its centred text. Three aligned experience choices retain integrated scene imagery and large titles.
- The top-left monitor button opens the supplied start-screen video with centred "Innovation Experience Centre" and "Click to start" text. It uses the same 1080 x 1920 portrait dimensions and shared scale factor as the home page, including identical letterboxing. Click anywhere or press Escape to return home.
- BG 1 / BG 2 selects the home background. The adjacent pause/play button controls motion. Selection and manual pause are retained while navigating the experiences, but reset on page reload. All videos are muted, loop inline, and pause when inactive or when the browser tab is hidden. Reduced motion starts the home background paused; the start-screen video plays only on explicit request.
- The header separates the start-screen shortcut and wordmark from a single grouped background control. Icon tooltips appear below the controls; playback warnings occupy a separate line above the footer and do not crowd the header.
- Experience screens retain frosted glass and turquoise actions, defined by `--glass`, `--glass-shadow`, and `--action` in `css/app.css`.
- LSHC is branded as **LSHC Experience Arena**, with the sector label **Life Sciences & Healthcare**. Captions and scripts use the new wording; recorded narration still needs to be regenerated separately.
- The selector uses local previews of the actual 3D scenes. Selecting an experience enters it directly, without a second welcome screen.
- Captions are immediately readable; narration still has its own progress indicator and audio toggle. Home returns to the experience selector.
- Hidden screens are inert. Topic navigation supports Left/Right, Home, and End keys; controls stay fixed rather than following pointer parallax. Topic buttons briefly disable during scene transitions.
- Reduced-motion preferences disable CSS animations and transitions. The existing 3D reduced-motion behavior is retained.

## Display style: Normal or Proto (Proto M2)
The home and start screens have a **Normal | Proto** switch (`js/mode.js`, remembered in the browser). Normal is the original dark design. Proto adds `body.proto`, which `css/hologram.css` and `js/proto-theme.js` use to put everything on white: off-white cards with dark text and layered depth shadows, and the 3D scenes re-rendered on white (normal blending, darker colours, soft floor shadow, no bloom). Proto is a transparent display where dark reads as see-through and light reads as solid. Headlines use one Stix Two Text italic word (class `stix`). Normal mode is untouched by these files. Shadow and tap-target values are estimates (`--hx-float`, `--hx-child`, `--hx-inset`; controls are at least 88 px); check them against the Proto guide on the device.

## Verification
Run the hermetic navigation/media-controller tests and local-source branding checks with Node.js 22 or newer:

```sh
node --test --experimental-test-coverage tests/*.test.cjs
```

Browser checks: open `index.html` in Chrome or Edge, enter both experiences, switch all five topics, select hotspots, toggle narration and anatomy layers, start/stop the guided tour, and return Home. Check at 1080 x 1920 and scaled portrait viewports. Glass performance should also be checked on the target Proto M2 hardware.

Media checks: switch both backgrounds, pause/resume, open the start screen, verify the video loops, then return using Click to start and Escape. Confirm inactive videos pause, selection survives entering an experience, and a video error leaves navigation usable. Check reduced-motion mode and hidden-tab playback.

## Folder
- `index.html` : markup (start screen, Innovation Space, LSHC screens)
- `css/base.css`, `css/app.css` : styles
- `js/innovation-space.js` : the Innovation Space (five 3D topics, recorded narration)
- `js/kiosk-ui.js` : shared keyboard navigation, active-screen focus rules, and home-video lifecycle
- `js/front-desk-content.js` : five topics, short captions, opening variants and Q&A; `js/front-desk-audio.js` : generated offline neural voice clips
- `js/front-desk.js`, `js/front-desk-scene.js`, `css/front-desk.css` : hospitality interactions, recorded-audio lifecycle and locally rendered 3D lobby
- `assets/` : local scene previews, Lucide controls, and supplied videos (`start-screen.mp4`, `bg-1.mp4`, `bg-2.mp4`)
- `js/lshc-experience.js` : start screen + the seven LSHC 3D screens (body, molecule, cell, imaging, globe, genome, journey)
- `js/lshc-content.js` : LSHC titles, taglines and all 35 hotspot captions (safe to edit)
- `js/lshc-data.js` : embedded voice clips, anatomy meshes, land mask (do not hand-edit)
- `js/vendor/` : three.js r128 + post-processing, bundled so it works offline
- `audio/` : Innovation Space narration (mp3)
- `audio/lshc/` : the 33 LSHC voice clips as mp3 files, for reference or replacement
- `LSHC-voiceover-script.md` : first-draft script (the final script is in `js/lshc-content.js`)

## Where to change things
- Screen text: `js/lshc-content.js`. The voice will NOT change with the text, it is recorded audio.
- City name: search `Hyderabad` in `index.html`.
- Screen builders in `js/lshc-experience.js`: `buildBody`, `buildMolecule`, `buildCell`, `buildImaging`, `buildGlobe`, `buildGenome`, `buildJourney`.
- Topic accent colours and the simulated live readouts (decorative values, not real data) are `ACC` and `STATS` in the same file. The Precision Medicine and Patient Journey topics have captions only; record narration clips as `genome-0..5` and `journey-0..5` to add voice.
- Idle attract mode starts after 30 seconds without touch.

## Credits and licences
- Videos: user-supplied `Static Screen.mp4`, `BG 1.mp4`, and `BG2.mp4`, copied into `assets/` without modifying the originals. Ensure appropriate rights before distribution.
- Media control icons: Lucide 0.468.0 (ISC License).
- Unused landscape asset: [Unsplash source image](https://images.unsplash.com/photo-1509316785289-025f5b846b35) (`assets/arena-landscape.jpg`, Unsplash License). Retained locally, but no longer displayed on the home page.
- Human anatomy: BodyParts3D, (c) The Database Center for Life Science, licensed CC BY 4.0
  (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Attribution is retained here rather than in the kiosk footer. Geometry was simplified and quantised; the selector preview is a rendered image of that geometry.
  Prepared via the MIT-licensed `ashemag/human-atlas` packaging.
- LSHC and Front Desk voice: Kokoro-82M neural text-to-speech (Apache 2.0), voice `af_heart`. Front Desk generation uses `kokoro-js` 1.2.1 and `onnx-community/Kokoro-82M-v1.0-ONNX` locally.
- World land outline: Natural Earth via `world-atlas` (public domain).
- three.js r128 (MIT).
