// NIGHTVAULT — boot, game loop and screen state machine.
// Screens: title -> play -> paused / caught / levelclear -> victory.
// The loop runs at a fixed 60 Hz step; rendering happens every frame.
// A ?shot=cover|alarm|title|vault query stages a fixed scene for screenshots.

import { STEP, VIEW_W, VIEW_H } from './config.js';
import { parseLevel, LEVELS } from './levels.js';
import { createPlayer, updatePlayer, tossCoin } from './player.js';
import { createGuard, updateGuard, GUARD_ALARM } from './guards.js';
import { createInput, clearTransient } from './input.js';
import { createAudio } from './audio.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);
const audio = createAudio();
const statusEl = document.getElementById('status');

const game = {
  screen: 'title',
  levelIndex: 0,
  level: LEVELS[0],
  world: null,
  player: null,
  guards: [],
  time: 0,
  elapsed: 0,
  totalTime: 0,
  totalGems: 0,
  totalGemCount: LEVELS.reduce((n, lv) => n + (lv.map.join('').match(/G/g) || []).length, 0),
  caughtBy: null,
  hintFlash: 0,
};

export function loadLevel(index) {
  game.levelIndex = index;
  game.level = LEVELS[index];
  game.world = parseLevel(game.level);
  game.player = createPlayer(game.world.player);
  game.guards = game.level.guards.map((def, i) => createGuard(def, game.world.guardSpawns[String(i + 1)], i));
  game.elapsed = 0;
  game.caughtBy = null;
  game.hintFlash = 0;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function startGame() {
  game.totalTime = 0;
  game.totalGems = 0;
  loadLevel(0);
  game.screen = 'play';
  setStatus(`${game.level.name}. Steal the relic and reach the exit unseen.`);
}

function update(dt) {
  game.time += dt;
  if (game.screen !== 'play') return;
  game.elapsed += dt;
  const events = { playerEvents: [], guardEvents: [], caught: false };

  if (input.click) {
    audio.unlock();
    if (tossCoin(game.player, input.click.x, input.click.y)) audio.coinToss();
  }
  updatePlayer(game.world, game.player, input, dt, events);
  for (const guard of game.guards) {
    updateGuard(game.world, guard, game.player, dt, events);
  }

  for (const name of events.playerEvents) {
    if (name === 'step') audio.playerStep(game.player.sneaking, game.player.sprinting);
    else if (name === 'coinland') audio.coinLand();
    else if (name === 'gem') audio.gem();
    else if (name === 'relic') audio.relic();
  }
  for (const { guard, event } of events.guardEvents) {
    if (event === 'step') audio.guardStep(guard, game.player);
    else if (event === 'spotted') audio.alarm();
    else if (event === 'suspicious') audio.suspicious();
    else if (event === 'lost') audio.lost();
  }

  // Exit: only opens once the relic is secured.
  const exit = game.world.exit;
  const edx = game.player.x - exit.x;
  const edy = game.player.y - exit.y;
  if (edx * edx + edy * edy < 26 * 26) {
    if (game.player.hasRelic) {
      game.totalTime += game.elapsed;
      game.totalGems += game.player.gems;
      audio.levelClear();
      if (game.levelIndex + 1 < LEVELS.length) {
        game.screen = 'levelclear';
        setStatus(`${game.level.name} cleared. Press Enter for the next floor.`);
      } else {
        game.screen = 'victory';
        setStatus('The vault is yours. Three relics, never seen.');
      }
    } else {
      game.hintFlash = 1.2;
    }
  }
  if (game.hintFlash > 0) game.hintFlash -= dt;

  if (events.caught) {
    const chaser = game.guards.find((g) => g.state === GUARD_ALARM);
    game.caughtBy = chaser ? chaser.name : 'a warden';
    game.screen = 'caught';
    audio.caught();
    setStatus(`Caught by ${game.caughtBy}. Press R to try this floor again.`);
  }
}

function handleMenus() {
  if (input.pressedMute) audio.toggleMute();
  if (game.screen === 'title') {
    if (input.pressedEnter || input.click) {
      audio.unlock();
      startGame();
    }
  } else if (game.screen === 'play') {
    if (input.pressedPause) {
      game.screen = 'paused';
      setStatus('Paused. Press P to resume.');
    }
  } else if (game.screen === 'paused') {
    if (input.pressedPause) game.screen = 'play';
    if (input.pressedRestart) {
      loadLevel(game.levelIndex);
      game.screen = 'play';
    }
  } else if (game.screen === 'caught') {
    if (input.pressedRestart || input.pressedEnter) {
      loadLevel(game.levelIndex);
      game.screen = 'play';
      setStatus(`${game.level.name}. Steal the relic and reach the exit unseen.`);
    }
  } else if (game.screen === 'levelclear') {
    if (input.pressedEnter || input.click) {
      loadLevel(game.levelIndex + 1);
      game.screen = 'play';
      setStatus(`${game.level.name}. Steal the relic and reach the exit unseen.`);
    }
  } else if (game.screen === 'victory') {
    if (input.pressedRestart || input.pressedEnter) startGame();
  }
  clearTransient(input);
}

const shot = new URLSearchParams(window.location.search).get('shot');
let last = performance.now();
let accumulator = 0;
// A staged screenshot scene never simulates: the frame stays exactly as staged.
const frozen = !!shot;

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  accumulator += elapsed;
  // Update first: it consumes the click (coin toss) before the menus clear
  // the one-shot input flags.
  if (!frozen) {
    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }
  }
  handleMenus();
  drawGame(ctx, game);
  if (!window.__shotReady) window.__shotReady = true;
}

loadLevel(0);
// Exposed for debugging and automated play-tests in the browser console.
window.__game = game;
if (shot) stageShot(game, shot, loadLevel);
requestAnimationFrame(frame);
