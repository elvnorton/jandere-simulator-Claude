'use strict';
// Простой синтезатор: музыка-шкатулка и звуковые эффекты на WebAudio.
const AU = (() => {
  let ctx = null, master, mus, sfxG, timer = null, mood = null, step = 0, next = 0, noiseBuf = null;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = .8; master.connect(ctx.destination);
    mus = ctx.createGain(); sfxG = ctx.createGain();
    mus.connect(master); sfxG.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * .5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    vol();
    if (mood) { const m = mood; mood = null; music(m); }
  }
  function vol() {
    if (!ctx) return;
    mus.gain.value = SET.music * .55;
    sfxG.gain.value = SET.sfx * .9;
  }
  function note(f, t, d, type, v, dest, a = .005, det = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f; o.detune.value = det;
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + d + .05);
  }
  function noise(t, d, v, freq = 1200) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + d);
  }

  const _ = null;
  const SONGS = {
    title: { dt: .34, wave: 'sine', bell: 1, dec: 1.6,
      mel: [76,_,75,76, 71,_,74,72, 69,_,_,60, 64,_,69,71, _,_,64,_, 68,_,71,72, _,_,_,_, 64,76,75,76],
      bass: [45, 40, 45, 40] },
    calm: { dt: .3, wave: 'triangle', bell: 1, dec: 1.2,
      mel: [69,_,72,76, 74,_,72,71, 69,_,64,67, 69,_,_,_, 69,_,72,76, 79,_,77,76, 74,_,72,71, 72,_,_,_],
      bass: [45, 41, 48, 43] },
    tense: { dt: .26, wave: 'triangle', dec: .5, detune: 20,
      mel: [57,_,57,58, 57,_,_,_, 57,_,57,60, 58,_,_,_, 57,_,57,58, 57,_,63,_, 62,_,58,_, 57,_,_,_],
      bass: [33, 34, 33, 31] },
    dark: { dt: .42, wave: 'sine', bell: 1, dec: 2.2, detune: 70,
      mel: [69,_,72,76, 74,_,72,71, 69,_,64,67, 69,_,_,_, 68,_,71,75, 74,_,71,70, 68,_,63,66, 68,_,_,_],
      bass: [33, 29, 34, 31] },
    festival: { dt: .2, wave: 'triangle', bell: 1, dec: .6,
      mel: [72,74,76,79, 76,74,72,_, 74,76,79,81, 79,76,74,_, 72,74,76,79, 81,79,76,74, 72,_,69,_, 72,_,_,_],
      bass: [48, 43, 45, 40], bstep: 8 },
    sad: { dt: .4, wave: 'sine', bell: 1, dec: 2,
      mel: [64,_,67,_, 69,_,67,64, 62,_,60,_, 62,_,_,_, 64,_,67,_, 72,_,71,67, 69,_,_,_, _,_,_,_],
      bass: [40, 36, 43, 38] },
    love: { dt: .32, wave: 'triangle', bell: 1, dec: 1.4,
      mel: [72,_,76,79, 77,_,76,74, 72,_,74,76, 74,_,_,_, 72,_,76,79, 84,_,83,79, 81,_,79,77, 76,_,_,_],
      bass: [48, 45, 41, 43] },
  };

  function music(m) {
    if (m === mood && timer) return;
    mood = m; step = 0;
    if (timer) { clearInterval(timer); timer = null; }
    if (!ctx || !m) return;
    next = ctx.currentTime + .15;
    timer = setInterval(sched, 40);
  }
  function sched() {
    const sg = SONGS[mood]; if (!sg) return;
    while (next < ctx.currentTime + .3) { playStep(sg, step, next); step++; next += sg.dt; }
  }
  function playStep(sg, i, t) {
    const m = sg.mel[i % sg.mel.length];
    const det = sg.detune ? (Math.random() - .5) * sg.detune : 0;
    if (m != null) {
      note(mtof(m), t, sg.dec || 1.2, sg.wave || 'triangle', .11, mus, .004, det);
      if (sg.bell) note(mtof(m + 12), t, .7, 'sine', .035, mus, .004, det);
    }
    const bs = sg.bstep || 8;
    if (i % bs === 0) {
      const b = sg.bass[Math.floor(i / bs) % sg.bass.length];
      if (b != null) {
        note(mtof(b), t, sg.dt * bs * 1.1, 'sine', .09, mus, .1);
        note(mtof(b + 7), t, sg.dt * bs * 1.1, 'sine', .035, mus, .15);
      }
    }
  }

  function sfx(name, p) {
    if (!ctx) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'blip': note(p || 520, t, .045, 'square', .018, sfxG, .002); break;
      case 'select': note(880, t, .12, 'sine', .12, sfxG); note(1320, t + .06, .18, 'sine', .08, sfxG); break;
      case 'hover': note(1200, t, .05, 'sine', .03, sfxG); break;
      case 'deny': note(150, t, .2, 'square', .06, sfxG); note(140, t + .08, .2, 'square', .05, sfxG); break;
      case 'heart':
        note(58, t, .28, 'sine', .55, sfxG, .01); note(52, t + .2, .3, 'sine', .42, sfxG, .01); break;
      case 'sting':
        [311, 330, 466, 622, 659].forEach(f => note(f, t, 1.6, 'sawtooth', .035, sfxG, .01));
        note(45, t, 1.8, 'sine', .4, sfxG, .01); break;
      case 'bell':
        [64, 60, 62, 55, 55, 62, 64, 60].forEach((m, k) => {
          note(mtof(m + 12), t + k * .45, 1.6, 'sine', .1, sfxG, .005);
          note(mtof(m + 24), t + k * .45, .8, 'sine', .03, sfxG, .005);
        }); break;
      case 'clue': [84, 88, 91, 96].forEach((m, k) => note(mtof(m), t + k * .09, .9, 'sine', .08, sfxG)); break;
      case 'glitch': noise(t, .25, .25, 2500); note(90, t, .25, 'sawtooth', .1, sfxG); break;
      case 'lock': noise(t, .06, .4, 3000); noise(t + .12, .08, .5, 1800); break;
      case 'page': noise(t, .25, .12, 4000); break;
      case 'win': [72, 76, 79, 84].forEach((m, k) => note(mtof(m), t + k * .1, .6, 'triangle', .1, sfxG)); break;
      case 'fail': [60, 56, 53].forEach((m, k) => note(mtof(m), t + k * .15, .5, 'square', .05, sfxG)); break;
      case 'firework': noise(t, 1.2, .3, 600); note(80, t, .6, 'sine', .3, sfxG, .01); break;
      case 'phone': note(1318, t, .1, 'sine', .1, sfxG); note(1568, t + .12, .15, 'sine', .1, sfxG); break;
      case 'door': note(400, t, .3, 'sine', .08, sfxG); note(320, t + .25, .5, 'sine', .08, sfxG); break;
    }
  }
  return { init, vol, music, sfx };
})();
