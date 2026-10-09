/*
 * Interface do "Desenergiza ou Morre": telas, diagrama SVG, painel de ações,
 * minijogos (aterramento e sincronismo), execução, morte e vitória.
 */
(function () {
  'use strict';
  var SEP = window.SEP, A = SEP.audio;
  var $ = function (sel) { return document.querySelector(sel); };

  var level, levelIdx, game, timer, lastTick, elapsed, pressureIdx, selected, reveal, busy;

  // ---------------------------------------------------------------- utilidades

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function fmt(sec) {
    var neg = sec < 0, v = Math.abs(Math.floor(sec));
    return (neg ? '+' : '') + String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function loadProgress() { try { return JSON.parse(localStorage.getItem('dom-progress') || '{}') || {}; } catch (e) { return {}; } }
  function saveProgress(p) { try { localStorage.setItem('dom-progress', JSON.stringify(p)); } catch (e) { /* sem storage */ } }
  function getName() {
    var el = $('#player-name');
    var v = el ? el.value.trim() : '';
    if (!v) { try { v = (localStorage.getItem('sep-nome') || '').trim(); } catch (e) { v = ''; } }
    return v;
  }
  // Exige o nome do aluno antes de jogar; devolve false e destaca o campo se estiver vazio.
  function requireName() {
    var el = $('#player-name'), ok = getName().length >= 2;
    $('#name-err').classList.toggle('hidden', ok);
    if (!ok) {
      show('screen-menu');
      el.classList.remove('err'); void el.offsetWidth; el.classList.add('err');
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    return ok;
  }
  function whoLine() {
    var d = new Date();
    return '👷 ' + esc(getName() || 'Sem nome') + ' · ' + d.toLocaleDateString('pt-BR') + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  function starStr(n) { return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n); }
  function timeLeft() { return level.time - elapsed; }

  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo(0, 0);
  }

  // ---------------------------------------------------------------- menu

  var RANKS = [
    [0, 'Aprendiz de Risco'], [4, 'Eletricista de Primeira Viagem'], [7, 'Eletricista SEP'],
    [10, 'Operador de Subestação'], [13, 'Mestre da Desenergização'], [15, 'Lenda do SEP ⚡']
  ];

  function renderMenu() {
    var p = loadProgress(), total = 0, score = 0;
    $('#levels').innerHTML = SEP.levels.map(function (L, i) {
      var r = p[L.id];
      if (r) { total += r.stars; score += r.score; }
      return '<button class="lvl' + (r ? ' done' : '') + '" data-i="' + i + '">' +
        '<span class="lvl-n">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="lvl-body"><span class="lvl-tag">' + esc(L.tag) + '</span><strong>' + esc(L.title) + '</strong>' +
        '<span class="lvl-best">' + (r ? 'Recorde ' + r.score + ' pts' : 'Ainda não jogada') + '</span></span>' +
        '<span class="lvl-stars">' + starStr(r ? r.stars : 0) + '</span></button>';
    }).join('');
    var rank = RANKS.filter(function (r) { return total >= r[0]; }).pop()[1];
    $('#rank').innerHTML = '<span>' + total + '/15 ★</span><span>' + score + ' pts</span><span class="rank-name">' + esc(rank) + '</span>' +
      (p.deaths ? '<span class="deaths">💀 ' + p.deaths + ' mortes</span>' : '');
  }

  function openBrief(i) {
    levelIdx = i; level = SEP.levels[i];
    $('#brief-place').textContent = level.place;
    $('#brief-num').textContent = 'FASE ' + String(i + 1).padStart(2, '0') + ' · ' + level.tag;
    $('#brief-title').textContent = level.title;
    $('#brief-text').textContent = level.briefing;
    $('#brief-obj').textContent = level.objective;
    $('#brief-time').textContent = fmt(level.time);
    show('screen-brief');
  }

  // ---------------------------------------------------------------- jogo

  function startLevel() {
    A.init();
    game = new SEP.Game(level);
    elapsed = 0; pressureIdx = 0; selected = null; reveal = false; busy = false;
    $('#feed').innerHTML = '';
    $('#toasts').innerHTML = '';
    closeModal();
    $('#xraybar').classList.add('hidden');
    $('#overlay').classList.add('hidden');
    $('#hud-title').textContent = String(levelIdx + 1).padStart(2, '0') + ' · ' + level.title + ' · 👷 ' + getName();
    show('screen-game');
    feed({ type: 'info', msg: level.objective, who: 'OS' });
    if (level.hints) feed({ type: 'info', msg: 'Toque nos equipamentos e trechos do diagrama para agir. As tensões não aparecem: você precisa MEDIR.', who: 'Dica' });
    render();
    A.hum(true);
    clearInterval(timer);
    lastTick = performance.now();
    timer = setInterval(tick, 250);
  }

  function tick() {
    var now = performance.now(), dt = (now - lastTick) / 1000;
    lastTick = now;
    if (busy || !game || game.s.over) return;
    elapsed += dt;
    var P = level.pressure || [];
    while (pressureIdx < P.length && elapsed >= P[pressureIdx].t) {
      var m = P[pressureIdx++];
      feed({ type: 'radio', who: m.who, msg: m.msg });
      toast('📻 ' + m.who + ': ' + m.msg, 'radio');
      A.play('radio');
    }
    updateHud();
  }

  function stopGame() {
    clearInterval(timer);
    A.hum(false);
    A.heartbeat(false);
  }

  function updateHud() {
    var tl = timeLeft();
    var el = $('#hud-time');
    el.textContent = fmt(tl);
    el.classList.toggle('over', tl < 0);
    el.classList.toggle('low', tl >= 0 && tl < 30);
    $('#hud-inf').textContent = game.s.infractions.length;
    $('#hud-bonus').textContent = game.s.bonus;
  }

  function render() {
    renderDiagram();
    renderActions();
    renderSheet();
    renderChecklist();
    updateHud();
  }

  // ---------------------------------------------------------------- diagrama

  function pts(p) { var o = []; for (var i = 0; i < p.length; i += 2) o.push(p[i] + ',' + p[i + 1]); return o.join(' '); }

  function groundSvg(gp, gd) {
    var x = gp[0], y = gp[1], px = x, py = y, out = '<g class="gnd">';
    if (gd === 'r') px = x + 28; else if (gd === 'l') px = x - 28; else py = y + 20;
    out += '<circle cx="' + x + '" cy="' + y + '" r="4"/>';
    out += '<line x1="' + x + '" y1="' + y + '" x2="' + px + '" y2="' + py + '"/>';
    var sy = py;
    if (gd === 'r' || gd === 'l') { out += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + 12) + '"/>'; sy = py + 12; }
    out += '<line x1="' + (px - 12) + '" y1="' + sy + '" x2="' + (px + 12) + '" y2="' + sy + '"/>' +
      '<line x1="' + (px - 8) + '" y1="' + (sy + 5) + '" x2="' + (px + 8) + '" y2="' + (sy + 5) + '"/>' +
      '<line x1="' + (px - 4) + '" y1="' + (sy + 10) + '" x2="' + (px + 4) + '" y2="' + (sy + 10) + '"/></g>';
    return out;
  }

  function deviceSvg(id) {
    var d = level.devices[id], st = game.s.dev[id], x = d.x, y = d.y, h = d.o === 'h';
    var cls = 'dev ' + (st.closed ? 'closed' : 'open') + (selected === id ? ' sel' : '') + (st.locks.length ? ' locked' : '');
    var inner = '';
    if (d.type === '52') {
      inner = '<line x1="' + x + '" y1="' + (y - 25) + '" x2="' + x + '" y2="' + (y - 14) + '" class="wire-d"/>' +
        '<line x1="' + x + '" y1="' + (y + 14) + '" x2="' + x + '" y2="' + (y + 25) + '" class="wire-d"/>' +
        '<rect x="' + (x - 14) + '" y="' + (y - 14) + '" width="28" height="28" rx="3" class="brk"/>';
    } else {
      var blade = st.closed
        ? '<line x1="' + x + '" y1="' + (y + 12) + '" x2="' + x + '" y2="' + (y - 12) + '" class="blade"/>'
        : '<line x1="' + x + '" y1="' + (y + 12) + '" x2="' + (x + 17) + '" y2="' + (y - 7) + '" class="blade"/>';
      inner = '<line x1="' + x + '" y1="' + (y - 25) + '" x2="' + x + '" y2="' + (y - 12) + '" class="wire-d"/>' +
        '<line x1="' + x + '" y1="' + (y + 12) + '" x2="' + x + '" y2="' + (y + 25) + '" class="wire-d"/>' +
        '<line x1="' + (x - 7) + '" y1="' + (y - 12) + '" x2="' + (x + 7) + '" y2="' + (y - 12) + '" class="contact"/>' +
        blade + '<circle cx="' + x + '" cy="' + (y + 12) + '" r="3.5" class="pivot"/>';
    }
    var out = '<g class="' + cls + '" data-dev="' + id + '">' +
      '<g' + (h ? ' transform="rotate(-90 ' + x + ' ' + y + ')"' : '') + '>' + inner +
      '<rect x="' + (x - 22) + '" y="' + (y - 30) + '" width="44" height="60" class="hit"/></g>';
    var state = st.closed ? 'FECHADO' : 'ABERTO';
    if (h) {
      out += '<text x="' + x + '" y="' + (y - 22) + '" class="dlabel" text-anchor="middle">' + esc(d.short) + '</text>' +
        '<text x="' + x + '" y="' + (y + 36) + '" class="dstate" text-anchor="middle">' + state + '</text>';
      if (st.locks.length) out += '<text x="' + x + '" y="' + (y + 54) + '" class="lock" text-anchor="middle">🔒' + st.locks.length + '</text>';
    } else {
      out += '<text x="' + (x + 22) + '" y="' + (y + 2) + '" class="dlabel">' + esc(d.short) + '</text>' +
        '<text x="' + (x + 22) + '" y="' + (y + 16) + '" class="dstate">' + state + '</text>';
      if (st.locks.length) out += '<text x="' + (x - 22) + '" y="' + (y + 6) + '" class="lock" text-anchor="end">🔒' + st.locks.length + '</text>';
    }
    return out + '</g>';
  }

  function sourceSvg(src) {
    var x = src.x, y = src.y, icon;
    if (src.kind === 'gerador') {
      icon = '<circle cx="' + x + '" cy="' + y + '" r="29" class="spin"/><text x="' + x + '" y="' + (y + 7) + '" class="src-t" text-anchor="middle">G</text>';
    } else if (src.kind === 'trafo') {
      icon = '<circle cx="' + (x - 6) + '" cy="' + y + '" r="10" class="src-ring"/><circle cx="' + (x + 6) + '" cy="' + y + '" r="10" class="src-ring"/>';
    } else {
      icon = '<text x="' + x + '" y="' + (y + 8) + '" class="src-t" text-anchor="middle">~</text>';
    }
    var lp = src.lp || [x + 32, y + 5];
    return '<g class="src" data-src="' + src.id + '"><circle cx="' + x + '" cy="' + y + '" r="22" class="src-c"/>' + icon +
      '<text x="' + lp[0] + '" y="' + lp[1] + '" class="src-l"' + (src.anchor ? ' text-anchor="' + src.anchor + '"' : '') + '>' + esc(src.short || src.label) + '</text></g>';
  }

  function renderDiagram() {
    var L = level, s = game.s, out = [];
    out.push('<defs><pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="6" height="12" class="hatch-a"/></pattern>' +
      '<filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>');
    var z = L.zoneRect;
    out.push('<rect x="' + z[0] + '" y="' + z[1] + '" width="' + z[2] + '" height="' + z[3] + '" class="zone"/>' +
      '<text x="' + (L.zoneLabel ? L.zoneLabel[0] : z[0] + 6) + '" y="' + (L.zoneLabel ? L.zoneLabel[1] : z[1] + z[3] - 6) + '" class="zone-t">ZONA DE TRABALHO</text>');
    out.push(L.decor || '');

    (L.links || []).forEach(function (l) {
      if (l.kind !== 'trafo') return;
      out.push('<g class="trafo"><circle cx="' + l.x + '" cy="' + (l.y - 10) + '" r="14"/><circle cx="' + l.x + '" cy="' + (l.y + 10) + '" r="14"/>' +
        '<text x="' + (l.x + 22) + '" y="' + (l.y + 4) + '" class="dim">' + esc(l.label) + '</text></g>');
    });

    Object.keys(L.nodes).forEach(function (id) {
      var n = L.nodes[id], cls = 'node ' + (n.kind === 'bus' ? 'bus' : 'wire');
      if (reveal) { var v = game.voltageAt(id); cls += v.kind === 'real' ? ' live' : v.kind === 'induced' ? ' induced' : ' dead'; }
      if (selected === id) cls += ' sel';
      var g = '<g class="ng" data-node="' + id + '">';
      n.paths.forEach(function (p) { g += '<polyline points="' + pts(p) + '" class="' + cls + '"/>'; });
      if (s.covers[id]) n.paths.forEach(function (p) { g += '<polyline points="' + pts(p) + '" class="cover"/>'; });
      n.paths.forEach(function (p) { g += '<polyline points="' + pts(p) + '" class="hit"/>'; });
      if (n.lp) g += '<text x="' + n.lp[0] + '" y="' + n.lp[1] + '" class="nlabel">' + esc(n.label) + '</text>';
      var t = s.tests[id];
      if (t && n.bp) {
        var freshT = t.version === s.version;
        var txt = t.reading === 'real' ? '⚡ TENSÃO' : t.reading === 'induced' ? '〰 INDUZIDA' : '0 V ✓';
        if (!freshT) txt += ' · antiga';
        g += '<g class="badge ' + t.reading + (freshT ? '' : ' stale') + '"><rect x="' + n.bp[0] + '" y="' + (n.bp[1] - 12) + '" width="' + (txt.length * 6.6 + 12) +
          '" height="17" rx="8"/><text x="' + (n.bp[0] + 6) + '" y="' + (n.bp[1] + 1) + '">' + txt + '</text></g>';
      }
      out.push(g + '</g>');
      if (s.grounds[id] && n.gp) out.push(groundSvg(n.gp, n.gd));
    });

    Object.keys(L.devices).forEach(function (id) { out.push(deviceSvg(id)); });
    (L.sources || []).forEach(function (src) { out.push(sourceSvg(src)); });

    if (L.mode === 'reenergize' && !s.teamOut) {
      out.push('<text x="' + (z[0] + z[2] - 8) + '" y="' + (z[1] - 8) + '" class="team" text-anchor="end">👷 👷 👷</text>');
    }
    var svg = $('#diagram');
    svg.setAttribute('viewBox', L.viewBox || '0 0 900 540');
    svg.innerHTML = out.join('');
    svg.classList.toggle('xray', reveal);
  }

  // ---------------------------------------------------------------- painel

  function btn(act, label, opts) {
    opts = opts || {};
    return '<button class="act' + (opts.cls ? ' ' + opts.cls : '') + (opts.done ? ' done' : '') + '" data-act="' + act + '"' +
      (opts.arg != null ? ' data-arg="' + esc(opts.arg) + '"' : '') + (opts.disabled ? ' disabled' : '') + '>' + label + '</button>';
  }

  function renderActions() {
    var s = game.s, h = [];
    if (level.mode === 'reenergize') {
      h.push(btn('exit', '👷 Chamada nominal / saída da equipe', { done: s.teamOut }));
      h.push(btn('detector', '🔦 Testar detector', { done: s.detector.tested }));
      if (s.detector.knownFaulty) h.push(btn('replace', '🔁 Trocar detector', { cls: 'warn' }));
      h.push(s.signed ? btn('unsignal', '🚧 Retirar sinalização') : btn('noop', '🚧 Sinalização retirada', { done: true, disabled: true }));
      h.push(btn('auth', '📋 Autorização para reenergizar', { done: s.authorized }));
    } else {
      h.push(btn('auth', '📋 Autorização / ordem de manobra', { done: s.authorized }));
      h.push(btn('detector', '🔦 Testar detector', { done: s.detector.tested }));
      if (s.detector.knownFaulty) h.push(btn('replace', '🔁 Trocar detector', { cls: 'warn' }));
      h.push(btn(s.signed ? 'unsignal' : 'signal', s.signed ? '🚧 Área sinalizada' : '🚧 Sinalizar área e pontos de manobra', { done: s.signed }));
      h.push(btn('release', '✅ LIBERAR EQUIPE', { cls: 'primary' }));
    }
    $('#actions').innerHTML = h.join('');
  }

  function renderSheet() {
    var el = $('#sheet');
    if (!selected) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    var L = level, s = game.s, h = '', acts = [];
    if (L.devices[selected]) {
      var d = L.devices[selected], st = s.dev[selected];
      h += '<div class="sh-kind">' + (d.type === '52' ? 'DISJUNTOR · interrompe carga' : 'SECCIONADORA · só manobra SEM carga') + '</div>';
      h += '<h3>' + esc(d.label) + '</h3>';
      h += '<div class="sh-state ' + (st.closed ? 'closed' : 'open') + '">' + (st.closed ? '● FECHADO' : '○ ABERTO') +
        (st.locks.length ? ' · 🔒 ' + esc(st.locks.join(', ')) : '') + '</div>';
      acts.push(st.closed ? btn('open', 'Abrir', { arg: selected }) : btn('close', 'Fechar', { arg: selected }));
      if (!st.closed && st.locks.indexOf('Você') < 0) acts.push(btn('lock', '🔒 Cadeado + etiqueta', { arg: selected }));
      if (st.locks.indexOf('Você') >= 0) acts.push(btn('unlock', 'Retirar meu cadeado', { arg: selected }));
    } else if (L.nodes[selected]) {
      var n = L.nodes[selected], t = s.tests[selected];
      h += '<div class="sh-kind">' + (L.zone.indexOf(selected) >= 0 ? 'ZONA DE TRABALHO' : 'TRECHO / BARRA') + ' · ' + esc(n.kv || '') + '</div>';
      h += '<h3>' + esc(n.label) + '</h3>';
      h += '<div class="sh-state">' + (t ? 'Última medição: ' + (t.reading === 'real' ? '⚡ tensão' : t.reading === 'induced' ? '〰 tensão induzida' : '0 V') +
        (t.version !== s.version ? ' (antes da última manobra!)' : '') : 'Sem medição') +
        (s.grounds[selected] ? ' · ⏚ aterrado' : '') + (s.covers[selected] ? ' · 🟧 manta' : '') + '</div>';
      acts.push(btn('test', '🔦 Testar ausência de tensão', { arg: selected }));
      if (n.gp) acts.push(s.grounds[selected] ? btn('unground', '⏚ Retirar aterramento', { arg: selected }) : btn('ground', '⏚ Instalar aterramento temporário', { arg: selected }));
      if (n.adjacent) acts.push(s.covers[selected] ? btn('uncover', 'Retirar manta isolante', { arg: selected }) : btn('cover', '🟧 Instalar manta isolante', { arg: selected }));
    } else {
      var src = (L.sources || []).filter(function (x) { return x.id === selected; })[0];
      h += '<div class="sh-kind">FONTE</div><h3>' + esc(src.short || src.label) + '</h3><div class="sh-state">Sempre energizada. Você não controla esta fonte — só os pontos de manobra.</div>';
    }
    el.innerHTML = '<button class="sh-x" data-act="deselect" aria-label="Fechar">✕</button>' + h + '<div class="sh-acts">' + acts.join('') + '</div>';
  }

  function renderChecklist() {
    var el = $('#checklist');
    if (!level.checklist) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    el.innerHTML = '<div class="cl-h">Roteiro (só no tutorial)</div>' + level.checklist.map(function (c) {
      var ok = c[1](game);
      return '<div class="cl' + (ok ? ' ok' : '') + '">' + (ok ? '✔' : '○') + ' ' + esc(c[0]) + '</div>';
    }).join('');
  }

  // ---------------------------------------------------------------- feed e toasts

  function feed(e) {
    var div = document.createElement('div');
    div.className = 'fi ' + e.type;
    div.innerHTML = '<span class="ft">' + fmt(elapsed || 0).replace('+', '') + '</span>' +
      (e.who ? '<b>' + esc(e.who) + ':</b> ' : e.type === 'infraction' ? '<b>⚠ Infração:</b> ' : '') + esc(e.msg) +
      (e.ref ? '<em>' + esc(e.ref) + '</em>' : '');
    var f = $('#feed');
    f.insertBefore(div, f.firstChild);
  }

  function toast(msg, type) {
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    var box = $('#toasts');
    while (box.children.length >= 2) box.removeChild(box.firstChild);
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3400);
    setTimeout(function () { t.remove(); }, 3900);
  }

  function run(events) {
    var death = null, win = false;
    events.forEach(function (e) {
      if (e.type === 'death') { death = e.death; return; }
      if (e.type === 'win') { win = true; return; }
      feed(e);
      if (e.type === 'infraction') { A.play('infraction'); toast('⚠ INFRAÇÃO — ' + e.msg, 'infraction'); }
      else if (e.sound) A.play(e.sound);
      if (e.type === 'warn') toast(e.msg, 'warn');
      if (e.type === 'radio') toast('📻 ' + (e.who ? e.who + ': ' : '') + e.msg, 'radio');
    });
    render();
    if (death) die(death);
    else if (win) setTimeout(victory, 500);
  }

  // ---------------------------------------------------------------- minijogo: aterramento

  function groundModal(nodeId, removing) {
    var order = [], names = { T: '⏚ Terra', A: 'Fase A', B: 'Fase B', C: 'Fase C' };
    var keys = shuffle(['T', 'A', 'B', 'C']);
    var m = $('#modal');
    m.innerHTML = '<div class="card mini"><div class="sh-kind">' + (removing ? 'RETIRADA' : 'INSTALAÇÃO') + ' DO ATERRAMENTO TEMPORÁRIO</div>' +
      '<h3>' + esc(level.nodes[nodeId].label) + '</h3>' +
      '<p>Com a vara de manobra, ' + (removing ? 'DESCONECTE' : 'CONECTE') + ' os grampos na ordem certa. Toque na sequência:</p>' +
      '<div class="clamps">' + keys.map(function (k) { return '<button class="clamp" data-k="' + k + '">' + names[k] + '<span></span></button>'; }).join('') + '</div>' +
      '<button class="act ghost" data-mact="cancel">Cancelar</button></div>';
    m.classList.remove('hidden');
    m.onclick = function (ev) {
      var b = ev.target.closest('[data-k]');
      if (ev.target.closest('[data-mact="cancel"]')) { closeModal(); return; }
      if (!b || b.disabled) return;
      order.push(b.dataset.k);
      b.disabled = true;
      b.querySelector('span').textContent = order.length;
      A.play('clamp');
      if (order.length === 4) {
        setTimeout(function () {
          closeModal();
          run(removing ? game.unground(nodeId, order) : game.ground(nodeId, order));
        }, 250);
      }
    };
  }

  function closeModal() {
    var m = $('#modal');
    m.classList.add('hidden');
    m.innerHTML = '';
    m.onclick = null;
    if (syncRaf) { cancelAnimationFrame(syncRaf); syncRaf = null; }
  }

  // ---------------------------------------------------------------- minijogo: sincronoscópio

  var syncRaf = null;
  function syncModal(devId) {
    var d = level.devices[devId], m = $('#modal');
    m.innerHTML = '<div class="card mini sync"><div class="sh-kind">FUNÇÃO 25 · SINCRONISMO</div><h3>Fechar ' + esc(d.label) + ' em paralelo</h3>' +
      '<p>Os dois lados estão energizados. Feche só quando o ponteiro estiver na faixa verde (12 horas).</p>' +
      '<canvas id="syncc" width="240" height="240"></canvas>' +
      '<div class="sync-data">ΔV 0,6% ✓ · Δf 0,09 Hz ✓ · Sequência ABC ✓</div>' +
      '<button class="act primary" data-mact="fire">FECHAR ' + esc(d.short) + '</button>' +
      '<button class="act ghost" data-mact="cancel">Cancelar</button></div>';
    m.classList.remove('hidden');
    var cv = $('#syncc'), cx = cv.getContext('2d'), t0 = performance.now(), ang = Math.random() * 360;
    var last = t0;
    function draw(now) {
      var t = (now - t0) / 1000, dt = (now - last) / 1000; last = now;
      var speed = 150 + 110 * Math.sin(t * 1.3);
      ang = (ang + speed * dt) % 360;
      var c = 120, r = 96;
      cx.clearRect(0, 0, 240, 240);
      cx.lineWidth = 3; cx.strokeStyle = '#3a4656'; cx.beginPath(); cx.arc(c, c, r, 0, Math.PI * 2); cx.stroke();
      var tol = SEP.SYNC_TOL * Math.PI / 180;
      cx.strokeStyle = '#2ecc71'; cx.lineWidth = 14; cx.beginPath(); cx.arc(c, c, r, -Math.PI / 2 - tol, -Math.PI / 2 + tol); cx.stroke();
      cx.fillStyle = '#8b98a8'; cx.font = '12px monospace'; cx.textAlign = 'center';
      cx.fillText('LENTO', c - 62, c + 4); cx.fillText('RÁPIDO', c + 62, c + 4);
      var a = ang * Math.PI / 180, inZone = Math.min(ang, 360 - ang) <= SEP.SYNC_TOL;
      cx.strokeStyle = inZone ? '#2ecc71' : '#ffd400'; cx.lineWidth = 5; cx.lineCap = 'round';
      cx.beginPath(); cx.moveTo(c, c); cx.lineTo(c + (r - 10) * Math.sin(a), c - (r - 10) * Math.cos(a)); cx.stroke();
      cx.fillStyle = '#e6edf3'; cx.beginPath(); cx.arc(c, c, 7, 0, Math.PI * 2); cx.fill();
      if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) A.play('tick');
      syncRaf = requestAnimationFrame(draw);
    }
    syncRaf = requestAnimationFrame(draw);
    m.onclick = function (ev) {
      var b = ev.target.closest('[data-mact]');
      if (!b) return;
      if (b.dataset.mact === 'cancel') { closeModal(); return; }
      var rel = ang > 180 ? ang - 360 : ang;
      closeModal();
      run(game.operate(devId, 'close', { syncAngle: rel }));
    };
  }

  // ---------------------------------------------------------------- liberação da equipe

  function releaseTeam() {
    if (busy || game.s.over) return;
    selected = null;
    busy = true;
    var res = game.release();
    var ov = $('#overlay');
    ov.className = 'overlay exec';
    ov.innerHTML = '<div class="card exec-card"><h2>EQUIPE EM CAMPO</h2>' +
      '<p class="exec-sub">Ana, Bruno e Carlos entraram na zona de trabalho.</p>' +
      '<div class="ecg-box"><canvas id="ecg" width="480" height="90"></canvas><span id="ecg-bpm" class="ecg-bpm">♥ 84</span></div>' +
      '<div id="exec-log"></div></div>';
    A.hum(false);
    ecg = makeECG($('#ecg'));
    pulse(84);
    var items = res.timeline, i = 0;
    function step() {
      if (i >= items.length) return;
      var e = items[i++];
      if (e.type === 'death') { setTimeout(function () { die(e.death); }, 400); return; }
      if (e.type === 'win') { setTimeout(victory, 600); return; }
      feed(e);
      var row = document.createElement('div');
      row.className = 'xl ' + e.type;
      row.innerHTML = (e.who ? '<b>' + esc(e.who) + ':</b> ' : e.type === 'infraction' ? '<b>⚠</b> ' : '') + esc(e.msg);
      $('#exec-log').appendChild(row);
      if (e.type === 'infraction') A.play('infraction'); else if (e.sound) A.play(e.sound);
      if (e.type === 'radio') pulse(128);
      setTimeout(step, e.type === 'radio' ? 1900 : 1300);
    }
    setTimeout(step, 900);
  }

  // ---------------------------------------------------------------- monitor cardíaco

  var ecg = null;

  function pulse(bpm) {
    var el = $('#ecg-bpm');
    if (el) el.textContent = '♥ ' + bpm;
    A.heartbeat(true, bpm, function () { if (ecg) ecg.beat(); });
  }

  // Traçado de ECG rolando no canvas; beat() desenha um complexo QRS, flat() zera a linha.
  function makeECG(cv) {
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, mid = H * 0.6;
    var ys = [], queue = [], flat = false, x = 0;
    for (var i = 0; i < W; i++) ys.push(0);
    var QRS = [0, -3, -5, -3, 0, 2, 4, -34, 30, -8, 0, 0, -4, -7, -8, -7, -4, 0];
    function frame() {
      if (!cv.isConnected) return;
      for (var k = 0; k < 3; k++) {
        ys[x] = flat ? 0 : (queue.length ? queue.shift() : (Math.random() - 0.5) * 1.2);
        x = (x + 1) % W;
      }
      c.clearRect(0, 0, W, H);
      c.strokeStyle = 'rgba(46,204,113,.12)'; c.lineWidth = 1;
      for (var g = 0; g < W; g += 20) { c.beginPath(); c.moveTo(g, 0); c.lineTo(g, H); c.stroke(); }
      c.strokeStyle = flat ? '#ff3b30' : '#2ecc71'; c.lineWidth = 2.5; c.shadowColor = c.strokeStyle; c.shadowBlur = 8;
      c.beginPath();
      for (var j = 0; j < W; j++) {
        var idx = (x + j) % W, y = mid + ys[idx];
        if (j === 0) c.moveTo(j, y); else c.lineTo(j, y);
      }
      c.stroke();
      c.shadowBlur = 0;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return {
      beat: function () { if (!flat) queue = queue.concat(QRS); },
      flat: function () { flat = true; queue = []; }
    };
  }

  // ---------------------------------------------------------------- morte

  function die(d) {
    busy = true;
    stopGame();
    if (ecg) ecg.flat();
    var p = loadProgress(); p.deaths = (p.deaths || 0) + 1; saveProgress(p);
    var fx = $('#fx');
    fx.className = 'fx ' + d.kind;
    document.body.classList.add('shake');
    if (d.kind === 'shock') { A.play('zap'); bolts(); } else if (d.kind === 'sync') { A.play('boom'); sparks(); } else { A.play('arc'); sparks(); }
    setTimeout(function () { document.body.classList.remove('shake'); }, 900);
    setTimeout(function () {
      A.play('flatline');
      fx.className = 'fx hidden';
      var ov = $('#overlay');
      ov.className = 'overlay death';
      ov.innerHTML = '<div class="card death-card">' +
        '<div class="ecg-box dead"><canvas id="ecg-dead" width="480" height="70"></canvas></div>' +
        '<h2 class="glitch" data-t="GAME OVER">GAME OVER</h2>' +
        '<div class="who">' + whoLine() + '</div>' +
        '<h3>' + esc(d.title) + '</h3>' +
        (d.energy ? '<div class="dc-energy">' + esc(d.energy) + '</div>' : '') +
        '<p>' + esc(d.msg) + '</p>' +
        '<div class="lesson"><b>O que teria salvado você</b><p>' + esc(d.lesson) + '</p></div>' +
        '<div class="refs">📖 ' + esc(d.ref) + (d.caseRef ? '<br>📁 Caso real: ' + esc(d.caseRef) : '') + '</div>' +
        '<div class="btns"><button class="act primary" data-go="retry">↻ Tentar de novo</button>' +
        '<button class="act" data-go="xray">🩻 Raio-X do diagrama</button><button class="act ghost" data-go="menu">Menu</button></div></div>';
      var dead = makeECG($('#ecg-dead'));
      dead.flat();
    }, d.kind === 'shock' ? 1500 : 1800);
  }

  function sparks() {
    var cv = $('#fxc'), c = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    var P = [], cx0 = innerWidth / 2, cy0 = innerHeight * 0.45;
    for (var i = 0; i < 260; i++) {
      var a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 16;
      P.push({ x: cx0, y: cy0, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, l: 40 + Math.random() * 60 });
    }
    var f = 0;
    (function loop() {
      c.clearRect(0, 0, cv.width, cv.height);
      P.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.985; p.l--;
        if (p.l <= 0) return;
        c.strokeStyle = 'rgba(255,' + (150 + Math.floor(Math.random() * 100)) + ',60,' + Math.min(1, p.l / 40) + ')';
        c.lineWidth = 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); c.stroke();
      });
      if (++f < 110) requestAnimationFrame(loop); else c.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  function bolts() {
    var cv = $('#fxc'), c = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    var f = 0;
    (function loop() {
      c.clearRect(0, 0, cv.width, cv.height);
      if (f % 3 !== 2) {
        for (var b = 0; b < 4; b++) {
          var x = Math.random() * cv.width, y = 0;
          c.strokeStyle = 'rgba(150,200,255,0.95)'; c.lineWidth = 2 + Math.random() * 3; c.shadowColor = '#6cf'; c.shadowBlur = 20;
          c.beginPath(); c.moveTo(x, y);
          while (y < cv.height) { x += (Math.random() - 0.5) * 80; y += 20 + Math.random() * 40; c.lineTo(x, y); }
          c.stroke();
        }
      }
      if (++f < 60) requestAnimationFrame(loop); else c.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  function xray() {
    $('#overlay').classList.add('hidden');
    reveal = true;
    selected = null;
    render();
    $('#xraybar').classList.remove('hidden');
  }

  // ---------------------------------------------------------------- vitória

  function victory() {
    busy = true;
    stopGame();
    var sc = game.score(timeLeft()), p = loadProgress(), prev = p[level.id];
    var record = !prev || sc.total > prev.score;
    p[level.id] = { stars: Math.max(sc.stars, prev ? prev.stars : 0), score: Math.max(sc.total, prev ? prev.score : 0) };
    saveProgress(p);
    A.play('win');
    var inf = game.s.infractions;
    var next = levelIdx + 1 < SEP.levels.length;
    var ov = $('#overlay');
    ov.className = 'overlay win';
    ov.innerHTML = '<div class="card win-card">' +
      '<div class="win-stars">' + starStr(sc.stars) + '</div>' +
      '<div class="who">' + whoLine() + '</div>' +
      '<h2>' + (inf.length ? 'SOBREVIVEU… MAS' : 'SERVIÇO PERFEITO') + '</h2>' +
      '<p class="win-msg">' + esc(level.winMsg) + '</p>' +
      '<div class="score-grid"><span>Base</span><b>1000</b><span>Infrações (' + inf.length + ' × 150)</span><b class="neg">−' + sc.penalty + '</b>' +
      '<span>Bônus de segurança</span><b class="pos">+' + sc.bonus + '</b><span>Bônus de tempo</span><b class="pos">+' + sc.timeBonus + '</b>' +
      '<span class="tot">TOTAL</span><b class="tot">' + sc.total + (record ? ' 🏆' : '') + '</b></div>' +
      (inf.length ? '<div class="inf-list"><b>Você teve sorte. Na vida real isso conta:</b>' + inf.map(function (i) {
        return '<div class="inf"><span>⚠ ' + esc(i.msg) + '</span><em>' + esc(i.ref) + '</em></div>';
      }).join('') + '</div>' : '<p class="clean">Nenhuma infração. É assim que se trabalha no SEP.</p>') +
      '<div class="btns">' + (next ? '<button class="act primary" data-go="next">Próxima fase →</button>' : '<button class="act primary" data-go="menu">Ver ranking</button>') +
      '<button class="act" data-go="retry">↻ Jogar de novo</button><button class="act ghost" data-go="menu">Menu</button></div></div>';
  }

  // ---------------------------------------------------------------- eventos

  function onAction(act, arg) {
    if (busy || game.s.over) return;
    switch (act) {
      case 'deselect': selected = null; render(); return;
      case 'auth': run(game.authorize()); return;
      case 'detector': run(game.testDetector()); return;
      case 'replace': run(game.replaceDetector()); return;
      case 'signal': run(game.signal()); return;
      case 'unsignal': run(game.unsignal()); return;
      case 'exit': run(game.confirmExit()); return;
      case 'release': releaseTeam(); return;
      case 'open': run(game.operate(arg, 'open')); return;
      case 'close':
        if (game.needsSync(arg)) syncModal(arg); else run(game.operate(arg, 'close'));
        return;
      case 'lock': run(game.lock(arg)); return;
      case 'unlock': run(game.unlock(arg)); return;
      case 'test': run(game.testNode(arg)); return;
      case 'ground': groundModal(arg, false); return;
      case 'unground': groundModal(arg, true); return;
      case 'cover': run(game.cover(arg)); return;
      case 'uncover': run(game.uncover(arg)); return;
    }
  }

  function onGo(go) {
    if (go === 'retry') { $('#overlay').classList.add('hidden'); startLevel(); }
    else if (go === 'xray') xray();
    else if (go === 'next') { $('#overlay').classList.add('hidden'); openBrief(levelIdx + 1); }
    else if (go === 'menu') { stopGame(); $('#overlay').classList.add('hidden'); $('#xraybar').classList.add('hidden'); renderMenu(); show('screen-menu'); }
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var go = t.closest('[data-go]');
    if (go) { onGo(go.dataset.go); return; }
    var lv = t.closest('.lvl');
    if (lv) { A.init(); if (requireName()) openBrief(+lv.dataset.i); return; }
    var a = t.closest('[data-act]');
    if (a && !a.disabled) { onAction(a.dataset.act, a.dataset.arg); return; }
    if (!game || busy || game.s.over || !$('#screen-game').classList.contains('active')) return;
    var dev = t.closest('[data-dev]'), node = t.closest('[data-node]'), src = t.closest('[data-src]');
    var id = dev ? dev.dataset.dev : node ? node.dataset.node : src ? src.dataset.src : null;
    if (id) { if (selected !== id) { selected = id; A.play('tick'); render(); } }
    else if (selected && t.closest('#diagram')) { selected = null; render(); }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      if (!$('#modal').classList.contains('hidden')) closeModal();
      else if (selected) { selected = null; render(); }
    }
  });

  $('#btn-start').addEventListener('click', startLevel);
  $('#btn-brief-back').addEventListener('click', function () { show('screen-menu'); });
  $('#btn-quit').addEventListener('click', function () { onGo('menu'); });
  $('#btn-play').addEventListener('click', function () {
    A.init();
    if (!requireName()) return;
    var p = loadProgress();
    var i = SEP.levels.findIndex(function (L) { return !p[L.id]; });
    openBrief(i < 0 ? 0 : i);
  });
  $('#btn-qr').addEventListener('click', function () {
    var m = $('#modal');
    m.innerHTML = '<div class="card mini qr-card"><div class="sh-kind">JOGUE NO CELULAR</div><h3>Aponte a câmera para o QR</h3>' +
      '<img src="img/qrcode.svg" alt="QR code para o jogo">' +
      '<div class="qr-url">alexandrepiazza55rt.github.io/games_SIGMA</div>' +
      '<a class="act" href="qr.html" target="_blank" rel="noopener">🖨 Abrir versão para imprimir / projetar</a>' +
      '<button class="act ghost" data-mact="cancel">Fechar</button></div>';
    m.classList.remove('hidden');
    m.onclick = function (ev) { if (ev.target.closest('[data-mact="cancel"]') || ev.target === m) closeModal(); };
  });
  $('#btn-sound').addEventListener('click', function () {
    var m = !A.isMuted();
    A.setMuted(m);
    try { localStorage.setItem('dom-muted', m ? '1' : ''); } catch (e) { /* sem storage */ }
    this.textContent = m ? '🔇' : '🔊';
  });
  try { if (localStorage.getItem('dom-muted')) { A.setMuted(true); $('#btn-sound').textContent = '🔇'; } } catch (e) { /* sem storage */ }

  var nameEl = $('#player-name');
  try { nameEl.value = localStorage.getItem('sep-nome') || ''; } catch (e) { /* sem storage */ }
  nameEl.addEventListener('input', function () {
    try { localStorage.setItem('sep-nome', nameEl.value.trim()); } catch (e) { /* sem storage */ }
    if (nameEl.value.trim().length >= 2) { $('#name-err').classList.add('hidden'); nameEl.classList.remove('err'); }
  });
  nameEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') $('#btn-play').click(); });

  renderMenu();
  window.SEP.ui = { startLevel: startLevel, openBrief: openBrief, game: function () { return game; } };
})();
