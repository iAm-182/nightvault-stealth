// Keyboard and mouse input. WASD or arrows move, Shift sneaks, Space
// sprints, a mouse click tosses a coin toward that spot, P pauses,
// R restarts the level, M mutes, Enter starts from a menu screen.
// All input is read as a plain state object the game loop consumes.

export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    sprint: false,
    click: null, // {x, y} in canvas pixels, consumed by the loop
    pressedEnter: false,
    pressedPause: false,
    pressedRestart: false,
    pressedMute: false,
    anyKey: false,
  };

  const keys = new Set();
  function recompute() {
    input.left = keys.has('ArrowLeft') || keys.has('KeyA');
    input.right = keys.has('ArrowRight') || keys.has('KeyD');
    input.up = keys.has('ArrowUp') || keys.has('KeyW');
    input.down = keys.has('ArrowDown') || keys.has('KeyS');
    input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    input.sprint = keys.has('Space');
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    input.anyKey = true;
    keys.add(event.code);
    if (event.code === 'Enter') input.pressedEnter = true;
    if (event.code === 'KeyP') input.pressedPause = true;
    if (event.code === 'KeyR') input.pressedRestart = true;
    if (event.code === 'KeyM') input.pressedMute = true;
    recompute();
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
    recompute();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    recompute();
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
    input.anyKey = true;
  });
  return input;
}

/** Clear the one-shot flags after the loop has read them. */
export function clearTransient(input) {
  input.click = null;
  input.pressedEnter = false;
  input.pressedPause = false;
  input.pressedRestart = false;
  input.pressedMute = false;
  input.anyKey = false;
}
