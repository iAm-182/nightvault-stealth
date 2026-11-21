// Rendering: the whole look of NIGHTVAULT on one canvas — checkerboard
// marble floor, beveled walls, bushes, crates, lamp pools, raycast vision
// cones, named guards with suspicion arcs, the hooded thief, a darkness
// overlay with pools of light, the HUD, and the menu screens.
// The canvas is 1280x720; the HUD bars sit over the top and bottom wall rows.

import { TILE, COLS, ROWS, VIEW_W, VIEW_H, COLORS, GUARD_VIEW_RANGE } from './config.js';
import { conePolygon } from './vision.js';
import { inBush } from './levels.js';
import { GUARD_ALARM, GUARD_WARY, GUARD_INVESTIGATE, maxSuspicion, anyAlarm } from './guards.js';

const darkCanvas = document.createElement('canvas');
darkCanvas.width = VIEW_W;
darkCanvas.height = VIEW_H;
const darkCtx = darkCanvas.getContext('2d');

function tileCenter(c, r) {
  return { x: (c + 0.5) * TILE, y: (r + 0.5) * TILE };
}

function drawFloor(ctx, world) {
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const key = `${c},${r}`;
      if (world.walls.has(key)) continue;
      ctx.fillStyle = (c + r) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      ctx.strokeStyle = COLORS.floorEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(c * TILE + 0.5, r * TILE + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawBushes(ctx, world) {
  for (const key of world.bushes) {
    const [c, r] = key.split(',').map(Number);
    const { x, y } = tileCenter(c, r);
    ctx.fillStyle = COLORS.bush;
    ctx.fillRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = COLORS.bushLeaf;
    for (const [ox, oy, rad] of [[-9, -7, 9], [8, -8, 8], [-7, 8, 8], [9, 7, 9], [0, 0, 10]]) {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.bushLeaf2;
    for (const [ox, oy, rad] of [[-4, -3, 4], [6, 4, 4], [-8, 6, 3]]) {
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCrates(ctx, world) {
  for (const key of world.crates) {
    const [c, r] = key.split(',').map(Number);
    const x = c * TILE;
    const y = r * TILE;
    ctx.fillStyle = COLORS.crate;
    ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.strokeStyle = COLORS.crateEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 3);
    ctx.lineTo(x + TILE - 3, y + TILE - 3);
    ctx.moveTo(x + TILE - 3, y + 3);
    ctx.lineTo(x + 3, y + TILE - 3);
    ctx.stroke();
  }
}

function drawWalls(ctx, world) {
  for (const key of world.walls) {
    const [c, r] = key.split(',').map(Number);
    const x = c * TILE;
    const y = r * TILE;
    ctx.fillStyle = COLORS.wallFace;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(x, y, TILE, 9);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
  }
}

function drawLamps(ctx, world) {
  for (const lamp of world.lamps) {
    const glow = ctx.createRadialGradient(lamp.x, lamp.y, 4, lamp.x, lamp.y, 78);
    glow.addColorStop(0, COLORS.lampGlow);
    glow.addColorStop(1, 'rgba(255, 196, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lamp.x - 78, lamp.y - 78, 156, 156);
    ctx.fillStyle = COLORS.lampCore;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a6a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawDiamond(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.7, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.7, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.35, y - size * 0.3);
  ctx.lineTo(x, y);
  ctx.lineTo(x - size * 0.35, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawPickups(ctx, world, time) {
  if (world.relic && !world.relic.taken) {
    const bob = Math.sin(time * 2.2) * 3;
    const glow = ctx.createRadialGradient(world.relic.x, world.relic.y + bob, 2, world.relic.x, world.relic.y + bob, 34);
    glow.addColorStop(0, 'rgba(255, 217, 74, 0.5)');
    glow.addColorStop(1, 'rgba(255, 217, 74, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(world.relic.x - 34, world.relic.y + bob - 34, 68, 68);
    drawDiamond(ctx, world.relic.x, world.relic.y + bob, 13, COLORS.relic);
    ctx.fillStyle = '#7a5c00';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RELIC', world.relic.x, world.relic.y + bob + 26);
  }
  for (const gem of world.gems) {
    if (gem.taken) continue;
    const bob = Math.sin(time * 2.6 + gem.x) * 2;
    drawDiamond(ctx, gem.x, gem.y + bob, 8, COLORS.gem);
  }
  const e = world.exit;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(e.x - 20, e.y - 20, 40, 40);
  ctx.strokeStyle = COLORS.exitText;
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x - 20, e.y - 20, 40, 40);
  ctx.fillStyle = COLORS.exitText;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x, e.y + 5);
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('▼', e.x, e.y - 24);
}

function drawCones(ctx, world, guards) {
  for (const guard of guards) {
    const poly = conePolygon(world, guard);
    const fill = guard.state === GUARD_ALARM
      ? COLORS.coneAlarm
      : guard.state === GUARD_WARY || guard.state === GUARD_INVESTIGATE
        ? COLORS.coneWary
        : COLORS.coneCalm;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.coneEdge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuard(ctx, guard, time) {
  const alarming = guard.state === GUARD_ALARM;
  ctx.fillStyle = alarming ? COLORS.guardAlarm : COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = alarming ? '#7d1a12' : COLORS.guardBodyDark;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Facing tick: a little visor showing where the guard looks.
  ctx.strokeStyle = '#dfe9ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 15, guard.y + Math.sin(guard.angle) * 15);
  ctx.stroke();
  // Name tag.
  ctx.fillStyle = '#cdd7ea';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.name, guard.x, guard.y - 20);
  // Suspicion arc around the guard.
  if (guard.suspicion > 4) {
    const frac = guard.suspicion / 100;
    ctx.strokeStyle = frac > 0.7 ? '#ff5040' : frac > 0.4 ? '#ffb040' : '#ffe27a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 18, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }
  // State mark: ? wary, … investigating, ! alarm.
  const mark = alarming ? '!' : guard.state === GUARD_WARY ? '?' : guard.state === GUARD_INVESTIGATE ? '…' : null;
  if (mark) {
    const bounce = Math.sin(time * 6) * 2;
    ctx.fillStyle = alarming ? '#ff5040' : '#ffd27a';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(mark, guard.x, guard.y - 30 + bounce);
  }
}

function drawPlayer(ctx, game) {
  const player = game.player;
  const hidden = inBush(game.world, player.x, player.y);
  const bob = player.moving && !player.sneaking ? Math.sin(game.time * 14) * 1.5 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);
  ctx.rotate(player.angle);
  ctx.fillStyle = hidden ? COLORS.playerCloakDark : COLORS.playerCloak;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -11);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.playerSkin;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerCloak;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  if (hidden) {
    ctx.fillStyle = '#7dff9a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 22);
  }
  // Coin in flight, and the ring where one landed.
  if (player.coinFlight) {
    const coin = player.coinFlight;
    const x = coin.sx + (coin.tx - coin.sx) * coin.t;
    const y = coin.sy + (coin.ty - coin.sy) * coin.t - Math.sin(coin.t * Math.PI) * 26;
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (player.coinLand) {
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.coinLand.x, player.coinLand.y, 12 + (1.2 - player.coinLand.timer) * 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawDarkness(ctx, game) {
  darkCtx.clearRect(0, 0, VIEW_W, VIEW_H);
  darkCtx.fillStyle = 'rgba(5, 7, 14, 0.46)';
  darkCtx.fillRect(0, 0, VIEW_W, VIEW_H);
  darkCtx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, radius, alpha) => {
    const g = darkCtx.createRadialGradient(x, y, radius * 0.25, x, y, radius);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    darkCtx.fillStyle = g;
    darkCtx.beginPath();
    darkCtx.arc(x, y, radius, 0, Math.PI * 2);
    darkCtx.fill();
  };
  hole(game.player.x, game.player.y, 210, 0.95);
  for (const lamp of game.world.lamps) hole(lamp.x, lamp.y, 130, 0.85);
  hole(game.world.exit.x, game.world.exit.y, 90, 0.8);
  if (game.world.relic && !game.world.relic.taken) hole(game.world.relic.x, game.world.relic.y, 80, 0.8);
  darkCtx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCanvas, 0, 0);
}

function drawHud(ctx, game) {
  const level = game.level;
  const seen = maxSuspicion(game.guards);
  const alarm = anyAlarm(game.guards);
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, 40);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NIGHTVAULT', 14, 26);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText(`${level.name}  ·  ${game.levelIndex + 1}/3`, 150, 25);
  // Seen meter.
  const meterX = 470;
  ctx.fillStyle = '#2a2f3d';
  ctx.fillRect(meterX, 13, 170, 14);
  ctx.fillStyle = seen > 70 ? '#ff5040' : seen > 40 ? '#ffb040' : '#7dff9a';
  ctx.fillRect(meterX, 13, 170 * (seen / 100), 14);
  ctx.strokeStyle = '#555d6e';
  ctx.lineWidth = 1;
  ctx.strokeRect(meterX + 0.5, 13.5, 170, 14);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(alarm ? 'SPOTTED!' : seen > 55 ? 'SUSPICIOUS' : seen > 5 ? 'SEEN?' : 'UNSEEN', meterX + 178, 25);
  // Objective and counts, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = game.player.hasRelic ? COLORS.gold : COLORS.hudDim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(game.player.hasRelic ? '◆ RELIC ✓' : '◆ RELIC', 940, 25);
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(`◆ ${game.player.gems}/${game.world.gems.length} gems`, 1030, 25);
  ctx.fillText(`◉ ${game.player.coins} coins`, 1130, 25);
  ctx.fillText(`${Math.floor(game.elapsed)}s`, 1252, 25);
  // Bottom hint bar.
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, VIEW_H - 28, VIEW_W, 28);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  const hint = game.player.hasRelic
    ? 'Relic secured — reach the green EXIT unseen.  WASD move · SHIFT sneak · SPACE sprint · CLICK toss a coin · P pause · M mute'
    : 'WASD move · SHIFT sneak (slow, quiet) · SPACE sprint (fast, loud) · CLICK toss a coin to distract · P pause · M mute';
  ctx.fillText(hint, VIEW_W / 2, VIEW_H - 10);
}

function overlay(ctx, lines, title) {
  ctx.fillStyle = 'rgba(4, 6, 12, 0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 28));
}

export function drawGame(ctx, game) {
  drawFloor(ctx, game.world);
  drawLamps(ctx, game.world);
  drawBushes(ctx, game.world);
  drawCrates(ctx, game.world);
  drawWalls(ctx, game.world);
  drawPickups(ctx, game.world, game.time);
  drawDarkness(ctx, game);
  drawCones(ctx, game.world, game.guards);
  for (const guard of game.guards) drawGuard(ctx, guard, game.time);
  drawPlayer(ctx, game);
  drawHud(ctx, game);

  if (game.screen === 'title') {
    overlay(ctx, [
      'A top-down stealth heist in the Marrowlight Museum — three floors, five wardens, one thief: you.',
      'Steal each floor’s relic, pocket the gems, and reach the green EXIT unseen.',
      'Vision cones are raycast: walls and crates break a guard’s sight. Bushes hide you. Lamp light gives you away faster.',
      'Sneak with SHIFT. Sprint with SPACE — fast, but guards hear it. Click to toss a coin and pull a guard away.',
      'A guard who half-sees you grows suspicious and comes to look. Break line of sight and suspicion drains — you can recover.',
      '',
      'Press ENTER or click to begin',
    ], 'NIGHTVAULT');
  } else if (game.screen === 'paused') {
    overlay(ctx, ['The museum waits. The wardens keep their rounds.', '', 'Press P to resume · R to restart this floor'], 'PAUSED');
  } else if (game.screen === 'caught') {
    overlay(ctx, [
      `Caught by ${game.caughtBy ?? 'a warden'} on ${game.level.name}. The alarm brought the whole floor down on you.`,
      `Relic: ${game.player.hasRelic ? 'secured' : 'not yet taken'} · Gems: ${game.player.gems}`,
      '',
      'Press R to try this floor again',
    ], 'CAUGHT!');
  } else if (game.screen === 'levelclear') {
    overlay(ctx, [
      `${game.level.name} cleared in ${Math.floor(game.elapsed)}s (par ${game.level.par}s) · Gems ${game.player.gems}/${game.world.gems.length}`,
      game.levelIndex + 1 < 3 ? 'The next floor waits below.' : 'That was the last floor.',
      '',
      game.levelIndex + 1 < 3 ? 'Press ENTER for the next floor' : 'Press ENTER to see your haul',
    ], 'UNSEEN!');
  } else if (game.screen === 'victory') {
    overlay(ctx, [
      `Three relics, three floors, never once dragged into the light.`,
      `Total time ${Math.floor(game.totalTime)}s · Gems ${game.totalGems}/${game.totalGemCount} · Coins left ${game.player.coins}`,
      game.totalTime <= 300 ? 'A clean getaway — the museum never knew you were there.' : 'A getaway all the same. The museum will count its losses at dawn.',
      '',
      'Press R to play again',
    ], 'THE VAULT IS YOURS');
  }
}
