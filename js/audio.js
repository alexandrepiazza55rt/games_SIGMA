/*
 * Efeitos sonoros sintetizados com WebAudio — nenhum arquivo de áudio externo.
 */
(function (root) {
  'use strict';

  var ctx = null, master = null, humNodes = null, heartTimer = null, muted = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    master.connect(ctx.destination);
  }

  function noiseBuffer(sec) {
    var len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  function tone(freq, type, dur, peak, when, slideTo) {
    if (!ctx) return;
    var t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env(g, t, 0.005, peak, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur, peak, filterType, freq, when, q) {
    if (!ctx) return;
    var t = ctx.currentTime + (when || 0), src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuffer(dur + 0.1);
    f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    env(g, t, 0.003, peak, dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + dur + 0.1);
  }

  var sfx = {
    click: function () { noise(0.05, 0.5, 'bandpass', 2500, 0, 4); tone(900, 'square', 0.03, 0.08); },
    clunk: function () { tone(110, 'sine', 0.25, 0.7, 0, 50); noise(0.12, 0.5, 'lowpass', 800); },
    lock: function () { noise(0.04, 0.4, 'highpass', 3000); tone(1500, 'triangle', 0.05, 0.15, 0.06); },
    clamp: function () { noise(0.08, 0.5, 'bandpass', 1200, 0, 3); tone(300, 'square', 0.06, 0.1, 0.02); },
    beep: function () { tone(1320, 'sine', 0.12, 0.25); tone(1760, 'sine', 0.12, 0.25, 0.13); },
    detector: function () { for (var i = 0; i < 6; i++) tone(2400, 'square', 0.06, 0.18, i * 0.1); },
    warn: function () { tone(220, 'sawtooth', 0.3, 0.25); tone(180, 'sawtooth', 0.3, 0.25, 0.32); },
    // Rádio HT: chiado de estática que abre o canal, bip de câmbio e cauda de squelch.
    radio: function () {
      if (!ctx) return;
      var t = ctx.currentTime, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuffer(0.75);
      bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.9;
      g.gain.setValueAtTime(0.0001, t);
      for (var i = 0; i < 14; i++) g.gain.setValueAtTime(0.18 + Math.random() * 0.35, t + 0.02 + i * 0.03);
      g.gain.setValueAtTime(0.0001, t + 0.45);
      g.gain.setValueAtTime(0.25, t + 0.62);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.72);
      src.connect(bp); bp.connect(g); g.connect(master); src.start(t); src.stop(t + 0.75);
      tone(1400, 'square', 0.07, 0.12, 0.46);
      tone(1050, 'square', 0.08, 0.12, 0.53);
    },
    infraction: function () { tone(140, 'square', 0.18, 0.25); tone(140, 'square', 0.18, 0.25, 0.22); },
    saved: function () { [523, 659, 784].forEach(function (f, i) { tone(f, 'triangle', 0.18, 0.3, i * 0.09); }); },
    arcSmall: function () { noise(0.6, 0.9, 'lowpass', 3000); tone(60, 'sine', 0.5, 0.9, 0, 30); },
    arc: function () {
      if (!ctx) return;
      noise(2.2, 1.0, 'lowpass', 6000);
      noise(0.9, 1.0, 'bandpass', 180, 0, 0.7);
      tone(48, 'sine', 1.6, 1.0, 0, 22);
      for (var i = 0; i < 18; i++) noise(0.03, 0.7, 'highpass', 4000, 0.1 + Math.random() * 1.8);
    },
    zap: function () {
      if (!ctx) return;
      var t = ctx.currentTime, o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 120;
      lfo.frequency.value = 33; lg.gain.value = 60; lfo.connect(lg); lg.connect(o.frequency);
      env(g, t, 0.01, 0.6, 1.4);
      o.connect(g); g.connect(master); o.start(t); lfo.start(t); o.stop(t + 1.5); lfo.stop(t + 1.5);
      for (var i = 0; i < 10; i++) noise(0.04, 0.6, 'highpass', 5000, Math.random() * 1.2);
    },
    boom: function () { tone(40, 'sine', 2.0, 1.0, 0, 18); noise(1.8, 1.0, 'lowpass', 1200); },
    // "Piiiii" do monitor cardíaco: tom contínuo que só some no fim.
    flatline: function () {
      if (!ctx) return;
      var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1000;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.45, t + 0.03);
      g.gain.setValueAtTime(0.45, t + 3.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 4.3);
    },
    monitor: function () { tone(1000, 'sine', 0.09, 0.3); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 'triangle', 0.35, 0.35, i * 0.12); }); },
    tick: function () { tone(1800, 'sine', 0.02, 0.05); }
  };

  function play(name) {
    if (!ctx || muted || !sfx[name]) return;
    try { sfx[name](); } catch (e) { /* áudio é opcional */ }
  }

  function hum(on) {
    if (!ctx) return;
    if (on && !humNodes) {
      var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.value = 60; o2.type = 'sine'; o2.frequency.value = 120;
      f.type = 'lowpass'; f.frequency.value = 260; g.gain.value = 0.035;
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(master); o1.start(); o2.start();
      humNodes = [o1, o2, g];
    } else if (!on && humNodes) {
      humNodes[0].stop(); humNodes[1].stop(); humNodes = null;
    }
  }

  // Batimento "tum-tum" + bip de monitor. Frequências acima de 80 Hz e um estalo filtrado para
  // que o som apareça também na caixinha do celular. onBeat sincroniza o traçado de ECG da tela.
  function thump(when, peak) {
    tone(150, 'sine', 0.13, peak, when, 70);
    tone(95, 'triangle', 0.16, peak * 0.8, when, 50);
    noise(0.05, peak * 0.5, 'lowpass', 700, when);
  }
  function heartbeat(on, bpm, onBeat) {
    clearInterval(heartTimer); heartTimer = null;
    if (!on) return;
    var beat = function () {
      if (ctx && !muted) {
        thump(0, 0.9);
        thump(0.2, 0.6);
        tone(1000, 'sine', 0.09, 0.22);
      }
      if (onBeat) onBeat();
    };
    beat();
    heartTimer = setInterval(beat, 60000 / (bpm || 90));
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.8;
  }

  root.SEP = root.SEP || {};
  root.SEP.audio = { init: init, play: play, hum: hum, heartbeat: heartbeat, setMuted: setMuted, isMuted: function () { return muted; } };
})(window);
