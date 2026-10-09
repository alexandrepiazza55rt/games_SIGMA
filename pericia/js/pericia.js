/*
 * Interface do "Perícia SEP": cena congelada do acidente, toques para achar os erros,
 * classificação causa imediata x básica, dica, laudo por caso e revisão final.
 */
(function () {
  'use strict';
  var PS = window.PS, A = window.SEP.audio;
  var $ = function (s) { return document.querySelector(s); };

  var st = null, inv = null, c = null, timer = null, paused = false, order = [], hintTimer = null;

  // ---------------------------------------------------------------- utilidades

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; });
  }
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo(0, 0);
  }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function loadBest() { try { return JSON.parse(localStorage.getItem('ps-best') || 'null'); } catch (e) { return null; } }
  function saveBest(b) { try { localStorage.setItem('ps-best', JSON.stringify(b)); } catch (e) { /* sem storage */ } }
  function getName() {
    var v = $('#player-name').value.trim();
    if (!v) { try { v = (localStorage.getItem('sep-nome') || '').trim(); } catch (e) { v = ''; } }
    return v;
  }
  function requireName() {
    var el = $('#player-name'), ok = getName().length >= 2;
    $('#name-err').classList.toggle('hidden', ok);
    if (!ok) { el.classList.remove('err'); void el.offsetWidth; el.classList.add('err'); el.focus(); }
    return ok;
  }
  function whoLine() {
    var d = new Date();
    return '👷 ' + esc(getName() || 'Sem nome') + ' · ' + d.toLocaleDateString('pt-BR') + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function toast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    var box = $('#toasts');
    while (box.children.length >= 2) box.removeChild(box.firstChild);
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 4500);
    setTimeout(function () { t.remove(); }, 4950);
  }
  var KIND = { imediata: '⚡ Causa imediata', basica: '🌱 Causa básica' };
  var RANKS = [[0, 'Estagiário da Perícia'], [3000, 'Investigador Atento'], [5500, 'Perito de Campo'], [7500, 'Perito-Chefe SEP'], [8800, 'Sherlock da NR-10 🔍']];
  function rank(s) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (s >= x[0]) r = x[1]; }); return r; }

  // ---------------------------------------------------------------- turno

  function renderMenu() {
    var b = loadBest();
    $('#ps-best').innerHTML = b ? '<span>Recorde: ' + b.score + ' pts</span><span class="rank-name">' + esc(rank(b.score)) + '</span>' : '';
  }

  function start() {
    A.init();
    if (!requireName()) return;
    st = { i: 0, score: 0, reports: [] };
    show('ps-game');
    loadCase(0);
  }

  function loadCase(i) {
    st.i = i;
    c = PS.cases[i];
    inv = new PS.Investigation(c);
    order = [];
    paused = false;
    $('#toasts').innerHTML = '';
    $('#b-place').textContent = c.place;
    $('#b-title').textContent = 'Caso ' + (i + 1) + ' · ' + c.title;
    $('#b-intro').textContent = c.intro;
    render();
    clearInterval(timer);
    var last = performance.now();
    timer = setInterval(function () {
      var now = performance.now(), dt = (now - last) / 1000;
      last = now;
      if (!paused && !inv.done) {
        inv.tick(dt);
        if (inv.done) { A.play('warn'); toast('⏱ Tempo esgotado! Vamos ao laudo.', 'warn'); setTimeout(laudo, 900); }
      }
      updateHud();
    }, 200);
  }

  function updateHud() {
    $('#h-case').textContent = (st.i + 1) + '/' + PS.cases.length;
    var t = $('#h-time');
    t.textContent = fmt(inv.time);
    t.classList.toggle('low', inv.time <= 20);
    $('#h-score').textContent = st.score + inv.score;
    var total = inv.errors().length, f = Object.keys(inv.found).length;
    $('#b-found').textContent = '🔍 Erros encontrados: ' + f + ' de ' + total;
  }

  // ---------------------------------------------------------------- cena

  function render(reveal) {
    var out = [c.art()];
    order.forEach(function (id, n) {
      var it = inv.item(id), f = inv.found[id];
      var cls = !f.classified ? 'pending' : it.kind + (f.correct ? '' : ' wrong');
      out.push('<g class="mk ' + cls + '"><circle cx="' + it.x + '" cy="' + it.y + '" r="' + (it.r + 4) + '" class="mk-ring"/>' +
        '<text x="' + (it.x + it.r - 4) + '" y="' + (it.y - it.r + 6) + '" class="mk-num">' + (n + 1) + '</text></g>');
    });
    Object.keys(inv.falsePos).forEach(function (id) {
      var it = inv.item(id);
      out.push('<g class="mk ok"><circle cx="' + it.x + '" cy="' + it.y + '" r="' + (it.r + 2) + '" class="mk-ring"/>' +
        '<text x="' + (it.x - 8) + '" y="' + (it.y + 6) + '" class="mk-num">✓</text></g>');
    });
    if (reveal) {
      inv.errors().forEach(function (e) {
        if (inv.found[e.id]) return;
        out.push('<g class="mk missed"><circle cx="' + e.x + '" cy="' + e.y + '" r="' + (e.r + 4) + '" class="mk-ring"/>' +
          '<text x="' + (e.x - 6) + '" y="' + (e.y + 6) + '" class="mk-num">?</text></g>');
      });
    }
    out.push('<g id="fx"></g>');
    $('#scene').innerHTML = out.join('');
    updateHud();
  }

  function toScene(ev) {
    var svg = $('#scene'), r = svg.getBoundingClientRect();
    var k = Math.min(r.width / 900, r.height / 560);
    return { x: (ev.clientX - r.left - (r.width - 900 * k) / 2) / k, y: (ev.clientY - r.top - (r.height - 560 * k) / 2) / k };
  }

  function onTap(ev) {
    if (!inv || inv.done || paused) return;
    var p = toScene(ev), res = inv.tap(p.x, p.y);
    if (res.type === 'empty') {
      A.play('click');
      $('#fx').innerHTML = '<g><line x1="' + (p.x - 10) + '" y1="' + (p.y - 10) + '" x2="' + (p.x + 10) + '" y2="' + (p.y + 10) + '" class="miss-x"/>' +
        '<line x1="' + (p.x + 10) + '" y1="' + (p.y - 10) + '" x2="' + (p.x - 10) + '" y2="' + (p.y + 10) + '" class="miss-x"/>' +
        '<text x="' + (p.x + 14) + '" y="' + (p.y - 8) + '" class="miss-t">−2s</text></g>';
      updateHud();
    } else if (res.type === 'ok') {
      A.play('warn');
      toast('✅ Isso está correto: ' + res.item.why + ' (−50)', 'warn');
      render();
    } else if (res.type === 'error') {
      A.play('beep');
      order.push(res.item.id);
      render();
      classify(res.item);
    }
  }

  // ---------------------------------------------------------------- classificação

  function classify(it) {
    paused = true;
    var mo = $('#modal');
    mo.innerHTML = '<div class="card classify"><div class="sh-kind">ACHADO Nº ' + order.length + '</div>' +
      '<div class="what">' + esc(it.label) + '</div>' +
      '<p class="q">Isso é a causa imediata ou a causa básica do acidente?</p><div class="cl-btns">' +
      '<button class="act imediata" data-k="imediata"><b>⚡ CAUSA IMEDIATA</b><small>o ato ou a condição que disparou o evento, na hora</small></button>' +
      '<button class="act basica" data-k="basica"><b>🌱 CAUSA BÁSICA</b><small>a raiz por trás: procedimento, gestão, treinamento, planejamento</small></button></div></div>';
    mo.classList.remove('hidden');
    mo.onclick = function (ev) {
      var b = ev.target.closest('[data-k]');
      if (!b) return;
      var r = inv.classify(it.id, b.dataset.k);
      A.play(r.correct ? 'saved' : 'infraction');
      mo.innerHTML = '<div class="card fb ' + (r.correct ? 'right' : 'wrong') + '"><div class="v-icon">' + (r.correct ? '🎯' : '🤔') + '</div>' +
        '<h2>' + (r.correct ? 'CLASSIFICAÇÃO CERTA +' + (PS.CFG.find + PS.CFG.classify) : 'ACHOU, MAS CLASSIFICOU ERRADO +' + PS.CFG.find) + '</h2>' +
        '<div class="what">' + esc(it.label) + '</div><span class="tagk ' + it.kind + '">' + KIND[it.kind] + '</span>' +
        '<div class="lesson"><b>Por quê</b><p>' + esc(it.why) + '</p></div><div class="refs">📖 ' + esc(it.ref) + '<br>📖 ' + esc(PS.REF.causas) + '</div>' +
        '<div class="btns"><button class="act primary" id="fb-ok">' + (inv.done ? 'Ver o laudo →' : 'Continuar a perícia') + '</button></div></div>';
      mo.onclick = function (e2) {
        if (!e2.target.closest('#fb-ok')) return;
        mo.classList.add('hidden');
        mo.innerHTML = '';
        mo.onclick = null;
        paused = false;
        render();
        if (inv.done) laudo();
      };
    };
  }

  function hint() {
    if (!inv || inv.done || paused) return;
    var h = inv.hint();
    if (!h) return;
    A.play('radio');
    clearTimeout(hintTimer);
    var r = h.r + 30;
    $('#fx').innerHTML = '<circle cx="' + h.x + '" cy="' + h.y + '" r="' + r + '" class="hint-ring"/>';
    hintTimer = setTimeout(function () { var fx = $('#fx'); if (fx) fx.innerHTML = ''; }, 2600);
    toast('💡 Dica: olhe a região destacada (−' + PS.CFG.hint + ')', 'radio');
    updateHud();
  }

  // ---------------------------------------------------------------- laudo e fim

  function laudo() {
    paused = true;
    $('#toasts').innerHTML = '';
    clearInterval(timer);
    render(true);
    var r = inv.report();
    st.score += r.score;
    st.reports.push({ c: c, r: r });
    A.play(r.grade === 'A' || r.grade === 'B' ? 'win' : 'warn');
    var list = r.missed.map(function (e) {
      return '<div class="missed">❓ Passou: <b>' + esc(e.label) + '</b> — ' + KIND[e.kind] + '<em>' + esc(e.why) + '</em></div>';
    }).concat(r.wrong.map(function (e) {
      return '<div>🤔 Classificou errado: <b>' + esc(e.label) + '</b> — era ' + KIND[e.kind] + '</div>';
    }));
    var last = st.i + 1 >= PS.cases.length;
    var mo = $('#modal');
    mo.innerHTML = '<div class="card laudo"><div class="sh-kind">LAUDO DA PERÍCIA · CASO ' + (st.i + 1) + '</div>' +
      '<div class="l-head"><div class="grade ' + r.grade + '">' + r.grade + '</div><div><h2>' + esc(c.title) + '</h2><div class="who">' + whoLine() + '</div></div></div>' +
      '<div class="l-stats"><div><b>' + r.found + '/' + r.total + '</b><span>erros achados</span></div>' +
      '<div><b>' + r.right + '/' + r.found + '</b><span>bem classificados</span></div>' +
      '<div><b>' + r.score + '</b><span>pontos' + (r.bonus ? ' (+' + r.bonus + ' tempo)' : '') + '</span></div></div>' +
      (r.falsePos || r.hints ? '<p class="v-e" style="color:var(--dim);font-size:13px">' + (r.falsePos ? '✅ ' + r.falsePos + ' falso(s) positivo(s) · ' : '') + (r.hints ? '💡 ' + r.hints + ' dica(s)' : '') + '</p>' : '') +
      (list.length ? '<div class="l-list">' + list.join('') + '</div>' : '<p style="color:#8fe3b4">Perícia completa: todos os erros achados e classificados certo.</p>') +
      '<div class="real"><b>📁 Conclusão do caso real</b><p style="margin:4px 0 0">' + esc(c.real) + '</p><em>' + esc(c.caseRef) + '</em></div>' +
      '<div class="btns"><button class="act" id="l-scene">👁 Ver a cena</button><button class="act primary" id="l-next">' + (last ? 'Fechar a perícia →' : 'Próximo caso →') + '</button></div></div>';
    mo.classList.remove('hidden');
    mo.onclick = function (ev) {
      if (ev.target.closest('#l-scene')) {
        mo.classList.add('hidden');
        toast('Toque em qualquer lugar da cena para voltar ao laudo.', 'radio');
        var back = function () { $('#scene').removeEventListener('click', back); mo.classList.remove('hidden'); };
        setTimeout(function () { $('#scene').addEventListener('click', back); }, 50);
        return;
      }
      if (!ev.target.closest('#l-next')) return;
      mo.classList.add('hidden');
      mo.innerHTML = '';
      mo.onclick = null;
      if (last) end(); else loadCase(st.i + 1);
    };
  }

  function end() {
    clearInterval(timer);
    A.play('win');
    var best = loadBest(), isRecord = st.score > 0 && (!best || st.score > best.score);
    if (isRecord) saveBest({ score: st.score });
    var html = '<div class="hazard"></div><div class="end-head"><div class="e-icon">📋</div><h2>PERÍCIA CONCLUÍDA</h2>' +
      '<div class="who">' + whoLine() + '</div>' +
      '<div class="end-score">' + st.score + (isRecord ? ' 🏆' : '') + '</div><div class="end-rank">' + esc(rank(st.score)) + '</div></div>';
    html += '<div class="review"><h3>Laudos</h3>' + st.reports.map(function (x) {
      return '<div class="rv"><div class="grade ' + x.r.grade + '">' + x.r.grade + '</div><div><div class="rv-t">' + esc(x.c.title) + '</div>' +
        '<p>' + x.r.found + '/' + x.r.total + ' erros achados · ' + x.r.right + ' bem classificados · ' + x.r.score + ' pts</p>' +
        '<p style="color:#7f8c9c">' + esc(x.c.caseRef) + '</p></div></div>';
    }).join('') + '</div>';
    html += '<div class="cheat"><b>📏 Para não esquecer (slide 267)</b><br>' +
      '⚡ <b>Causa imediata:</b> o ato ou a condição que disparou o evento — sem cadeado, sem constatar, porta aberta, lança na rede.<br>' +
      '🌱 <b>Causa básica:</b> a raiz por trás da imediata — procedimento, PT, APR, treinamento, planejamento, gestão.<br>' +
      'Tratar só o imediato não evita a repetição. A investigação busca as causas básicas — o foco é a causa, não a culpa.</div>';
    html += '<div class="btns"><button class="act primary big" id="e-again">↻ Jogar de novo</button><button class="act ghost" id="e-menu">Menu</button></div>' +
      '<div class="other-games"><a href="../index.html">⚡ Desenergiza ou Morre</a><a href="../para-ou-libera/index.html">✋ Para ou Libera</a>' +
      '<a href="../zona-morta/index.html">☠️ Zona Morta</a><a href="../veste-ou-queima/index.html">🧥 Veste ou Queima</a></div>';
    $('#end-body').innerHTML = html;
    show('ps-end');
  }

  function quit() {
    clearInterval(timer);
    $('#modal').classList.add('hidden');
    renderMenu();
    show('ps-menu');
  }

  // ---------------------------------------------------------------- eventos

  $('#scene').addEventListener('click', onTap);
  $('#ps-hint').addEventListener('click', hint);
  $('#ps-start').addEventListener('click', start);
  $('#ps-quit').addEventListener('click', quit);
  $('#end-body').addEventListener('click', function (ev) {
    if (ev.target.closest('#e-again')) start();
    else if (ev.target.closest('#e-menu')) quit();
  });
  $('#ps-sound').addEventListener('click', function () {
    var mu = !A.isMuted();
    A.setMuted(mu);
    try { localStorage.setItem('dom-muted', mu ? '1' : ''); } catch (e) { /* sem storage */ }
    this.textContent = mu ? '🔇' : '🔊';
  });
  try { if (localStorage.getItem('dom-muted')) { A.setMuted(true); $('#ps-sound').textContent = '🔇'; } } catch (e) { /* sem storage */ }

  var nameEl = $('#player-name');
  try { nameEl.value = localStorage.getItem('sep-nome') || ''; } catch (e) { /* sem storage */ }
  nameEl.addEventListener('input', function () {
    try { localStorage.setItem('sep-nome', nameEl.value.trim()); } catch (e) { /* sem storage */ }
    if (nameEl.value.trim().length >= 2) { $('#name-err').classList.add('hidden'); nameEl.classList.remove('err'); }
  });
  nameEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') start(); });

  renderMenu();
  window.PS.ui = { start: start, state: function () { return { st: st, inv: inv, c: c, paused: paused }; } };
})();
