# NIGHTVAULT — a top-down stealth heist

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/iAm-182/nightvault-stealth/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/iAm-182/nightvault-stealth/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A top-down stealth game built for the [make.fun best stealth game bounty](https://make.fun/c/best-stealth-game-20261121-1759). You are a hooded thief in the Marrowlight Museum: steal each floor's relic, pocket the gems, and reach the green exit unseen.

## The game

- **Three floors** — The Foyer, The Gallery of Echoes, The Vault of Tides — with more wardens, lamps and tighter halls each time.
- **Guards with raycast vision cones** — walls and crates break a guard's sight; cones are clipped by the level geometry.
- **Cover** — hide inside bushes (guards only spot you up close), slip through lamp-lit pools at your peril: being seen in the light fills suspicion faster.
- **Detection with recovery** — suspicion rises only while a guard can see you and drains when you break line of sight. At half suspicion a guard comes to look; at full suspicion the alarm sounds and the guard chases. Break away for a few seconds and the chase gives up.
- **Distraction** — click to toss a coin (limited supply); the clink pulls a nearby guard over to investigate.
- **Movement with trade-offs** — sneak with Shift (slow, quiet, harder to spot), sprint with Space (fast, but guards hear your footsteps).
- **Sound, all synthesized** — footsteps panned by where the guard stands, coin clinks, pickup chimes, alarm stings and a low ambient drone. No audio files.
- **Scoring** — par times per floor, gems collected, total getaway time.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak |
| Space | Sprint (loud) |
| Mouse click | Toss a coin to distract |
| P | Pause |
| R | Restart floor |
| M | Mute |
| Enter | Start / next floor |

## Play it

Open `game/index.html` in desktop Chrome, or serve it:

```
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests: every file the game loads lives under `game/`.

## Layout

- `game/src/config.js` — constants and tuning
- `game/src/levels.js` — the three floor maps and guard patrols
- `game/src/vision.js` — raycast cones and line of sight
- `game/src/guards.js` — guard AI (patrol, suspicion, investigate, chase)
- `game/src/player.js` — movement, sneaking, sprinting, coin tosses, pickups
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized Web Audio sounds
- `game/src/render.js` — canvas drawing, lighting, HUD, menu screens
- `game/src/shots.js` — staged scenes behind `?shot=cover|alarm|title|vault`
- `game/src/main.js` — boot, loop and screen state machine
- `main.ts` — the make.fun hand-in program

## License

MIT — see [LICENSE](LICENSE).
