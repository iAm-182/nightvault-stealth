// The player: a hooded thief. Walks with WASD or arrows, sneaks with Shift
// (slow, quiet, harder to spot), sprints with Space (fast, loud — guards
// hear it), and tosses a coin with a mouse click to pull a guard away.
// Coins are limited; the relic and gems are picked up by walking over them.

import {
  PLAYER_RADIUS,
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  PLAYER_SPRINT_SPEED,
  COIN_TOSS_RANGE,
  COIN_START_COUNT,
} from './config.js';
import { solidAt } from './levels.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    angle: -Math.PI / 2,
    sneaking: false,
    sprinting: false,
    moving: false,
    coins: COIN_START_COUNT,
    gems: 0,
    hasRelic: false,
    stepTimer: 0,
    noise: { x: null, y: null, timer: 0 },
    coinFlight: null,
    coinLand: null,
  };
}

/** Try to move the player by (dx, dy), sliding along walls. */
function tryMove(world, player, dx, dy) {
  const r = PLAYER_RADIUS;
  if (!solidAt(world, player.x + dx + Math.sign(dx) * r, player.y - r + 2) &&
      !solidAt(world, player.x + dx + Math.sign(dx) * r, player.y + r - 2) &&
      !solidAt(world, player.x + dx + Math.sign(dx) * r, player.y)) {
    player.x += dx;
  }
  if (!solidAt(world, player.x - r + 2, player.y + dy + Math.sign(dy) * r) &&
      !solidAt(world, player.x + r - 2, player.y + dy + Math.sign(dy) * r) &&
      !solidAt(world, player.x, player.y + dy + Math.sign(dy) * r)) {
    player.y += dy;
  }
}

export function updatePlayer(world, player, input, dt, events) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  player.sneaking = !!input.sneak;
  player.sprinting = !!input.sprint && (mx !== 0 || my !== 0);
  player.moving = mx !== 0 || my !== 0;

  if (player.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = player.sprinting ? PLAYER_SPRINT_SPEED : player.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    player.angle = Math.atan2(my, mx);
    tryMove(world, player, mx * speed * dt, my * speed * dt);
    player.stepTimer -= dt;
    if (player.stepTimer <= 0) {
      player.stepTimer = player.sprinting ? 0.24 : player.sneaking ? 0.55 : 0.38;
      events.playerEvents.push('step');
    }
    if (player.sprinting) {
      player.noise = { x: player.x, y: player.y, timer: 0.35 };
    }
  }

  if (player.noise.timer > 0) {
    player.noise.timer -= dt;
    if (player.noise.timer <= 0) player.noise = { x: null, y: null, timer: 0 };
  }

  // A tossed coin flies to its target, then clinks and draws a guard.
  if (player.coinFlight) {
    const coin = player.coinFlight;
    coin.t += dt / coin.duration;
    if (coin.t >= 1) {
      player.coinLand = { x: coin.tx, y: coin.ty, timer: 1.2 };
      player.noise = { x: coin.tx, y: coin.ty, timer: 1.2 };
      player.coinFlight = null;
      events.playerEvents.push('coinland');
    }
  }
  if (player.coinLand) {
    player.coinLand.timer -= dt;
    if (player.coinLand.timer <= 0) player.coinLand = null;
  }

  // Pickups: the relic, then gems.
  if (world.relic && !world.relic.taken) {
    const dx = player.x - world.relic.x;
    const dy = player.y - world.relic.y;
    if (dx * dx + dy * dy < 30 * 30) {
      world.relic.taken = true;
      player.hasRelic = true;
      events.playerEvents.push('relic');
    }
  }
  for (const gem of world.gems) {
    if (gem.taken) continue;
    const dx = player.x - gem.x;
    const dy = player.y - gem.y;
    if (dx * dx + dy * dy < 26 * 26) {
      gem.taken = true;
      player.gems += 1;
      events.playerEvents.push('gem');
    }
  }
}

/** Start a coin toss toward (tx, ty) if one is in range and coins remain. */
export function tossCoin(player, tx, ty) {
  if (player.coins <= 0 || player.coinFlight) return false;
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > COIN_TOSS_RANGE || dist < 20) return false;
  player.coins -= 1;
  player.coinFlight = { sx: player.x, sy: player.y, tx, ty, t: 0, duration: 0.45 };
  return true;
}
