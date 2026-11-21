// The three floors of the Marrowlight Museum. Each map is 32 columns by 18
// rows of one-character tiles:
//   # wall (blocks movement and sight)   . floor
//   B bush (cover: the player hides inside)   C crate (blocks movement and sight)
//   L lamp (a pool of light; being seen in it fills suspicion faster)
//   P player start   R relic (the main objective)   G loot gem (optional)
//   E exit   1..5 guard spawn points (patrols are defined below the maps)
//
// Guard waypoints are tile coordinates [col, row]; a guard walks the loop,
// pausing at each waypoint to look around.

export const LEVELS = [
  {
    name: 'THE FOYER',
    subtitle: 'Slip past the night watch. Steal the Ember Relic, then reach the green exit unseen.',
    par: 75,
    map: [
      '################################',
      '#P....B.....#......G....#......#',
      '#.....B.....#...........#..1...#',
      '#...........#.....R.....#......#',
      '#..C........#...........#......#',
      '#...........#.....C.....#......#',
      '#..L........#...........#......#',
      '####...######.....#######..#####',
      '#...........#...........#......#',
      '#....2......#....B......#...E..#',
      '#...........#....B......#......#',
      '#..G........#...........#......#',
      '####...######.....#######..#####',
      '#...........#...........#......#',
      '#..B........#....C......#......#',
      '#..B....3...#...........#..G...#',
      '#...........#.....L.....#......#',
      '################################',
    ],
    guards: [
      { name: 'Tomas', patrol: [[27, 2], [27, 6], [29, 6], [29, 2]] },
      { name: 'Greta', patrol: [[5, 9], [10, 9], [10, 11], [5, 11]] },
      { name: 'Silas', patrol: [[8, 15], [11, 15], [11, 16], [5, 16], [5, 15]] },
    ],
  },
  {
    name: 'THE GALLERY OF ECHOES',
    subtitle: 'More eyes, more lamps. The Star of Marrowlight hangs in the middle hall.',
    par: 95,
    map: [
      '################################',
      '#P...C......#....B....#...G....#',
      '#...........#....B....#........#',
      '#..B....1...#........2....#....#',
      '#..B........#....L....#...#..L.#',
      '#.....G.....#.........#...#....#',
      '#####..########...#####...######',
      '#...........#..........#.......#',
      '#....3......#....R.....#..B....#',
      '#...........#..........#..B....#',
      '#..L....C...#....G.....#.......#',
      '#...........#..........#.......#',
      '#####..########...#####...######',
      '#....B......#.....C....#.......#',
      '#....B..4...#..........#...E...#',
      '#...........#....L....#........#',
      '#..G........#..........#...G...#',
      '################################',
    ],
    guards: [
      { name: 'Nadia', patrol: [[8, 3], [8, 5], [4, 5], [4, 3]] },
      { name: 'Oskar', patrol: [[21, 3], [21, 5], [16, 5], [16, 3]] },
      { name: 'Maren', patrol: [[5, 8], [10, 8], [10, 11], [5, 11]] },
      { name: 'Dario', patrol: [[8, 14], [10, 14], [10, 16], [5, 16]] },
    ],
  },
  {
    name: 'THE VAULT OF TIDES',
    subtitle: 'Five wardens, tight halls. Take the Tide Pearl and vanish.',
    par: 120,
    map: [
      '################################',
      '#P....#.....B....#......G......#',
      '#.....#..........#....1........#',
      '#.B...#..C.......#.............#',
      '#.B...#..........#..L....C.....#',
      '#.....#....2.....#.............#',
      '###.####.#########.####.########',
      '#......#..........#.....#......#',
      '#..G...#....B.....#..R..#..B...#',
      '#......#....B.....#.....#..B...#',
      '#..3...#..........#..L..#......#',
      '#......#....C.....#.....#......#',
      '###.####.#########.####.########',
      '#....B....#...4....#....E......#',
      '#....B....#........#...........#',
      '#..G......#..C.....#..5....G...#',
      '#.........#........#...........#',
      '#....L....#........#....L......#',
      '################################',
    ],
    guards: [
      { name: 'Vera', patrol: [[22, 2], [27, 2], [27, 4], [22, 4]] },
      { name: 'Kasper', patrol: [[11, 5], [15, 5], [15, 4], [11, 4]] },
      { name: 'Ines', patrol: [[3, 10], [5, 10], [5, 8], [3, 8]] },
      { name: 'Rurik', patrol: [[14, 13], [17, 13], [17, 15], [11, 15]] },
      { name: 'Mira', patrol: [[22, 15], [27, 15], [27, 17], [22, 17]] },
    ],
  },
];

/** Turn a level's ASCII map into the world the game simulates. */
export function parseLevel(level) {
  const walls = new Set();
  const bushes = new Set();
  const crates = new Set();
  const lamps = [];
  const gems = [];
  let player = null;
  let relic = null;
  let exit = null;
  const guardSpawns = {};
  level.map.forEach((row, r) => {
    for (let c = 0; c < row.length; c += 1) {
      const key = `${c},${r}`;
      const ch = row[c];
      if (ch === '#') walls.add(key);
      else if (ch === 'B') bushes.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 'L') lamps.push({ x: (c + 0.5) * 40, y: (r + 0.5) * 40 });
      else if (ch === 'P') player = { x: (c + 0.5) * 40, y: (r + 0.5) * 40 };
      else if (ch === 'R') relic = { x: (c + 0.5) * 40, y: (r + 0.5) * 40, taken: false };
      else if (ch === 'G') gems.push({ x: (c + 0.5) * 40, y: (r + 0.5) * 40, taken: false });
      else if (ch === 'E') exit = { x: (c + 0.5) * 40, y: (r + 0.5) * 40 };
      else if (ch >= '1' && ch <= '9') guardSpawns[ch] = { x: (c + 0.5) * 40, y: (r + 0.5) * 40 };
    }
  });
  return { walls, bushes, crates, lamps, gems, player, relic, exit, guardSpawns };
}

/** True when the tile at pixel (x, y) blocks movement. */
export function solidAt(world, x, y) {
  const c = Math.floor(x / 40);
  const r = Math.floor(y / 40);
  if (c < 0 || r < 0 || c >= 32 || r >= 18) return true;
  const key = `${c},${r}`;
  return world.walls.has(key) || world.crates.has(key);
}

/** True when the tile at pixel (x, y) blocks a guard's sight. */
export function sightBlockingAt(world, x, y) {
  return solidAt(world, x, y);
}

/** True when the player stands inside a bush tile. */
export function inBush(world, x, y) {
  const c = Math.floor(x / 40);
  const r = Math.floor(y / 40);
  return world.bushes.has(`${c},${r}`);
}

/** True when the player stands inside a lamp's light pool. */
export function inLampLight(world, x, y) {
  for (const lamp of world.lamps) {
    const dx = x - lamp.x;
    const dy = y - lamp.y;
    if (dx * dx + dy * dy < 78 * 78) return true;
  }
  return false;
}
