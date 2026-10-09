/*
 * Interface do "Veste ou Queima": etiqueta de arc flash, medidas coletivas, armário de EPI,
 * boneco vestido em SVG, teste do arco com mapa de queimaduras e revisão no fim.
 */
(function () {
  'use strict';
  var VQ = window.VQ, A = window.SEP.audio;
  var $ = function (s) { return document.querySelector(s); };

  var TIME = 75;                 // segundos para vestir cada tarefa
  var SINGLE = ['corpo', 'cabeca', 'maos', 'pes', 'intima'];
  // O que o eletricista "veste" se o tempo acabar sem escolher: a roupa do dia a dia.
  var DEFAULTS = { corpo: 'sint', cabeca: 'bone', maos: 'vaq', pes: 'tenis', intima: 'isint' };

  var COLORS = {
    sint: '#5fb3e6', alg: '#8a96a6', fr8: '#24406e', fr25: '#8b7a4e', fr40: '#b8c2cc',
    vaq: '#8a5a2b', c00: '#e8d6b0', c0: '#d33a2c', c2: '#ffd400', c4: '#ff8a1f',
    tenis: '#f2f2f2', aco: '#222', isol: '#4a2f1a', isint: '#c04fd8', ialg: '#f2f2f2'
  };

  var st = null, task = null, kit = null, epc = null, tab = 'corpo', timer = null, left = TIME, busy = false;

  // ---------------------------------------------------------------- utilidades

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function show(id) {
    document.querySelectorAll('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo(0, 0);
  }
  function helmets(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '🪖' : '💀'; return s; }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function num(v) { return String(v).replace('.', ','); }
  function loadBest() { try { return JSON.parse(localStorage.getItem('vq-best') || 'null'); } catch (e) { return null; } }
  function saveBest(b) { try { localStorage.setItem('vq-best', JSON.stringify(b)); } catch (e) { /* sem storage */ } }
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
  function flash(kind) {
    var f = $('#flash');
    f.className = 'vq-flash';
    void f.offsetWidth;
    f.className = 'vq-flash ' + kind;
  }
  var RANKS = [[0, 'Churrasquinho de Arco'], [3000, 'Aprendiz de Armário'], [6000, 'Vestido pra Matar (o risco)'], [8500, 'Guardião do ATPV'], [10000, 'Lenda do Arc Flash ⚡']];
  function injIcon(x) { return /Choque/.test(x.msg) ? '⚡' : /ignição/.test(x.msg) ? '💥' : '🔥'; }
  function rank(s) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (s >= x[0]) r = x[1]; }); return r; }

  // ---------------------------------------------------------------- turno

  function renderMenu() {
    var b = loadBest();
    $('#vq-best').innerHTML = b ? '<span>Recorde: ' + b.score + ' pts</span><span class="rank-name">' + esc(rank(b.score)) + '</span>' : '';
  }

  function start() {
    A.init();
    if (!requireName()) return;
    st = { i: 0, score: 0, helmets: 3, log: [] };
    show('vq-game');
    loadTask(0);
  }

  function updateHud() {
    $('#h-task').textContent = (st.i + 1) + '/' + VQ.TASKS.length;
    $('#h-lives').textContent = helmets(st.helmets);
    $('#h-score').textContent = st.score;
    var t = $('#h-time');
    t.textContent = fmt(left);
    t.classList.toggle('low', left <= 15);
  }

  function loadTask(i) {
    st.i = i;
    task = VQ.TASKS[i];
    kit = { corpo: null, cabeca: null, maos: null, pes: null, intima: null, extras: [] };
    epc = null;
    tab = 'corpo';
    busy = false;
    left = TIME;
    $('#t-place').textContent = task.place;
    $('#t-title').textContent = (i + 1) + '. ' + task.title;
    $('#t-text').textContent = task.text;
    $('#avatar-box').classList.remove('blasting');
    renderLabel();
    renderEpc();
    renderLocker();
    renderAvatar();
    updateHud();
    clearInterval(timer);
    var last = performance.now();
    timer = setInterval(function () {
      var now = performance.now();
      if (!busy) left -= (now - last) / 1000;
      last = now;
      updateHud();
      if (left <= 0 && !busy) { left = 0; runTest(true); }
    }, 200);
  }

  function renderLabel() {
    var e = epc ? epc.E : task.E;
    var eTxt = epc ? '<s>' + num(task.E) + '</s><span class="new">' + num(e) + ' cal/cm²</span>' : num(task.E) + ' cal/cm²';
    $('#label').innerHTML = '<div class="al-h">⚠ ATENÇÃO · RISCO DE ARCO ELÉTRICO</div><div class="al-b">' +
      '<span>Energia incidente</span><b class="al-e">' + eTxt + '</b>' +
      '<span>Distância de trabalho</span><b>45 cm</b>' +
      '<span>Tensão</span><b>' + esc(VQ.kvLabel(task.kv)) + '</b>' +
      '<span>Fronteira de arco</span><b>' + esc(task.boundary) + '</b></div>';
  }

  function renderEpc() {
    var el = $('#epc');
    if (!task.epc || !task.epc.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="epc-h">ANTES DO EPI — DÁ PARA REDUZIR O RISCO?</div>' + task.epc.map(function (x) {
      return '<button class="act' + (epc && epc.id === x.id ? ' on' : '') + '" data-epc="' + x.id + '">' + esc(x.label) + '</button>';
    }).join('');
  }

  // ---------------------------------------------------------------- armário

  function slotDone(id) { return id === 'extras' ? kit.extras.length > 0 : !!kit[id]; }

  function renderLocker() {
    $('#tabs').innerHTML = VQ.SLOTS.map(function (s) {
      return '<button class="tab' + (s.id === tab ? ' on' : '') + (slotDone(s.id) ? ' done' : '') + '" data-tab="' + s.id + '">' + s.icon + ' ' + esc(s.label) + '</button>';
    }).join('');
    var slot = VQ.SLOTS.filter(function (s) { return s.id === tab; })[0];
    $('#items').innerHTML = slot.items.map(function (it) {
      var on = slot.multi ? kit.extras.indexOf(it.id) >= 0 : kit[slot.id] === it.id;
      var sw = COLORS[it.id] ? '<span class="sw" style="background:' + COLORS[it.id] + '"></span>' : '';
      return '<button class="it' + (on ? ' on' : '') + '" data-item="' + it.id + '">' + sw + '<span>' + esc(it.label) + '</span></button>';
    }).join('') + (slot.multi ? '<p class="b-hint" style="color:var(--dim);font-size:13px;margin:4px 2px">Marque só o que a tarefa exige. Pode ser nenhum.</p>' : '');
  }

  function pick(id) {
    if (busy) return;
    var slot = VQ.SLOTS.filter(function (s) { return s.id === tab; })[0];
    if (slot.multi) {
      var k = kit.extras.indexOf(id);
      if (k >= 0) kit.extras.splice(k, 1); else kit.extras.push(id);
    } else {
      kit[slot.id] = id;
      var next = SINGLE.filter(function (s) { return !kit[s]; })[0];
      if (next) tab = next; else if (slot.id !== 'extras') tab = 'extras';
    }
    A.play('click');
    renderLocker();
    renderAvatar();
  }

  // ---------------------------------------------------------------- boneco

  function renderAvatar(result) {
    var k = kit, o = [];
    var body = COLORS[k.corpo] || '#3a4656', under = k.corpo ? null : COLORS[k.intima];
    var legs = k.corpo === 'sint' ? '#33507a' : k.corpo === 'alg' ? '#5d6878' : body;
    // pernas e tronco
    o.push('<rect x="70" y="210" width="27" height="125" rx="8" fill="' + (k.corpo ? legs : (under || '#e8b48a')) + '" class="av-line"/>');
    o.push('<rect x="103" y="210" width="27" height="125" rx="8" fill="' + (k.corpo ? legs : (under || '#e8b48a')) + '" class="av-line"/>');
    o.push('<rect x="62" y="96" width="76" height="124" rx="16" fill="' + (k.corpo ? body : '#e8b48a') + '" class="av-line"/>');
    if (!k.corpo && k.intima) o.push('<rect x="68" y="195" width="64" height="30" rx="6" fill="' + under + '"/>');
    // braços
    var arm = k.corpo ? body : '#e8b48a';
    o.push('<rect x="38" y="100" width="24" height="104" rx="11" fill="' + arm + '" class="av-line"/>');
    o.push('<rect x="138" y="100" width="24" height="104" rx="11" fill="' + arm + '" class="av-line"/>');
    if (k.extras.indexOf('mangas') >= 0) {
      o.push('<rect x="38" y="140" width="24" height="64" rx="10" fill="#7a1d1d" class="av-line"/>');
      o.push('<rect x="138" y="140" width="24" height="64" rx="10" fill="#7a1d1d" class="av-line"/>');
    }
    if (k.corpo === 'fr40') o.push('<path d="M100 100 L100 215" stroke="#8a96a6" stroke-width="3"/>');
    if (k.extras.indexOf('colete') >= 0) {
      o.push('<path d="M66 102 L134 102 L134 196 L66 196 Z" class="vest"/>');
      o.push('<line x1="66" y1="150" x2="134" y2="150" class="vest-s"/><line x1="66" y1="176" x2="134" y2="176" class="vest-s"/>');
    }
    if (k.extras.indexOf('cinto') >= 0) {
      o.push('<path d="M72 100 L92 210 M128 100 L108 210 M66 200 L134 200 M74 214 L96 250 M126 214 L104 250" class="harness"/>');
    }
    // mãos e pés
    var glove = COLORS[k.maos] || '#e8b48a';
    o.push('<circle cx="50" cy="214" r="15" fill="' + glove + '" class="av-line"/><circle cx="150" cy="214" r="15" fill="' + glove + '" class="av-line"/>');
    if (k.extras.indexOf('lanEx') >= 0 || k.extras.indexOf('lanCom') >= 0) {
      var ex = k.extras.indexOf('lanEx') >= 0;
      o.push('<rect x="158" y="200" width="30" height="13" rx="3" fill="' + (ex ? '#2f8f4f' : '#666') + '"/><path d="M188 200 L198 194 L198 219 L188 213 Z" fill="#ffe680"/>');
      o.push('<text x="166" y="210" font-size="8" font-weight="900" fill="#fff">' + (ex ? 'Ex' : '') + '</text>');
    }
    var foot = COLORS[k.pes] || '#e8b48a';
    o.push('<ellipse cx="82" cy="345" rx="20" ry="11" fill="' + foot + '" class="av-line"/><ellipse cx="118" cy="345" rx="20" ry="11" fill="' + foot + '" class="av-line"/>');
    if (k.pes === 'aco') o.push('<ellipse cx="68" cy="345" rx="7" ry="8" fill="#c0c8d0"/><ellipse cx="132" cy="345" rx="7" ry="8" fill="#c0c8d0"/>');
    // cabeça
    if (k.cabeca === 'capuz40') {
      o.push('<rect x="64" y="20" width="72" height="84" rx="30" fill="#b8c2cc" class="av-line"/>');
      o.push('<rect x="78" y="44" width="44" height="30" rx="8" fill="rgba(60,200,120,.45)" stroke="#6fe0a0" stroke-width="2"/>');
      o.push('<path d="M62 30 Q100 2 138 30 L138 36 L62 36 Z" class="helmet"/>');
    } else {
      o.push('<circle cx="100" cy="62" r="30" class="skin av-line"/>');
      o.push('<circle cx="90" cy="58" r="3" fill="#222"/><circle cx="110" cy="58" r="3" fill="#222"/><path d="M90 76 Q100 82 110 76" stroke="#222" stroke-width="2" fill="none"/>');
      if (k.cabeca === 'bone') o.push('<path d="M70 50 Q100 18 130 50 Z" fill="#2f6fd0"/><path d="M128 48 L150 52 L128 54 Z" fill="#2f6fd0"/>');
      if (k.cabeca === 'cap' || k.cabeca === 'face12') {
        o.push('<path d="M66 50 Q100 12 134 50 L140 52 L60 52 Z" class="helmet"/>');
        if (k.cabeca === 'cap') o.push('<rect x="80" y="52" width="40" height="11" rx="5" fill="rgba(140,200,255,.6)" stroke="#9cf" stroke-width="1.5"/>');
      }
      if (k.cabeca === 'face12') o.push('<path d="M68 52 L132 52 L128 96 Q100 104 72 96 Z" class="shield"/>');
    }
    if (k.extras.indexOf('auric') >= 0) o.push('<rect x="58" y="50" width="12" height="24" rx="5" class="earmuff"/><rect x="130" y="50" width="12" height="24" rx="5" class="earmuff"/>');

    if (result) {
      var shapes = {
        cabeca: '<circle cx="100" cy="62" r="36"/>',
        corpo: '<rect x="38" y="96" width="124" height="124" rx="14"/><rect x="68" y="210" width="64" height="126" rx="8"/>',
        maos: '<circle cx="50" cy="214" r="18"/><circle cx="150" cy="214" r="18"/>',
        pes: '<ellipse cx="82" cy="345" rx="22" ry="13"/><ellipse cx="118" cy="345" rx="22" ry="13"/>'
      };
      var labels = { cabeca: [100, 14, 'FACE'], corpo: [100, 160, 'CORPO'], maos: [100, 218, 'MÃOS'], pes: [100, 372, 'PÉS'] };
      Object.keys(result.parts).forEach(function (p) {
        var sev = result.parts[p];
        o.push('<g class="dmg ' + (sev === 'ok' ? 'ok-mark' : sev) + '">' + shapes[p] + '</g>');
        var ic = p === 'maos' && result.shock ? '⚡' : p === 'pes' ? '⚠' : '🔥';
        if (sev !== 'ok') o.push('<text x="' + labels[p][0] + '" y="' + labels[p][1] + '" text-anchor="middle" class="part-l">' + labels[p][2] + ' ' + (sev === 'grave' ? ic + ic : ic) + '</text>');
      });
    }
    $('#avatar').innerHTML = o.join('');
  }

  // ---------------------------------------------------------------- teste do arco

  function runTest(timeout) {
    if (busy) return;
    var missing = SINGLE.filter(function (s) { return !kit[s]; });
    if (missing.length && !timeout) {
      tab = missing[0];
      renderLocker();
      var t = document.querySelector('.tab.on');
      if (t) t.animate([{ transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300 });
      return;
    }
    busy = true;
    missing.forEach(function (s) { kit[s] = DEFAULTS[s]; });
    if (missing.length) renderAvatar();
    var res = VQ.evaluate(task, kit, epc && epc.id);
    var box = $('#avatar-box');
    box.classList.remove('blasting');
    void box.offsetWidth;
    if (res.E >= VQ.BURN) { box.classList.add('blasting'); A.play('arc'); } else { A.play('arcSmall'); }
    setTimeout(function () {
      renderAvatar(res);
      if (res.outcome === 'morto') { flash('morto'); A.play(res.shock && res.parts.maos === 'grave' ? 'zap' : 'boom'); }
      else if (res.outcome === 'ferido') { flash('ferido'); A.play('warn'); }
      else { flash('ok'); A.play('beep'); }
      setTimeout(function () { verdict(res, timeout && missing.length); }, 1300);
    }, 1100);
  }

  function verdict(res, timedOut) {
    var titles = { perfeito: 'PROTEGIDO!', ok: 'PROTEGIDO… MAS', ferido: 'QUEIMADO', morto: 'LESÃO FATAL' };
    var icons = { perfeito: '🛡️', ok: '⚠️', ferido: '🔥', morto: '💀' };
    if (res.outcome === 'morto') {
      st.helmets--;
      var hl = $('#h-lives'); hl.classList.remove('hit'); void hl.offsetWidth; hl.classList.add('hit');
    }
    var bonus = Math.round(Math.max(0, left) * 4);
    var pts = res.points + (res.outcome === 'perfeito' || res.outcome === 'ok' ? bonus : 0);
    st.score += pts;
    updateHud();
    var list = res.injuries.map(function (x) { return '<div class="' + x.sev + '">' + injIcon(x) + ' ' + esc(x.msg) + '<em>📖 ' + esc(x.ref) + '</em></div>'; })
      .concat(res.infractions.map(function (x) { return '<div>⚠ ' + esc(x.msg) + '<em>📖 ' + esc(x.ref) + '</em></div>'; }));
    var lesson = '';
    if (res.outcome === 'morto' && task.note) lesson = task.note;
    else if (res.epc && res.epc.E < task.E) lesson = 'Você reduziu a energia de ' + num(task.E) + ' para ' + num(res.E) + ' cal/cm² antes de vestir: medida coletiva primeiro, EPI por último. +200';
    else if (task.epc && task.epc.length && !res.epc && res.outcome !== 'morto') lesson = 'Dava para reduzir o risco antes do EPI: ' + task.epc[0].label.replace(/^\S+\s/, '') + '. EPI é a última barreira.';
    st.log.push({ task: task, res: res, pts: pts, kit: JSON.parse(JSON.stringify(kit)), lesson: lesson });
    var over = st.helmets <= 0, last = st.i + 1 >= VQ.TASKS.length;
    var mo = $('#modal');
    mo.innerHTML = '<div class="card verdict ' + res.outcome + '"><div class="v-icon">' + icons[res.outcome] + '</div><h2>' + titles[res.outcome] + '</h2>' +
      '<div class="v-e">Energia no ponto: ' + num(res.E) + ' cal/cm² · ' + esc(VQ.kvLabel(task.kv)) + (timedOut ? ' · ⏱ o tempo acabou e ele foi com a roupa do dia a dia' : '') + '</div>' +
      (pts ? '<div class="v-pts">+' + pts + '</div>' : '') +
      (list.length ? '<div class="v-list">' + list.join('') + '</div>' : '<p>Cada parte do corpo protegida para a energia e a tensão do ponto.</p>') +
      (lesson ? '<div class="lesson"><b>' + (res.outcome === 'morto' ? 'O certo' : 'Hierarquia de controle') + '</b><p>' + esc(lesson) + '</p></div>' : '') +
      '<div class="btns"><button class="act primary" id="v-next">' + (over ? 'Ver resultado' : last ? 'Fim do turno →' : 'Próxima tarefa →') + '</button></div></div>';
    mo.classList.remove('hidden');
    mo.onclick = function (ev) {
      if (!ev.target.closest('#v-next')) return;
      mo.classList.add('hidden');
      mo.innerHTML = '';
      mo.onclick = null;
      if (over || last) end(over); else loadTask(st.i + 1);
    };
  }

  // ---------------------------------------------------------------- fim

  function itemLabel(slot, id) { var it = VQ.item(slot, id); return it ? it.label : '—'; }

  function end(dead) {
    clearInterval(timer);
    A.play(dead ? 'flatline' : 'win');
    var best = loadBest(), isRecord = st.score > 0 && (!best || st.score > best.score);
    if (isRecord) saveBest({ score: st.score });
    var icons = { perfeito: '🛡️', ok: '⚠️', ferido: '🔥', morto: '💀' };
    var html = '<div class="hazard"></div><div class="end-head' + (dead ? ' dead' : '') + '">' +
      (dead ? '<div class="flatline"></div>' : '<div class="e-icon">🏁</div>') +
      '<h2' + (dead ? ' class="glitch" data-t="GAME OVER"' : '') + '>' + (dead ? 'GAME OVER' : 'TURNO CONCLUÍDO') + '</h2>' +
      (dead ? '<div class="end-sub">3 lesões fatais na tarefa ' + (st.i + 1) + '</div>' : '') +
      '<div class="who">' + whoLine() + '</div>' +
      '<div class="end-score">' + st.score + (isRecord ? ' 🏆' : '') + '</div><div class="end-rank">' + esc(rank(st.score)) + '</div></div>';
    html += '<div class="review"><h3>Resumo das tarefas</h3>' + st.log.map(function (l) {
      var r = l.res;
      return '<div class="rv ' + r.outcome + '"><div class="rv-k">' + icons[r.outcome] + ' ' + esc(l.task.title) + ' · ' + num(r.E) + ' cal/cm² · +' + l.pts + '</div>' +
        '<div class="rv-t">' + esc(itemLabel('corpo', l.kit.corpo)) + ' · ' + esc(itemLabel('cabeca', l.kit.cabeca)) + ' · ' + esc(itemLabel('maos', l.kit.maos)) + '</div>' +
        r.injuries.map(function (x) { return '<p>' + injIcon(x) + ' ' + esc(x.msg) + '</p>'; }).join('') +
        r.infractions.map(function (x) { return '<p>⚠ ' + esc(x.msg) + '</p>'; }).join('') +
        (l.lesson ? '<p>💡 ' + esc(l.lesson) + '</p>' : '') + '</div>';
    }).join('') + '</div>';
    html += '<div class="cheat"><b>🧤 Para não esquecer — classes de luva (slide 82)</b><table><tr><th>Classe</th><th>Tensão máx. de uso</th><th>Aplicação</th></tr>' +
      '<tr><td>00</td><td>500 V</td><td>BT — comandos e medições</td></tr><tr><td>0</td><td>1.000 V</td><td>BT industrial</td></tr>' +
      '<tr><td>1</td><td>7.500 V</td><td>MT — manobras específicas</td></tr><tr><td>2</td><td>17.000 V</td><td>Redes 13,8 kV</td></tr>' +
      '<tr><td>3 / 4</td><td>26.500 / 36.000 V</td><td>34,5 kV e maiores</td></tr></table>' +
      '<p style="margin:10px 0 0">🔥 <b>Vestimenta:</b> ATPV maior que a energia incidente do ponto (slide 81). <b>Face:</b> protetor facial compatível com a energia (slide 80).</p></div>';
    html += '<div class="btns"><button class="act primary big" id="e-again">↻ Jogar de novo</button><button class="act ghost" id="e-menu">Menu</button></div>' +
      '<div class="other-games"><a href="../index.html">⚡ Desenergiza ou Morre</a><a href="../para-ou-libera/index.html">✋ Para ou Libera</a><a href="../zona-morta/index.html">☠️ Zona Morta</a></div>';
    $('#end-body').innerHTML = html;
    setTimeout(function () { show('vq-end'); }, dead ? 600 : 200);
  }

  function quit() {
    clearInterval(timer);
    $('#modal').classList.add('hidden');
    renderMenu();
    show('vq-menu');
  }

  // ---------------------------------------------------------------- eventos

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    var tb = t.closest('[data-tab]');
    if (tb && !busy) { tab = tb.dataset.tab; renderLocker(); return; }
    var it = t.closest('[data-item]');
    if (it) { pick(it.dataset.item); return; }
    var e = t.closest('[data-epc]');
    if (e && !busy) {
      var x = task.epc.filter(function (y) { return y.id === e.dataset.epc; })[0];
      epc = epc && epc.id === x.id ? null : x;
      A.play('click');
      renderEpc();
      renderLabel();
    }
  });
  $('#vq-test').addEventListener('click', function () { runTest(false); });
  $('#vq-start').addEventListener('click', start);
  $('#vq-quit').addEventListener('click', quit);
  $('#end-body').addEventListener('click', function (ev) {
    if (ev.target.closest('#e-again')) start();
    else if (ev.target.closest('#e-menu')) quit();
  });
  $('#vq-sound').addEventListener('click', function () {
    var mu = !A.isMuted();
    A.setMuted(mu);
    try { localStorage.setItem('dom-muted', mu ? '1' : ''); } catch (e) { /* sem storage */ }
    this.textContent = mu ? '🔇' : '🔊';
  });
  try { if (localStorage.getItem('dom-muted')) { A.setMuted(true); $('#vq-sound').textContent = '🔇'; } } catch (e) { /* sem storage */ }

  var nameEl = $('#player-name');
  try { nameEl.value = localStorage.getItem('sep-nome') || ''; } catch (e) { /* sem storage */ }
  nameEl.addEventListener('input', function () {
    try { localStorage.setItem('sep-nome', nameEl.value.trim()); } catch (e) { /* sem storage */ }
    if (nameEl.value.trim().length >= 2) { $('#name-err').classList.add('hidden'); nameEl.classList.remove('err'); }
  });
  nameEl.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') start(); });

  renderMenu();
  window.VQ.ui = { start: start, state: function () { return { st: st, task: task, kit: kit, epc: epc, busy: busy }; } };
})();
