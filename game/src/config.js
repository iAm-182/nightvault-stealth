// Shared constants for NIGHTVAULT: tile size, canvas size, movement speeds,
// vision ranges and the tuning of the suspicion system. One place, so the
// rest of the game reads numbers by name instead of by magic value.
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const VIEW_W = COLS * TILE; // 1280
export const VIEW_H = ROWS * TILE; // 720
export const STEP = 1 / 60;

export const PLAYER_RADIUS = 13;
export const PLAYER_WALK_SPEED = 165;
export const PLAYER_SNEAK_SPEED = 95;
export const PLAYER_SPRINT_SPEED = 235;

export const GUARD_RADIUS = 13;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_SUSPICIOUS_SPEED = 105;
export const GUARD_CHASE_SPEED = 178;
export const GUARD_VIEW_RANGE = 235;
export const GUARD_VIEW_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_HEAR_RADIUS = 150;
export const GUARD_CATCH_RADIUS = 27;

export const COIN_TOSS_RANGE = 300;
export const COIN_START_COUNT = 4;

// Suspicion rises 0..100. Rates are per second while the player is seen.
export const SUSPICION_BASE_RATE = 55;
export const SUSPICION_CLOSE_BONUS = 45; // extra when the player is near
export const SUSPICION_LIGHT_MULTIPLIER = 1.6; // standing in a lamp pool
export const SUSPICION_SNEAK_MULTIPLIER = 0.55;
export const SUSPICION_SPRINT_MULTIPLIER = 1.5;
export const SUSPICION_DECAY_RATE = 22; // per second while unseen
export const SUSPICION_ALARM_AT = 100;
export const SUSPICION_WARY_AT = 55; // guard walks to the last seen spot
export const ALARM_LOSE_DELAY = 4.0; // seconds unseen before the chase ends
export const BUSH_HIDE_RADIUS = 46; // inside a bush, seen only this close

export const COLORS = {
  floorA: '#20242e',
  floorB: '#1b1f29',
  floorEdge: '#262b38',
  wallTop: '#4a4438',
  wallFace: '#332f28',
  wallEdge: '#171310',
  bush: '#1f4d2e',
  bushLeaf: '#2f7a44',
  bushLeaf2: '#3f9a55',
  crate: '#6b5233',
  crateEdge: '#3d2f1d',
  lampGlow: 'rgba(255, 196, 90, 0.20)',
  lampCore: '#ffd27a',
  relic: '#ffd94a',
  gem: '#7fd4ff',
  exit: '#2f9e57',
  exitText: '#b8ffcf',
  coneCalm: 'rgba(255, 214, 110, 0.30)',
  coneWary: 'rgba(255, 160, 60, 0.42)',
  coneAlarm: 'rgba(255, 70, 60, 0.50)',
  coneEdge: 'rgba(255, 230, 150, 0.55)',
  playerCloak: '#7a5cff',
  playerCloakDark: '#4a2fb8',
  playerSkin: '#f2c9a0',
  guardBody: '#3e6fb0',
  guardBodyDark: '#274a7d',
  guardAlarm: '#c0392b',
  hudBg: 'rgba(8, 10, 16, 0.88)',
  hudText: '#e8e4d8',
  hudDim: '#9aa3b2',
  gold: '#ffd94a',
};
