// Guard AI: patrol, suspicion, investigation and chase.
// States: patrol -> wary (walks to the last seen spot) -> alarm (chases the
// player) -> back to patrol when the trail goes cold. Suspicion is the
// recovery chance: it only fills while the guard can actually see the
// player, and it drains whenever the player breaks line of sight.

import {
  GUARD_PATROL_SPEED,
  GUARD_SUSPICIOUS_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_HEAR_RADIUS,
  GUARD_CATCH_RADIUS,
  GUARD_VIEW_RANGE,
  SUSPICION_BASE_RATE,
  SUSPICION_CLOSE_BONUS,
  SUSPICION_LIGHT_MULTIPLIER,
  SUSPICION_SNEAK_MULTIPLIER,
  SUSPICION_SPRINT_MULTIPLIER,
  SUSPICION_DECAY_RATE,
  SUSPICION_ALARM_AT,
  SUSPICION_WARY_AT,
  ALARM_LOSE_DELAY,
  BUSH_HIDE_RADIUS,
} from './config.js';
import { guardCanSee } from './vision.js';
import { solidAt, inBush, inLampLight } from './levels.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_WARY = 'wary';
export const GUARD_ALARM = 'alarm';
export const GUARD_INVESTIGATE = 'investigate';

/** Build a guard from its level definition and spawn point. */
export function createGuard(def, spawn, index) {
  return {
    id: index,
    name: def.name,
    x: spawn.x,
    y: spawn.y,
    angle: -Math.PI / 2,
    patrol: def.patrol.map(([c, r]) => ({ x: (c + 0.5) * 40, y: (r + 0.5) * 40 })),
    patrolIndex: 1,
    waitTimer: 0,
    state: GUARD_PATROL,
    suspicion: 0,
    lastSeen: null,
    lastSeenTimer: 0,
    investigateTarget: null,
    heardTimer: 0,
    stepTimer: 0,
    stepPhase: index * 0.7,
  };
}

/** Move a guard toward (tx, ty) at speed, sliding along walls. */
function moveGuardToward(world, guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = speed * dt;
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  if (!solidAt(world, nx + Math.sign(dx) * 12, guard.y)) guard.x = nx;
  if (!solidAt(world, guard.x, ny + Math.sign(dy) * 12)) guard.y = ny;
  return dist <= step + 2;
}

/** Turn the guard toward an angle, at most turnRate radians per second. */
function turnGuardToward(guard, targetAngle, turnRate, dt) {
  let diff = targetAngle - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  const maxTurn = turnRate * dt;
  guard.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

/**
 * One guard's tick. Returns an event string for the sound system:
 * 'spotted' when suspicion crosses into alarm, 'suspicious' at the wary
 * threshold, 'lost' when a chase gives up, 'step' on a patrol footstep.
 */
export function updateGuard(world, guard, player, dt, events) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const hidden = inBush(world, player.x, player.y) && dist > BUSH_HIDE_RADIUS;
  const seen = !hidden && guardCanSee(world, guard, player.x, player.y);
  let event = null;

  if (seen) {
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lastSeenTimer = 0;
    let rate = SUSPICION_BASE_RATE;
    rate += SUSPICION_CLOSE_BONUS * (1 - dist / GUARD_VIEW_RANGE);
    if (inLampLight(world, player.x, player.y)) rate *= SUSPICION_LIGHT_MULTIPLIER;
    if (player.sneaking) rate *= SUSPICION_SNEAK_MULTIPLIER;
    if (player.sprinting) rate *= SUSPICION_SPRINT_MULTIPLIER;
    const before = guard.suspicion;
    guard.suspicion = Math.min(SUSPICION_ALARM_AT, guard.suspicion + rate * dt);
    if (before < SUSPICION_WARY_AT && guard.suspicion >= SUSPICION_WARY_AT && guard.state === GUARD_PATROL) {
      guard.state = GUARD_WARY;
      event = 'suspicious';
    }
    if (guard.suspicion >= SUSPICION_ALARM_AT && guard.state !== GUARD_ALARM) {
      guard.state = GUARD_ALARM;
      event = 'spotted';
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY_RATE * dt);
    guard.lastSeenTimer += dt;
    if (guard.state === GUARD_WARY && guard.suspicion < SUSPICION_WARY_AT / 2) {
      guard.state = GUARD_PATROL;
    }
  }

  // A tossed coin or a sprinting footstep pulls a patrolling guard over.
  if (guard.state === GUARD_PATROL || guard.state === GUARD_WARY) {
    if (player.noise && player.noise.x !== null) {
      const ndx = player.noise.x - guard.x;
      const ndy = player.noise.y - guard.y;
      if (Math.hypot(ndx, ndy) < GUARD_HEAR_RADIUS) {
        guard.investigateTarget = { x: player.noise.x, y: player.noise.y };
        guard.state = GUARD_INVESTIGATE;
        guard.heardTimer = 0;
      }
    }
  }

  if (guard.state === GUARD_PATROL) {
    if (guard.waitTimer > 0) {
      guard.waitTimer -= dt;
      turnGuardToward(guard, guard.angle + 1.6 * dt, 1.6, dt);
    } else {
      const target = guard.patrol[guard.patrolIndex];
      if (moveGuardToward(world, guard, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
        guard.patrolIndex = (guard.patrolIndex + 1) % guard.patrol.length;
        guard.waitTimer = 1.1;
      }
    }
  } else if (guard.state === GUARD_WARY) {
    if (guard.lastSeen && moveGuardToward(world, guard, guard.lastSeen.x, guard.lastSeen.y, GUARD_SUSPICIOUS_SPEED, dt)) {
      guard.waitTimer = 0.9;
      guard.state = GUARD_PATROL;
      guard.suspicion = Math.max(0, guard.suspicion - 25);
    }
  } else if (guard.state === GUARD_INVESTIGATE) {
    guard.heardTimer += dt;
    if (guard.investigateTarget) {
      if (moveGuardToward(world, guard, guard.investigateTarget.x, guard.investigateTarget.y, GUARD_SUSPICIOUS_SPEED, dt)) {
        guard.investigateTarget = null;
        guard.waitTimer = 1.4;
      }
    }
    if (guard.heardTimer > 6 || (!guard.investigateTarget && guard.waitTimer <= 0)) {
      guard.state = GUARD_PATROL;
      guard.investigateTarget = null;
    }
    if (guard.waitTimer > 0) {
      guard.waitTimer -= dt;
      turnGuardToward(guard, guard.angle + 2.2 * dt, 2.2, dt);
    }
  } else if (guard.state === GUARD_ALARM) {
    // Chase the player's live position while seen; the last seen spot when not.
    const target = seen ? { x: player.x, y: player.y } : guard.lastSeen;
    if (target) moveGuardToward(world, guard, target.x, target.y, GUARD_CHASE_SPEED, dt);
    if (!seen && guard.lastSeenTimer > ALARM_LOSE_DELAY) {
      guard.state = GUARD_WARY;
      guard.suspicion = SUSPICION_WARY_AT;
      event = 'lost';
    }
  }

  // Footstep timing, so the audio can place the guard by sound.
  guard.stepTimer -= dt;
  const moving = guard.state !== GUARD_PATROL || guard.waitTimer <= 0;
  if (moving && guard.stepTimer <= 0) {
    guard.stepTimer = guard.state === GUARD_ALARM ? 0.32 : 0.55;
    guard.stepPhase += 1;
    event = event ?? 'step';
  }

  if (dist < GUARD_CATCH_RADIUS && guard.state === GUARD_ALARM) {
    events.caught = true;
  }
  if (event) events.guardEvents.push({ guard, event });
  return event;
}

/** The highest suspicion among the guards: the HUD's SEEN meter. */
export function maxSuspicion(guards) {
  let max = 0;
  for (const guard of guards) max = Math.max(max, guard.suspicion);
  return max;
}

/** True when any guard is in full alarm. */
export function anyAlarm(guards) {
  return guards.some((guard) => guard.state === GUARD_ALARM);
}
