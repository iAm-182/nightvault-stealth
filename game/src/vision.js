// Vision: raycast vision cones clipped by walls and crates, and the
// line-of-sight test a guard uses before its suspicion can rise.
// Rays march in small steps; a wall or crate tile stops the ray.

import { GUARD_VIEW_RANGE, GUARD_VIEW_HALF_ANGLE } from './config.js';
import { sightBlockingAt } from './levels.js';

/** Cast one ray from (x, y) along angle; return the distance it travels. */
export function castRay(world, x, y, angle, maxDist) {
  const step = 6;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxDist; d += step) {
    if (sightBlockingAt(world, x + dx * d, y + dy * d)) return d;
  }
  return maxDist;
}

/**
 * The vision cone of a guard as a polygon: the guard's eye plus one point
 * per ray across the cone, each ray clipped by the first wall or crate.
 */
export function conePolygon(world, guard) {
  const rays = 26;
  const points = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rays; i += 1) {
    const a = guard.angle - GUARD_VIEW_HALF_ANGLE + (2 * GUARD_VIEW_HALF_ANGLE * i) / rays;
    const d = castRay(world, guard.x, guard.y, a, GUARD_VIEW_RANGE);
    points.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return points;
}

/** True when no wall or crate stands between (x1, y1) and (x2, y2). */
export function hasLineOfSight(world, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 5));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (sightBlockingAt(world, x1 + dx * t, y1 + dy * t)) return false;
  }
  return true;
}

/** True when the player is inside the guard's cone and in line of sight. */
export function guardCanSee(world, guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VIEW_RANGE) return false;
  if (dist > 4) {
    let diff = Math.atan2(dy, dx) - guard.angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > GUARD_VIEW_HALF_ANGLE) return false;
  }
  return hasLineOfSight(world, guard.x, guard.y, px, py);
}
