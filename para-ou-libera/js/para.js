/*
 * Interface do "Para ou Libera": cartas arrastáveis, pavio, combo, vidas e revisão no fim.
 */
(function () {
  'use strict';
  var PL = window.PL, A = window.SEP.audio;
  var $ = function (s) { return document.querySelector(s); };

  var round = null, raf = null, lastT = 0, cardStart = 0, paused = false, busy = false, drag = null;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo(0, 0);
  }
  function loadBest() { try { return JSON.parse(localStorage.getItem('pl-best') || 'null'); } catch (e) { return null; } }
  function saveBest(b) { try { localStorage.setItem('pl-best', JSON.stringify(b)); } catch (e) { /* sem storage */ } }
  function helmets(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '🪖' : '💀'; return s; }
  function label(ans) { return ans === 'para' ? 'PARA' : 'LIBERA'; }

  // ---------------------------------------------------------------- menu

  function renderMenu() {
    var b = loadBest();
    $('#pl-best').innerHTML = b ? '<span>Recorde: ' + b.score + ' pts</span><span class="rank-name">' + esc(PL.rank(b.score)) + '</span><span>' + b.acc + '% de acerto</span>' : '';
  }

  // ---------------------------------------------------------------- jogo

  function start() {
    A.init();
    round = new PL.Round(PL.cards);
    paused = false; busy = false;
    $('#last').textContent = '';
    $('#last').className = 'last';
    show('pl-game');
    renderCard(true);
    updateHud();
    lastT = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function renderCard(first) {
    var c = round.current(), el = $('#card');
    el.className = 'pl-card dragging';
    el.style.transform = '';
    el.innerHTML = '<div class="stamp para">PARA</div><div class="stamp libera">LIBERA</div>' +
      '<div class="c-place">' + esc(c.place) + '</div>' +
      '<div class="c-scene" aria-hidden="true">' + esc(c.scene) + '</div>' +
      '<h2 class="c-title">' + esc(c.title) + '</h2>' +
      '<p class="c-text">' + esc(c.text) + '</p>' +
      '<div class="c-chips">' + c.chips.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<div class="c-q">' + esc(c.q) + '</div>';
    void el.offsetWidth;
    el.className = 'pl-card enter';
    document.body.classList.remove('tint-para', 'tint-libera');
    cardStart = performance.now();
    busy = false;
    if (!first) A.play('click');
  }

  function loop(t) {
    var dt = (t - lastT) / 1000;
    lastT = t;
    if (!paused && !busy) {
      round.tick(dt);
      var left = round.fuse() - (t - cardStart) / 1000;
      $('#fuse').style.transform = 'scaleX(' + Math.max(0, left / round.fuse()) + ')';
      if (left <= 0) hesitate();
    }
    updateHud();
    if (round.over() && !paused && !busy) { end(); return; }
    raf = requestAnimationFrame(loop);
  }

  function updateHud() {
    var tm = $('#h-time');
    tm.textContent = fmt(round.time);
    tm.classList.toggle('low', round.time <= 10);
    $('#h-lives').textContent = helmets(round.lives);
    $('#h-score').textContent = round.score;
    var m = round.multiplier();
    $('#h-combo').textContent = round.combo >= 3 ? '🔥×' + m : '';
  }

  function float(text, bad) {
    var f = document.createElement('div');
    f.className = 'float' + (bad ? ' bad' : '');
    f.textContent = text;
    $('#floats').appendChild(f);
    setTimeout(function () { f.remove(); }, 1000);
  }

  function flash(kind) {
    var f = $('#flash');
    f.className = 'pl-flash';
    void f.offsetWidth;
    f.className = 'pl-flash ' + kind;
  }

  function decide(choice) {
    if (!round || paused || busy || round.over()) return;
    busy = true;
    var ms = performance.now() - cardStart;
    var el = $('#card');
    el.classList.remove('dragging');
    el.style.transform = '';
    el.classList.add(choice === 'para' ? 'fly-left' : 'fly-right');
    var prevMult = round.multiplier();
    var r = round.answer(choice, ms);
    if (r.correct) {
      A.play('beep');
      flash('ok');
      float('+' + r.points + (r.mult > 1 ? ' ×' + r.mult : '') + (r.quick ? ' ⚡' : ''));
      if (r.mult > prevMult) { var hc = $('#h-combo'); hc.classList.remove('pop'); void hc.offsetWidth; hc.classList.add('pop'); A.play('saved'); }
      setLast('ok', '✔ <b>' + label(r.card.ans) + '</b> — ' + esc(r.card.why));
      setTimeout(function () { renderCard(); }, 230);
      return;
    }
    setTimeout(function () { verdict(r); }, 200);
  }

  function setLast(cls, html) {
    var l = $('#last');
    l.className = 'last ' + cls;
    l.innerHTML = html;
  }

  function hesitate() {
    if (busy) return;
    busy = true;
    var r = round.hesitate();
    A.play('warn');
    flash('stop');
    float('⌛ −' + r.timeLost + 's', true);
    setLast('bad', '⌛ Hesitou! Era <b>' + label(r.card.ans) + '</b> — ' + esc(r.card.why));
    var el = $('#card');
    el.classList.add('fly-left');
    setTimeout(function () { renderCard(); }, 230);
  }

  function verdict(r) {
    paused = true;
    var acc = r.kind === 'accident';
    if (acc) {
      A.play('zap');
      flash('accident');
      document.body.classList.add('shake');
      setTimeout(function () { document.body.classList.remove('shake'); }, 900);
      var hl = $('#h-lives'); hl.classList.remove('hit'); void hl.offsetWidth; hl.classList.add('hit');
    } else {
      A.play('warn');
      flash('stop');
      float('−' + r.timeLost + 's', true);
    }
    updateHud();
    var m = $('#modal');
    m.innerHTML = '<div class="card verdict ' + r.kind + '">' +
      '<div class="v-icon">' + (acc ? '💀' : '⏸') + '</div>' +
      '<h2>' + (acc ? 'ACIDENTE!' : 'PARADA DESNECESSÁRIA') + '</h2>' +
      '<div class="v-card">' + esc(r.card.title) + ' · você escolheu <b>' + label(r.choice) + '</b>, o certo era <b>' + label(r.card.ans) + '</b></div>' +
      (acc ? '<div class="v-lives">' + helmets(round.lives) + '</div>' : '<p>A produção ficou parada à toa: <b>−' + r.timeLost + ' s</b> de turno.</p>') +
      '<div class="lesson"><b>Por quê</b><p>' + esc(r.card.why) + '</p></div>' +
      '<div class="refs">📖 ' + esc(r.card.ref) + '</div>' +
      '<div class="btns"><button class="act primary" id="v-ok">Entendi (espaço)</button></div></div>';
    m.classList.remove('hidden');
    setLast('bad', (acc ? '💀' : '⏸') + ' Era <b>' + label(r.card.ans) + '</b> — ' + esc(r.card.why));
    $('#v-ok').focus();
  }

  function closeVerdict() {
    var m = $('#modal');
    if (m.classList.contains('hidden')) return false;
    m.classList.add('hidden');
    m.innerHTML = '';
    paused = false;
    lastT = performance.now();
    if (round.over()) { end(); return true; }
    renderCard();
    return true;
  }

  // ---------------------------------------------------------------- fim

  function end() {
    cancelAnimationFrame(raf);
    paused = true;
    busy = true;
    var dead = round.lives <= 0;
    A.play(dead ? 'flatline' : 'win');
    var acc = round.accuracy();
    var best = loadBest(), record = !best || round.score > best.score;
    if (record) saveBest({ score: round.score, acc: acc });
    var mistakes = round.mistakes();
    var html = '<div class="hazard"></div><div class="end-head' + (dead ? ' dead' : '') + '">' +
      '<div class="e-icon">' + (dead ? '💀' : '🏁') + '</div>' +
      '<h2>' + (dead ? 'TURNO ENCERRADO: 3 ACIDENTES' : 'FIM DO TURNO') + '</h2>' +
      '<div class="end-score">' + round.score + (record ? ' 🏆' : '') + '</div>' +
      '<div class="end-rank">' + esc(PL.rank(round.score)) + '</div></div>' +
      '<div class="end-stats"><div><b>' + acc + '%</b><span>acerto</span></div><div><b>' + round.answered + '</b><span>cartas</span></div>' +
      '<div><b>×' + Math.min(4, 1 + Math.floor(round.bestCombo / 3)) + '</b><span>melhor combo (' + round.bestCombo + ')</span></div></div>';
    if (mistakes.length) {
      html += '<div class="review"><h3>Revise o que você errou</h3>' + mistakes.map(function (x) {
        var k = x.kind === 'accident' ? '💀 Você LIBEROU — era PARA' : x.kind === 'stop' ? '⏸ Você PAROU — era LIBERA' : '⌛ Você hesitou — era ' + label(x.card.ans);
        return '<div class="rv ' + x.kind + '"><div class="rv-k">' + k + '</div><div class="rv-t">' + esc(x.card.title) + '</div>' +
          '<p>' + esc(x.card.why) + '</p><em>📖 ' + esc(x.card.ref) + '</em></div>';
      }).join('') + '</div>';
    } else {
      html += '<p class="perfect">Nenhum erro. Você enxerga condição impeditiva de longe. ⚡</p>';
    }
    html += '<div class="btns"><button class="act primary big" id="e-again">↻ Jogar de novo</button>' +
      '<button class="act ghost" id="e-menu">Menu</button></div>' +
      '<a class="other-game" href="../index.html">⚡ Agora encare o <b>Desenergiza ou Morre</b> →</a>';
    $('#end-body').innerHTML = html;
    setTimeout(function () { show('pl-end'); }, dead ? 700 : 300);
  }

  function quit() {
    cancelAnimationFrame(raf);
    round = null;
    $('#modal').classList.add('hidden');
    renderMenu();
    show('pl-menu');
  }

  // ---------------------------------------------------------------- arrastar

  function onDown(ev) {
    if (!round || paused || busy) return;
    var el = $('#card');
    drag = { x: ev.clientX, y: ev.clientY, dx: 0, id: ev.pointerId };
    el.classList.add('dragging');
    el.classList.remove('enter');
    el.setPointerCapture(ev.pointerId);
  }
  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    var el = $('#card');
    drag.dx = ev.clientX - drag.x;
    var dy = (ev.clientY - drag.y) * 0.2;
    el.style.transform = 'translate(' + drag.dx + 'px,' + dy + 'px) rotate(' + (drag.dx / 18) + 'deg)';
    var p = Math.min(1, Math.abs(drag.dx) / 110);
    el.querySelector('.stamp.para').style.opacity = drag.dx < 0 ? p : 0;
    el.querySelector('.stamp.libera').style.opacity = drag.dx > 0 ? p : 0;
    document.body.classList.toggle('tint-para', drag.dx < -40);
    document.body.classList.toggle('tint-libera', drag.dx > 40);
  }
  function onUp(ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    var dx = drag.dx, el = $('#card');
    drag = null;
    if (Math.abs(dx) > 100) { decide(dx < 0 ? 'para' : 'libera'); return; }
    el.classList.remove('dragging');
    el.style.transform = '';
    el.querySelectorAll('.stamp').forEach(function (s) { s.style.opacity = 0; });
    document.body.classList.remove('tint-para', 'tint-libera');
  }

  var card = $('#card');
  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  card.addEventListener('pointercancel', onUp);

  $('#b-para').addEventListener('click', function () { decide('para'); });
  $('#b-lib').addEventListener('click', function () { decide('libera'); });
  $('#pl-start').addEventListener('click', start);
  $('#pl-quit').addEventListener('click', quit);
  $('#modal').addEventListener('click', function (ev) { if (ev.target.id === 'v-ok') closeVerdict(); });
  $('#end-body').addEventListener('click', function (ev) {
    if (ev.target.closest('#e-again')) start();
    else if (ev.target.closest('#e-menu')) quit();
  });
  document.addEventListener('keydown', function (ev) {
    if (!$('#pl-game').classList.contains('active')) return;
    if (ev.key === ' ' || ev.key === 'Enter') { if (closeVerdict()) ev.preventDefault(); return; }
    if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') decide('para');
    else if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') decide('libera');
  });
  $('#pl-sound').addEventListener('click', function () {
    var m = !A.isMuted();
    A.setMuted(m);
    try { localStorage.setItem('dom-muted', m ? '1' : ''); } catch (e) { /* sem storage */ }
    this.textContent = m ? '🔇' : '🔊';
  });
  try { if (localStorage.getItem('dom-muted')) { A.setMuted(true); $('#pl-sound').textContent = '🔇'; } } catch (e) { /* sem storage */ }

  renderMenu();
  window.PL.ui = { start: start, round: function () { return round; } };
})();
