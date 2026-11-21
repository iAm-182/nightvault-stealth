// Screenshot staging behind ?shot=cover|alarm|title|vault.
// Each scene is a real render of the game's own state: the level is loaded
// for real, then the player and a few guards are placed where a short game
// would put them, with the suspicion and alarm states a player would see.
// Nothing here is drawn by hand — the renderer draws the live game.

import { GUARD_ALARM, GUARD_WARY } from './guards.js';

function placeGuard(game, index, col, row, angle, state, suspicion) {
  const guard = game.guards[index];
  guard.x = (col + 0.5) * 40;
  guard.y = (row + 0.5) * 40;
  guard.angle = angle;
  guard.state = state;
  guard.suspicion = suspicion;
  guard.lastSeen = { x: game.player.x, y: game.player.y };
  guard.lastSeenTimer = 0;
  return guard;
}

function placePlayer(game, col, row, sneaking) {
  game.player.x = (col + 0.5) * 40;
  game.player.y = (row + 0.5) * 40;
  game.player.sneaking = sneaking;
}

/**
 * Stage the named scene and return the screen to show. Names: cover, alarm,
 * title, vault; anything else is the title scene.
 */
export function stageShot(game, name, loadLevel) {
  if (name === 'title') {
    loadLevel(0);
    game.screen = 'title';
    return;
  }
  if (name === 'alarm') {
    loadLevel(1);
    game.screen = 'play';
    game.elapsed = 61;
    game.player.hasRelic = true;
    game.world.relic.taken = true;
    game.player.gems = 2;
    game.world.gems[0].taken = true;
    game.world.gems[1].taken = true;
    game.player.coins = 2;
    placePlayer(game, 24, 14, false);
    game.player.angle = Math.PI;
    placeGuard(game, 2, 19, 14, 0, GUARD_ALARM, 100);
    placeGuard(game, 3, 9, 14, -Math.PI / 2, GUARD_WARY, 68);
    placeGuard(game, 0, 8, 5, Math.PI / 2, 'patrol', 22);
    return;
  }
  if (name === 'vault') {
    loadLevel(2);
    game.screen = 'play';
    game.elapsed = 148;
    game.player.gems = 3;
    game.world.gems[0].taken = true;
    game.world.gems[1].taken = true;
    game.world.gems[2].taken = true;
    game.player.coins = 1;
    placePlayer(game, 19, 9, true);
    game.player.angle = 0;
    placeGuard(game, 0, 24, 2, Math.PI, 'patrol', 0);
    placeGuard(game, 1, 13, 4, 0, GUARD_WARY, 47);
    placeGuard(game, 4, 24, 15, -Math.PI / 2, 'patrol', 12);
    return;
  }
  // cover (default): the Foyer, the thief hidden in a bush while a warden
  // sweeps his cone across her, the relic glowing two rooms away.
  loadLevel(0);
  game.screen = 'play';
  game.elapsed = 23;
  game.player.gems = 1;
  game.world.gems[0].taken = true;
  game.player.coins = 3;
  placePlayer(game, 17, 9, true);
  game.player.angle = Math.PI / 2;
  placeGuard(game, 0, 20, 8, Math.atan2(1, -3), GUARD_WARY, 62);
  placeGuard(game, 1, 8, 9, 0, 'patrol', 0);
  placeGuard(game, 2, 8, 15, -Math.PI / 2, 'patrol', 8);
}
