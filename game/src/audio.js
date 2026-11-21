// Sound: everything is synthesized with the Web Audio API — no audio files.
// Footsteps (soft filtered noise, quieter when sneaking, louder when
// sprinting), a guard's footsteps panned by where the guard stands, a coin
// clink, pickup chimes, an alarm sting, and a low ambient drone that starts
// once the player first interacts with the page.

export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    droneStarted: false,
  };

  function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return audio.ctx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);
    return audio.ctx;
  }

  function noiseBuffer(ctx, seconds) {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  /** A short filtered-noise thud, the base of every footstep. */
  function thud(ctx, when, volume, freq, pan) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, 0.09);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    src.connect(filter).connect(gain).connect(panner).connect(audio.master);
    src.start(when);
    src.stop(when + 0.1);
  }

  /** A short sine tone with a quick decay. */
  function tone(ctx, when, freq, duration, volume, type = 'sine', pan = 0) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(gain).connect(panner).connect(audio.master);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  function startDrone(ctx) {
    if (audio.droneStarted) return;
    audio.droneStarted = true;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 55;
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(gain.gain);
    osc.connect(gain).connect(audio.master);
    osc.start();
    lfo.start();
  }

  return {
    get muted() {
      return audio.muted;
    },
    unlock() {
      const ctx = ensure();
      if (ctx) startDrone(ctx);
    },
    toggleMute() {
      audio.muted = !audio.muted;
      if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
      return audio.muted;
    },
    playerStep(sneaking, sprinting) {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      thud(ctx, ctx.currentTime, sneaking ? 0.05 : sprinting ? 0.22 : 0.12, sneaking ? 300 : 500, 0);
    },
    /** A guard's step, panned left/right by the guard's screen position. */
    guardStep(guard, player) {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const dx = guard.x - player.x;
      const dy = guard.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 420) return;
      const volume = 0.16 * (1 - dist / 420);
      const pan = Math.max(-0.8, Math.min(0.8, dx / 320));
      thud(ctx, ctx.currentTime, volume, 420, pan);
    },
    coinToss() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      tone(ctx, ctx.currentTime, 2400, 0.08, 0.08, 'sine');
    },
    coinLand() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      tone(ctx, t, 1900, 0.12, 0.14, 'triangle');
      tone(ctx, t + 0.07, 2500, 0.14, 0.12, 'triangle');
    },
    gem() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      tone(ctx, t, 880, 0.12, 0.12, 'sine');
      tone(ctx, t + 0.08, 1320, 0.16, 0.12, 'sine');
    },
    relic() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => tone(ctx, t + i * 0.09, freq, 0.22, 0.13, 'sine'));
    },
    suspicious() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      tone(ctx, t, 330, 0.16, 0.12, 'square');
      tone(ctx, t + 0.14, 415, 0.2, 0.1, 'square');
    },
    alarm() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      tone(ctx, t, 220, 0.18, 0.16, 'sawtooth');
      tone(ctx, t + 0.16, 311, 0.18, 0.16, 'sawtooth');
      tone(ctx, t + 0.32, 220, 0.24, 0.16, 'sawtooth');
    },
    lost() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      tone(ctx, t, 392, 0.2, 0.09, 'sine');
      tone(ctx, t + 0.16, 294, 0.26, 0.09, 'sine');
    },
    caught() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      [440, 349, 262, 196].forEach((freq, i) => tone(ctx, t + i * 0.13, freq, 0.24, 0.14, 'sawtooth'));
    },
    levelClear() {
      const ctx = ensure();
      if (!ctx || audio.muted) return;
      const t = ctx.currentTime;
      [523, 659, 784, 1047, 1319].forEach((freq, i) => tone(ctx, t + i * 0.1, freq, 0.3, 0.12, 'sine'));
    },
  };
}
