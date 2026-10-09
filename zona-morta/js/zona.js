/*
 * Interface do "Zona Morta": cenas em SVG (metros → pixels), aproximação com zonas invisíveis,
 * munck em tempo real, decisão de emergência, vereditos e revisão no fim.
 */
(function () {
  'use strict';
  var ZM = window.ZM, A = window.SEP.audio;
  var $ = function (s) { return document.querySelector(s); };
  var W = 900, H = 520;

  var st = null;      // estado do turno: { i, score, helmets, log }
  var m = null;       // missão atual
  var z = null;       // zonas da missão
  var view = null;    // { s, ox, gy }
  var tip = null;     // ponta (mão/ferramenta ou lança) em metros
  var aim = null;     // alvo do ponteiro no munck
  var crane = null;   // estado do munck
  var raf = null, busy = false, emergTimer = null;

  // ---------------------------------------------------------------- utilidades

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function fm(v) { return v.toFixed(2).replace('.', ',') + ' m'; }
  function kvLabel(kv) { return kv < 1 ? Math.round(kv * 1000) + ' V' : String(kv).replace('.', ',') + ' kV'; }
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo(0, 0);
  }
  function helmets(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '🪖' : '💀'; return s; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function loadBest() { try { return JSON.parse(localStorage.getItem('zm-best') || 'null'); } catch (e) { return null; } }
  function saveBest(b) { try { localStorage.setItem('zm-best', JSON.stringify(b)); } catch (e) { /* sem storage */ } }

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
    setTimeout(function () { t.classList.add('out'); }, 4000);
    setTimeout(function () { t.remove(); }, 4450);
  }
  function flash(kind) {
    var f = $('#flash');
    f.className = 'zm-flash';
    void f.offsetWidth;
    f.className = 'zm-flash ' + kind;
  }

  // metros → pixels
  function X(x) { return view.ox + x * view.s; }
  function Y(y) { return view.gy - y * view.s; }
  function P(x, y) { return X(x).toFixed(1) + ',' + Y(y).toFixed(1); }
  function toWorld(ev) {
    var svg = $('#scene'), r = svg.getBoundingClientRect();
    var k = Math.min(r.width / W, r.height / H);
    var px = (ev.clientX - r.left - (r.width - W * k) / 2) / k, py = (ev.clientY - r.top - (r.height - H * k) / 2) / k;
    return { x: (px - view.ox) / view.s, y: (view.gy - py) / view.s };
  }

  // ---------------------------------------------------------------- menu e turno

  function renderMenu() {
    var b = loadBest();
    $('#zm-best').innerHTML = b ? '<span>Recorde: ' + b.score + ' pts</span><span class="rank-name">' + esc(rank(b.score)) + '</span>' : '';
  }

  var RANKS = [[0, 'Para-raios Humano'], [2500, 'Aprendiz de Distância'], [4500, 'Olho de Trena'], [6500, 'Mestre das Zonas'], [7800, 'Lenda da Zona Morta ⚡']];
  function rank(score) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (score >= x[0]) r = x[1]; }); return r; }

  function start() {
    A.init();
    if (!requireName()) return;
    st = { i: 0, score: 0, helmets: 3, log: [] };
    show('zm-game');
    loadMission(0);
  }

  function updateHud() {
    $('#h-mission').textContent = (st.i + 1) + '/' + ZM.missions.length;
    $('#h-lives').textContent = helmets(st.helmets);
    $('#h-score').textContent = st.score;
  }

  function loadMission(i) {
    cancelAnimationFrame(raf);
    busy = false;
    st.i = i;
    m = ZM.missions[i];
    z = m.kv ? ZM.zonesFor(m.kv) : null;
    updateHud();
    $('#b-place').textContent = m.place;
    $('#b-title').textContent = (i + 1) + '. ' + m.title;
    $('#b-who').textContent = m.who || '';
    $('#b-task').textContent = m.task || '';
    $('#b-hint').textContent = m.hint ? '💡 ' + m.hint : '';
    $('#kv-tag').textContent = m.kv ? '⚡ ' + kvLabel(m.kv) : '';
    $('#kv-tag').style.display = m.kv ? '' : 'none';
    var main = $('#act-main');
    if (m.type === 'aprox') {
      view = { s: Math.min(860 / m.view.w, 470 / m.view.h), ox: 20, gy: 500 };
      tip = { x: m.start.x, y: m.start.y };
      main.textContent = '📏 CONFIRMAR POSIÇÃO';
      main.disabled = false;
      renderAprox();
    } else if (m.type === 'munck') {
      view = { s: Math.min(860 / m.view.w, 470 / m.view.h), ox: 20, gy: 500 };
      tip = ZM.clampTip(m.pivot, m.start, m);
      aim = null;
      crane = { prep: {}, inZC: false, warned: false, alarmAt: 0, contact: false, enteredZC: false, minD: Infinity };
      main.textContent = '⬇ SOLTAR CARGA';
      main.disabled = true;
      renderMunck();
      prepModal();
    } else {
      $('#scene').innerHTML = '<rect width="900" height="520" class="ground"/><text x="450" y="290" text-anchor="middle" font-size="120">' + esc(m.scene) + '</text>';
      main.textContent = '🚨 ...';
      main.disabled = true;
      setTimeout(function () { emergency(m, finishEmerg); }, 500);
    }
  }

  // ---------------------------------------------------------------- desenho comum

  function defs() {
    return '<defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  }
  function floorSvg() {
    return '<rect x="0" y="' + view.gy + '" width="900" height="' + (H - view.gy) + '" class="ground"/>' +
      '<line x1="0" y1="' + view.gy + '" x2="900" y2="' + view.gy + '" class="floor"/>';
  }
  function scaleBar() {
    var len = view.s >= 60 ? 1 : view.s >= 20 ? 5 : 10;
    var x1 = 880, x0 = x1 - len * view.s, y = 30;
    return '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" class="scale-l"/>' +
      '<line x1="' + x0 + '" y1="' + (y - 5) + '" x2="' + x0 + '" y2="' + (y + 5) + '" class="scale-l"/>' +
      '<line x1="' + x1 + '" y1="' + (y - 5) + '" x2="' + x1 + '" y2="' + (y + 5) + '" class="scale-l"/>' +
      '<text x="' + ((x0 + x1) / 2) + '" y="' + (y - 9) + '" text-anchor="middle" class="scale-t">' + len + ' m</text>';
  }
  function condSvg(c, kv) {
    var r = Math.max(6, 0.04 * view.s);
    return '<circle cx="' + X(c.x) + '" cy="' + Y(c.y) + '" r="' + r + '" class="cond"/>' +
      '<text x="' + (X(c.x) + r + 6) + '" y="' + (Y(c.y) - r - 4) + '" class="cond-l">' + kvLabel(kv) + '</text>';
  }
  function structSvg(kind, c) {
    var s = '';
    if (kind === 'cubiculo') {
      s += '<rect x="' + X(c.x - 0.25) + '" y="' + Y(c.y + 0.9) + '" width="' + (1.4 * view.s) + '" height="' + ((c.y + 0.9) * view.s) + '" class="struct-f"/>';
      s += '<line x1="' + X(c.x) + '" y1="' + Y(c.y) + '" x2="' + X(c.x + 1.15) + '" y2="' + Y(c.y) + '" class="struct"/>';
    } else if (kind === 'quadro') {
      s += '<rect x="' + X(c.x - 0.2) + '" y="' + Y(c.y + 0.45) + '" width="' + (0.8 * view.s) + '" height="' + (0.9 * view.s) + '" class="struct-f"/>';
    } else if (kind === 'torre') {
      var tx = c.x + 4;
      s += '<path d="M' + P(tx - 2, 0) + ' L' + P(tx - 0.6, c.y + 3) + ' L' + P(tx + 0.6, c.y + 3) + ' L' + P(tx + 2, 0) +
        ' M' + P(tx - 1.3, c.y / 2) + ' L' + P(tx + 1.3, c.y / 2) + ' M' + P(c.x, c.y + 0.3) + ' L' + P(tx + 3, c.y + 0.3) + '" class="struct"/>';
      s += '<line x1="' + X(c.x) + '" y1="' + Y(c.y + 0.3) + '" x2="' + X(c.x) + '" y2="' + Y(c.y) + '" class="struct"/>';
    } else {
      var px = c.x + 0.9;
      s += '<line x1="' + X(px) + '" y1="' + Y(0) + '" x2="' + X(px) + '" y2="' + Y(c.y + 0.7) + '" class="struct" style="stroke-width:' + Math.max(4, 0.18 * view.s) + '"/>';
      s += '<line x1="' + X(c.x - 0.1) + '" y1="' + Y(c.y + 0.35) + '" x2="' + X(px + 0.3) + '" y2="' + Y(c.y + 0.35) + '" class="struct"/>';
      s += '<line x1="' + X(c.x) + '" y1="' + Y(c.y + 0.35) + '" x2="' + X(c.x) + '" y2="' + Y(c.y) + '" class="struct"/>';
    }
    return s;
  }

  function personSvg(feetX, s) {
    var hY = 1.62, out = '<g>';
    out += '<polyline points="' + P(feetX - 0.18, 0) + ' ' + P(feetX, 0.9) + ' ' + P(feetX + 0.18, 0) + '" class="person"/>';
    out += '<line x1="' + X(feetX) + '" y1="' + Y(0.9) + '" x2="' + X(feetX) + '" y2="' + Y(1.48) + '" class="person"/>';
    out += '<circle cx="' + X(feetX) + '" cy="' + Y(hY) + '" r="' + Math.max(4, 0.13 * view.s) + '" class="person-h"/>';
    return out + '</g>';
  }

  // ---------------------------------------------------------------- aproximação

  function renderAprox(reveal) {
    var c = m.cond, out = [defs(), floorSvg(), scaleBar(), structSvg(m.decor, c)];
    if (reveal) {
      out.push('<circle id="zc" cx="' + X(c.x) + '" cy="' + Y(c.y) + '" r="0" class="zc-c"/>');
      out.push('<circle id="zr" cx="' + X(c.x) + '" cy="' + Y(c.y) + '" r="0" class="zr-c"/>');
    }
    out.push(condSvg(c, m.kv));
    var feet = Math.max(0.15, tip.x - (m.tool ? 1.0 : 0.55));
    out.push(personSvg(feet));
    var sh = { x: feet, y: 1.42 };
    if (m.tool) {
      var hand = { x: feet + 0.35, y: 1.15 };
      out.push('<polyline points="' + P(sh.x, sh.y) + ' ' + P(hand.x, hand.y) + '" class="person"/>');
      out.push('<line x1="' + X(hand.x) + '" y1="' + Y(hand.y) + '" x2="' + X(tip.x) + '" y2="' + Y(tip.y) + '" class="tool"/>');
    } else {
      out.push('<polyline points="' + P(sh.x, sh.y) + ' ' + P(tip.x, tip.y) + '" class="person"/>');
    }
    var R = Math.max(7, 0.05 * view.s);
    if (!reveal) out.push('<circle cx="' + X(tip.x) + '" cy="' + Y(tip.y) + '" r="' + (R + 4) + '" class="tip-ring"/>');
    out.push('<circle cx="' + X(tip.x) + '" cy="' + Y(tip.y) + '" r="' + R + '" class="tip"/>');
    out.push('<text x="' + X(tip.x) + '" y="' + (Y(tip.y) + R + 16) + '" text-anchor="middle" class="tip-l">' + esc(m.point) + '</text>');
    if (reveal) out.push('<g id="dims"></g>');
    $('#scene').innerHTML = out.join('');
  }

  function confirmAprox() {
    if (busy) return;
    busy = true;
    $('#act-main').disabled = true;
    var d = ZM.dist(tip.x, tip.y, m.cond.x, m.cond.y);
    var res = ZM.approachResult(d, z, m.authorized);
    renderAprox(true);
    A.play('click');
    var t0 = performance.now(), dur = 1100;
    (function grow(t) {
      var k = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3);
      $('#zc').setAttribute('r', z.zc * view.s * e);
      $('#zr').setAttribute('r', z.zr * view.s * e);
      if (k < 1) { requestAnimationFrame(grow); return; }
      var c = m.cond, ang = Math.atan2(tip.y - c.y, tip.x - c.x);
      var dims = '<line x1="' + X(c.x) + '" y1="' + Y(c.y) + '" x2="' + X(tip.x) + '" y2="' + Y(tip.y) + '" class="dim-l"/>' +
        '<text x="' + ((X(c.x) + X(tip.x)) / 2) + '" y="' + ((Y(c.y) + Y(tip.y)) / 2 - 8) + '" text-anchor="middle" class="dim-t">' + fm(d) + '</text>' +
        '<text x="' + (X(c.x) + z.zr * view.s * Math.cos(ang + 2.2)) + '" y="' + (Y(c.y) - z.zr * view.s * Math.sin(ang + 2.2)) + '" text-anchor="middle" class="zone-t r">ZR ' + fm(z.zr) + '</text>' +
        '<text x="' + (X(c.x) + z.zc * view.s * Math.cos(ang + 1.6)) + '" y="' + (Y(c.y) - z.zc * view.s * Math.sin(ang + 1.6) - 4) + '" text-anchor="middle" class="zone-t c">ZC ' + fm(z.zc) + '</text>';
      $('#dims').innerHTML = dims;
      if (res.outcome === 'dead') { flash('dead'); A.play('arc'); document.body.classList.add('shake'); setTimeout(function () { document.body.classList.remove('shake'); }, 900); }
      else if (res.outcome === 'invaded') { flash('warn'); A.play('warn'); }
      else { flash('ok'); A.play('beep'); }
      setTimeout(function () { verdictAprox(res, d); }, res.outcome === 'dead' ? 1300 : 900);
    })(t0);
  }

  function verdictAprox(res, d) {
    var lim = m.authorized ? 'zona de risco' : 'zona controlada';
    var info = { dead: res.outcome === 'dead', points: res.points };
    var title, kind, lesson;
    if (res.outcome === 'dead') {
      kind = 'dead'; title = 'ZONA MORTA!';
      lesson = (m.point === 'mão' ? 'Sua mão' : 'A ponta da ferramenta') + ' entrou na zona de risco (' + fm(z.zr) + ' para ' + kvLabel(m.kv) + '). ' +
        'Ali o arco ou o contato acontecem sem aviso. Entrada só com técnicas de trabalho energizado e autorização.';
    } else if (res.outcome === 'invaded') {
      kind = 'warn'; title = 'INVADIU A ZONA CONTROLADA';
      lesson = 'Quem não é autorizado não entra na zona controlada (' + fm(z.zc) + ' para ' + kvLabel(m.kv) + '). ' +
        (m.tool ? 'A ferramenta conta como extensão do corpo.' : '') ;
    } else {
      kind = 'ok';
      var gap = d - res.limit;
      title = gap < 0.1 * res.limit + 0.08 ? 'NA MEDIDA!' : gap < 0.6 * res.limit + 0.2 ? 'BOA DISTÂNCIA' : 'SEGURO, MAS LONGE';
      lesson = 'Você parou a ' + fm(gap) + ' do limite da ' + lim + '. ' +
        (m.authorized ? 'Autorizado pode trabalhar na zona controlada, nunca na de risco.' : 'Não autorizado fica na zona livre — e a ferramenta conta como corpo.');
    }
    record(info, kind, title, lesson);
    var html = '<div class="v-icon">' + (kind === 'dead' ? '💀' : kind === 'warn' ? '⚠️' : '✅') + '</div><h2>' + title + '</h2>' +
      (res.points ? '<div class="v-pts">+' + res.points + '</div>' : '') +
      '<div class="v-measure"><div class="you"><b>' + fm(d) + '</b><span>sua distância</span></div>' +
      '<div class="r"><b>' + fm(z.zr) + '</b><span>zona de risco</span></div><div class="c"><b>' + fm(z.zc) + '</b><span>zona controlada</span></div></div>' +
      '<div class="lesson"><b>Por quê</b><p>' + esc(lesson) + '</p></div><div class="refs">📖 ' + esc(m.ref) + '</div>';
    verdict(kind, html, info.dead);
  }

  // ---------------------------------------------------------------- munck

  function prepModal() {
    busy = true;
    var items = shuffle(ZM.PREP);
    var mo = $('#modal');
    mo.innerHTML = '<div class="card"><div class="sh-kind">ANTES DE OPERAR</div><h3>Preparação do içamento</h3>' +
      '<p>Marque o que você vai fazer antes de levantar a carga:</p><div class="prep">' +
      items.map(function (p) { return '<label><input type="checkbox" value="' + p.id + '"><span>' + esc(p.label) + '</span></label>'; }).join('') +
      '</div><div class="btns"><button class="act primary" id="prep-ok">Começar a operar</button></div></div>';
    mo.classList.remove('hidden');
    $('#prep-ok').onclick = function () {
      var chosen = {};
      mo.querySelectorAll('input:checked').forEach(function (i) { chosen[i.value] = true; });
      crane.prep = chosen;
      crane.prepIssues = ZM.PREP.filter(function (p) { return p.ok ? !chosen[p.id] : chosen[p.id]; });
      mo.classList.add('hidden');
      mo.innerHTML = '';
      busy = false;
      if (crane.prepIssues.length) toast('⚠ Preparação incompleta: ' + crane.prepIssues.length + ' item(ns) — veja no fim da missão.', 'warn');
      renderMunck();
      lastT = performance.now();
      raf = requestAnimationFrame(loopMunck);
    };
  }

  var lastT = 0;
  function loopMunck(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (!busy && aim) moveTip(dt);
    if (!busy) raf = requestAnimationFrame(loopMunck);
  }

  function moveTip(dt) {
    var speed = 3.2, dx = aim.x - tip.x, dy = aim.y - tip.y, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 0.01) return;
    var step = Math.min(L, speed * dt), n = Math.max(1, Math.ceil(step / 0.04)), moved = false;
    for (var k = 1; k <= n; k++) {
      var cand = ZM.clampTip(m.pivot, { x: tip.x + dx / L * step * k / n, y: tip.y + dy / L * step * k / n }, m);
      var sh = ZM.crane(m.pivot, cand, m);
      if (ZM.rectsOverlap(sh.load, m.wall)) break;
      tip = cand;
      moved = true;
      var d = ZM.craneDistance(sh, m.cond);
      crane.minD = Math.min(crane.minD, d);
      if (d < z.zr) { contact(); return; }
      checkZones(d);
    }
    if (moved) renderMunck();
  }

  function checkZones(d) {
    var now = performance.now();
    if (d < z.zc) {
      if (!crane.enteredZC) { crane.enteredZC = true; }
      if (!crane.prep.alarme && now - crane.alarmAt > 550) { crane.alarmAt = now; A.play('warn'); flash('warn'); }
    }
    if (crane.prep.obs) {
      if (d < z.zc + 1.0 && !crane.warned) { crane.warned = true; A.play('radio'); toast('📻 Observador: "PARA! A lança está chegando perto da rede!"', 'radio'); }
      if (d > z.zc + 1.6) crane.warned = false;
    }
    crane.near = crane.prep.obs && d < z.zc + 1.0;
  }

  function loadInTarget() {
    var l = ZM.crane(m.pivot, tip, m).load;
    return l[0] >= m.target[0] && l[2] <= m.target[1] && l[1] < 0.35;
  }

  function renderMunck(contactPt) {
    var c = m.cond, sh = ZM.crane(m.pivot, tip, m), out = [defs(), floorSvg(), scaleBar()];
    var ready = loadInTarget();
    $('#act-main').disabled = !ready || busy;
    out.push('<rect x="' + X(m.target[0]) + '" y="' + Y(0.25) + '" width="' + ((m.target[1] - m.target[0]) * view.s) + '" height="' + (0.25 * view.s) + '" class="target' + (ready ? ' ready' : '') + '"/>');
    out.push('<text x="' + X((m.target[0] + m.target[1]) / 2) + '" y="' + (Y(0) + 16) + '" text-anchor="middle" class="target-t">ÁREA DE DESCARGA</text>');
    out.push('<rect x="' + X(m.wall[0]) + '" y="' + Y(m.wall[3]) + '" width="' + ((m.wall[2] - m.wall[0]) * view.s) + '" height="' + ((m.wall[3] - m.wall[1]) * view.s) + '" class="wall"/>');
    // poste e rede
    out.push('<line x1="' + X(c.x + 0.6) + '" y1="' + Y(0) + '" x2="' + X(c.x + 0.6) + '" y2="' + Y(c.y + 0.8) + '" class="struct" style="stroke-width:' + Math.max(4, 0.25 * view.s) + '"/>');
    out.push('<line x1="' + X(c.x - 0.4) + '" y1="' + Y(c.y + 0.4) + '" x2="' + X(c.x + 1.2) + '" y2="' + Y(c.y + 0.4) + '" class="struct"/>');
    out.push('<line x1="' + X(c.x) + '" y1="' + Y(c.y + 0.4) + '" x2="' + X(c.x) + '" y2="' + Y(c.y) + '" class="struct"/>');
    if (crane.near || contactPt) out.push('<circle cx="' + X(c.x) + '" cy="' + Y(c.y) + '" r="' + (z.zc * view.s) + '" class="zc-ghost"/>');
    if (contactPt) out.push('<circle cx="' + X(c.x) + '" cy="' + Y(c.y) + '" r="' + (z.zr * view.s) + '" class="zr-c"/>');
    out.push(condSvg(c, m.kv));
    // caminhão
    var bedY = 1.3;
    out.push('<rect x="' + X(0.4) + '" y="' + Y(bedY) + '" width="' + (5.6 * view.s) + '" height="' + (0.5 * view.s) + '" class="truck"/>');
    out.push('<rect x="' + X(0.4) + '" y="' + Y(2.5) + '" width="' + (1.5 * view.s) + '" height="' + (1.7 * view.s) + '" class="cab"/>');
    [1.0, 3.4, 5.2].forEach(function (wx) { out.push('<circle cx="' + X(wx) + '" cy="' + Y(0.45) + '" r="' + (0.45 * view.s) + '" class="wheel"/>'); });
    out.push('<line x1="' + X(m.pivot.x) + '" y1="' + Y(bedY) + '" x2="' + X(m.pivot.x) + '" y2="' + Y(m.pivot.y) + '" class="boom" style="stroke-width:' + Math.max(6, 0.3 * view.s) + '"/>');
    if (crane.prep.patola) {
      out.push('<line x1="' + X(0.9) + '" y1="' + Y(0.9) + '" x2="' + X(0.2) + '" y2="' + Y(0) + '" class="patola"/>');
      out.push('<line x1="' + X(5.6) + '" y1="' + Y(0.9) + '" x2="' + X(6.4) + '" y2="' + Y(0) + '" class="patola"/>');
    }
    if (crane.prep.area) [7, 8.2, m.target[1] + 0.6].forEach(function (cx) {
      out.push('<path d="M' + P(cx - 0.25, 0) + ' L' + P(cx, 0.7) + ' L' + P(cx + 0.25, 0) + 'Z" class="cone"/>');
    });
    if (crane.prep.obs) {
      var ox = 7.4;
      out.push(personSvg(ox));
      if (crane.near) {
        out.push('<rect x="' + (X(ox) - 46) + '" y="' + (Y(2.4) - 30) + '" width="92" height="22" rx="8" class="bubble"/>' +
          '<text x="' + X(ox) + '" y="' + (Y(2.4) - 15) + '" text-anchor="middle" class="bubble-t">PARA! PERTO!</text>');
      }
    }
    // lança, cabo e carga
    out.push('<g class="' + (contactPt ? 'contact' : '') + '">');
    out.push('<line x1="' + X(m.pivot.x) + '" y1="' + Y(m.pivot.y) + '" x2="' + X(tip.x) + '" y2="' + Y(tip.y) + '" class="boom" style="stroke-width:' + Math.max(6, 0.32 * view.s) + '"/>');
    out.push('<line x1="' + X(m.pivot.x) + '" y1="' + Y(m.pivot.y) + '" x2="' + X(tip.x) + '" y2="' + Y(tip.y) + '" class="boom-in"/>');
    out.push('<line x1="' + X(sh.cable[0]) + '" y1="' + Y(sh.cable[1]) + '" x2="' + X(sh.cable[2]) + '" y2="' + Y(sh.cable[3]) + '" class="cable"/>');
    var l = sh.load;
    out.push('<rect x="' + X(l[0]) + '" y="' + Y(l[3]) + '" width="' + ((l[2] - l[0]) * view.s) + '" height="' + ((l[3] - l[1]) * view.s) + '" class="load"/>');
    out.push('</g>');
    if (contactPt) {
      for (var k = 0; k < 6; k++) {
        out.push('<circle cx="' + (X(c.x) + (Math.random() - 0.5) * 30) + '" cy="' + (Y(c.y) + (Math.random() - 0.5) * 30) + '" r="' + (3 + Math.random() * 5) + '" class="spark"/>');
      }
    }
    if (!aim && !contactPt) out.push('<text x="450" y="60" text-anchor="middle" class="tip-l">☝ Arraste na cena para mover a ponta da lança</text>');
    $('#scene').innerHTML = out.join('');
  }

  function contact() {
    busy = true;
    crane.contact = true;
    cancelAnimationFrame(raf);
    renderMunck(true);
    flash('dead');
    A.play('arc');
    document.body.classList.add('shake');
    setTimeout(function () { document.body.classList.remove('shake'); }, 900);
    st.helmets--;
    var hl = $('#h-lives'); hl.classList.remove('hit'); void hl.offsetWidth; hl.classList.add('hit');
    updateHud();
    var em = ZM.missions.filter(function (x) { return x.type === 'emerg' && !x.fire; })[0];
    var scenario = Object.assign({}, em, {
      title: 'ENCOSTOU NA REDE!',
      text: 'A lança do munck encostou na rede de ' + kvLabel(m.kv) + '. O caminhão está energizado e você está na cabine. Não há fogo.'
    });
    setTimeout(function () {
      emergency(scenario, function (ok, opt, timeout) {
        var html, kind = ok ? 'warn' : 'dead';
        var lesson = 'A lança, o cabo e a carga contam na distância. Com a rede no caminho, passar perto dela exige planejar a trajetória, observador dedicado e respeitar o alcance máximo.';
        record({ dead: !ok, points: 0 }, kind, ok ? 'Lança na rede — você sobreviveu' : 'Lança na rede — e a saída errada',
          lesson + (ok ? '' : ' ' + (timeout ? 'Você travou na hora da emergência.' : opt.why)), m.ref);
        html = '<div class="v-icon">' + (ok ? '😮‍💨' : '💀') + '</div><h2>' + (ok ? 'SOBREVIVEU' : 'NÃO SAIU VIVO') + '</h2>' +
          '<p>' + (ok ? 'A decisão na cabine estava certa. Mas a lança nunca deveria ter chegado lá.' : esc(timeout ? 'Você travou e não agiu.' : opt.why)) + '</p>' +
          '<div class="lesson"><b>Por quê</b><p>' + esc(lesson) + '</p></div>' +
          '<div class="refs">📖 ' + esc(ZM.REF.tocou) + '<br>📁 Caso real: ' + esc(ZM.REF.caso4) + '</div>';
        if (!ok) { st.helmets--; updateHud(); }
        verdict(kind, html, !ok);
      });
    }, 1400);
  }

  function dropLoad() {
    if (busy || !loadInTarget()) return;
    busy = true;
    cancelAnimationFrame(raf);
    A.play('clunk');
    flash('ok');
    var issues = crane.prepIssues || [];
    var pts = 1000 - issues.length * 150 - (crane.enteredZC ? 300 : 0);
    pts = Math.max(100, pts);
    var title = crane.enteredZC || issues.length ? 'CARGA ENTREGUE… MAS' : 'IÇAMENTO PERFEITO';
    var notes = [];
    if (crane.enteredZC) notes.push('A lança/carga entrou na zona controlada (' + fm(z.zc) + '): chegou a ' + fm(crane.minD) + ' da rede.');
    issues.forEach(function (p) { notes.push((p.ok ? 'Faltou: ' : 'Errado: ') + p.label.replace(/^\S+\s/, '') + ' — ' + p.why); });
    var lesson = notes.length ? notes.join(' ') : 'Distância respeitada em toda a trajetória (mínimo de ' + fm(crane.minD) + '), com preparação completa.';
    record({ points: pts }, notes.length ? 'warn' : 'ok', title, lesson);
    var html = '<div class="v-icon">' + (notes.length ? '⚠️' : '🏗️') + '</div><h2>' + title + '</h2><div class="v-pts">+' + pts + '</div>' +
      '<div class="v-measure"><div class="you"><b>' + fm(crane.minD) + '</b><span>menor distância</span></div>' +
      '<div class="r"><b>' + fm(z.zr) + '</b><span>zona de risco</span></div><div class="c"><b>' + fm(z.zc) + '</b><span>zona controlada</span></div></div>' +
      (notes.length ? '<div class="v-list">' + notes.map(function (n) { return '<div>⚠ ' + esc(n) + '</div>'; }).join('') + '</div>' : '') +
      '<div class="refs">📖 ' + esc(m.ref) + '<br>📖 ' + esc(ZM.REF.munck) + '</div>';
    st.score += pts;
    verdict(notes.length ? 'warn' : 'ok', html, false, true);
  }

  // ---------------------------------------------------------------- emergência

  function emergency(sc, done) {
    busy = true;
    var opts = shuffle(sc.options), secs = 20, t0 = performance.now();
    var mo = $('#modal');
    mo.innerHTML = '<div class="card emerg-card"><div class="emerg-scene">' + esc(sc.scene || '🏗️⚡💥') + '</div><h2>' + esc(sc.title) + '</h2>' +
      '<p>' + esc(sc.text) + '</p><div class="timer"><i id="em-t"></i></div><div class="opts">' +
      opts.map(function (o, i) { return '<button class="act" data-o="' + i + '">' + esc(o.t) + '</button>'; }).join('') + '</div></div>';
    mo.classList.remove('hidden');
    A.play('arcSmall');
    A.heartbeat(true, 140);
    var answered = false;
    function finish(o, timeout) {
      if (answered) return;
      answered = true;
      clearInterval(emergTimer);
      A.heartbeat(false);
      mo.classList.add('hidden');
      mo.innerHTML = '';
      done(!!(o && o.ok), o, timeout);
    }
    mo.onclick = function (ev) { var b = ev.target.closest('[data-o]'); if (b) finish(opts[+b.dataset.o]); };
    emergTimer = setInterval(function () {
      var left = 1 - (performance.now() - t0) / (secs * 1000);
      var bar = $('#em-t');
      if (bar) bar.style.transform = 'scaleX(' + Math.max(0, left) + ')';
      if (left <= 0) finish(null, true);
    }, 100);
  }

  function finishEmerg(ok, opt, timeout) {
    var pts = ok ? 800 : 0;
    var lesson = m.why;
    record({ dead: !ok, points: pts }, ok ? 'ok' : 'dead', ok ? 'Decisão certa' : 'Decisão fatal', ok ? lesson : (timeout ? 'Você travou. ' : opt.why + ' ') + lesson);
    if (ok) { st.score += pts; flash('ok'); A.play('beep'); } else { flash('dead'); A.play('zap'); st.helmets--; updateHud(); }
    var html = '<div class="v-icon">' + (ok ? '✅' : '💀') + '</div><h2>' + (ok ? 'DECISÃO CERTA' : 'DECISÃO FATAL') + '</h2>' +
      (ok ? '<div class="v-pts">+' + pts + '</div>' : '<p>' + esc(timeout ? 'O tempo acabou e você não agiu.' : opt.why) + '</p>') +
      '<div class="lesson"><b>O certo</b><p>' + esc(m.why) + '</p></div><div class="refs">📖 ' + esc(m.ref) + '<br>📁 Caso real: ' + esc(ZM.REF.caso4) + '</div>';
    verdict(ok ? 'ok' : 'dead', html, !ok, true);
  }

  // ---------------------------------------------------------------- veredito e fim

  function record(info, kind, title, lesson, ref) {
    st.log.push({ mission: m, kind: kind, title: title, lesson: lesson, ref: ref || m.ref, points: info.points || 0 });
  }

  function verdict(kind, html, lostHelmet, scored) {
    busy = true;
    if (lostHelmet && m.type === 'aprox') { st.helmets--; }
    if (!scored && !lostHelmet && m.type === 'aprox') st.score += st.log[st.log.length - 1].points;
    if (lostHelmet) { var hl = $('#h-lives'); hl.classList.remove('hit'); void hl.offsetWidth; hl.classList.add('hit'); }
    updateHud();
    var last = st.i + 1 >= ZM.missions.length, over = st.helmets <= 0;
    var mo = $('#modal');
    mo.innerHTML = '<div class="card verdict ' + kind + '">' + html +
      '<div class="btns"><button class="act primary" id="v-next">' + (over ? 'Ver resultado' : last ? 'Fim do turno →' : 'Próxima missão →') + '</button></div></div>';
    mo.classList.remove('hidden');
    mo.onclick = function (ev) {
      if (!ev.target.closest('#v-next')) return;
      mo.classList.add('hidden');
      mo.innerHTML = '';
      mo.onclick = null;
      if (over || last) end(over); else loadMission(st.i + 1);
    };
  }

  function end(dead) {
    cancelAnimationFrame(raf);
    A.play(dead ? 'flatline' : 'win');
    var best = loadBest(), isRecord = st.score > 0 && (!best || st.score > best.score);
    if (isRecord) saveBest({ score: st.score });
    var html = '<div class="hazard"></div><div class="end-head' + (dead ? ' dead' : '') + '">' +
      (dead ? '<div class="flatline"></div>' : '<div class="e-icon">🏁</div>') +
      '<h2' + (dead ? ' class="glitch" data-t="GAME OVER"' : '') + '>' + (dead ? 'GAME OVER' : 'TURNO CONCLUÍDO') + '</h2>' +
      (dead ? '<div class="end-sub">3 capacetes perdidos na missão ' + (st.i + 1) + '</div>' : '') +
      '<div class="who">' + whoLine() + '</div>' +
      '<div class="end-score">' + st.score + (isRecord ? ' 🏆' : '') + '</div><div class="end-rank">' + esc(rank(st.score)) + '</div></div>';
    html += '<div class="review"><h3>Resumo das missões</h3>' + st.log.map(function (l, i) {
      return '<div class="rv ' + l.kind + '"><div class="rv-k">' + (l.kind === 'dead' ? '💀' : l.kind === 'warn' ? '⚠️' : '✅') + ' Missão · ' +
        esc(l.mission.title) + ' · +' + l.points + '</div><div class="rv-t">' + esc(l.title) + '</div><p>' + esc(l.lesson) + '</p><em>📖 ' + esc(l.ref) + '</em></div>';
    }).join('') + '</div>';
    html += '<div class="table-cta"><b>📏 Para não esquecer — raios de referência (slide 96)</b><table><tr><th>Tensão</th><th>Zona de risco</th><th>Zona controlada</th></tr>' +
      ZM.ZONES.map(function (zz) { return '<tr><td>' + zz.label + '</td><td>' + fm(zz.zr) + '</td><td>' + fm(zz.zc) + '</td></tr>'; }).join('') +
      '</table><small>Valores ilustrativos do curso — utilize o anexo vigente da NR-10 para cada tensão.</small></div>';
    html += '<div class="btns"><button class="act primary big" id="e-again">↻ Jogar de novo</button><button class="act ghost" id="e-menu">Menu</button></div>' +
      '<div class="other-games"><a href="../index.html">⚡ Desenergiza ou Morre</a><a href="../para-ou-libera/index.html">✋ Para ou Libera</a><a href="../veste-ou-queima/index.html">🧥 Veste ou Queima</a><a href="../pericia/index.html">🔍 Perícia SEP</a></div>';
    $('#end-body').innerHTML = html;
    setTimeout(function () { show('zm-end'); }, dead ? 600 : 200);
  }

  function quit() {
    cancelAnimationFrame(raf);
    clearInterval(emergTimer);
    A.heartbeat(false);
    $('#modal').classList.add('hidden');
    renderMenu();
    show('zm-menu');
  }

  // ---------------------------------------------------------------- entrada

  var dragging = false;
  var scene = $('#scene');
  scene.addEventListener('pointerdown', function (ev) {
    if (!m || busy || m.type === 'emerg') return;
    dragging = true;
    scene.setPointerCapture(ev.pointerId);
    pointer(ev);
  });
  scene.addEventListener('pointermove', function (ev) { if (dragging) pointer(ev); });
  scene.addEventListener('pointerup', function () { dragging = false; });
  scene.addEventListener('pointercancel', function () { dragging = false; });

  function pointer(ev) {
    var p = toWorld(ev);
    if (m.type === 'aprox') {
      tip = { x: Math.max(m.reach.x0, Math.min(m.reach.x1, p.x)), y: Math.max(m.reach.y0, Math.min(m.reach.y1, p.y)) };
      renderAprox();
    } else if (m.type === 'munck') {
      aim = p;
    }
  }

  document.addEventListener('keydown', function (ev) {
    if (!$('#zm-game').classList.contains('active') || busy || !m) return;
    var k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
    if (!k) { if (ev.key === 'Enter') $('#act-main').click(); return; }
    ev.preventDefault();
    if (m.type === 'aprox') {
      var stp = 0.02 * Math.max(1, m.view.w / 5);
      tip = { x: Math.max(m.reach.x0, Math.min(m.reach.x1, tip.x + k[0] * stp)), y: Math.max(m.reach.y0, Math.min(m.reach.y1, tip.y + k[1] * stp)) };
      renderAprox();
    } else if (m.type === 'munck') {
      aim = { x: tip.x + k[0] * 0.6, y: tip.y + k[1] * 0.6 };
    }
  });

  $('#act-main').addEventListener('click', function () {
    if (!m || busy) return;
    if (m.type === 'aprox') confirmAprox(); else if (m.type === 'munck') dropLoad();
  });
  $('#zm-start').addEventListener('click', start);
  $('#zm-quit').addEventListener('click', quit);
  $('#end-body').addEventListener('click', function (ev) {
    if (ev.target.closest('#e-again')) start();
    else if (ev.target.closest('#e-menu')) quit();
  });
  $('#zm-sound').addEventListener('click', function () {
    var mu = !A.isMuted();
    A.setMuted(mu);
    try { localStorage.setItem('dom-muted', mu ? '1' : ''); } catch (e) { /* sem storage */ }
    this.textContent = mu ? '🔇' : '🔊';
  });
  try { if (localStorage.getItem('dom-muted')) { A.setMuted(true); $('#zm-sound').textContent = '🔇'; } } catch (e) { /* sem storage */ }

  var nameEl = $('#player-name');
  try { nameEl.value = localStorage.getItem('sep-nome') || ''; } catch (e) { /* sem storage */ }
  nameEl.addEventListener('input', function () {
    try { localStorage.setItem('sep-nome', nameEl.value.trim()); } catch (e) { /* sem storage */ }
    if (nameEl.value.trim().length >= 2) { $('#name-err').classList.add('hidden'); nameEl.classList.remove('err'); }
  });
  nameEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') start(); });

  renderMenu();
  window.ZM.ui = {
    start: start, load: loadMission,
    state: function () { return { st: st, m: m, tip: tip, crane: crane, busy: busy }; },
    setTip: function (p) { tip = p; if (m.type === 'aprox') renderAprox(); else renderMunck(); },
    aim: function (p) { aim = p; }
  };
})();
