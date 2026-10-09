/*
 * Motor de simulação do "Desenergiza ou Morre".
 * Modela o diagrama unifilar como um grafo: nós (barras/trechos) ligados por
 * dispositivos de manobra (disjuntores 52, seccionadoras 89) e links fixos
 * (condutores, transformadores). A energização é calculada por busca a partir
 * das fontes. Não depende do DOM — pode rodar no Node para testes.
 */
(function (root) {
  'use strict';

  var REF = {
    desligar: 'Módulo 4 · Desligar não é desenergizar (slide 55)',
    etapa1: 'Módulo 4 · Etapa 1 — Seccionamento (slide 58)',
    etapa2: 'Módulo 4 · Etapa 2 — Impedimento de reenergização (slide 59)',
    loto: 'Módulo 4 · Bloqueio e etiquetagem — LOTO (slide 60)',
    etapa3: 'Módulo 4 · Etapa 3 — Constatação de ausência de tensão (slide 61)',
    etapa4: 'Módulo 4 · Etapa 4 — Aterramento temporário (slide 62)',
    etapa5: 'Módulo 4 · Etapa 5 — Proteção dos elementos energizados (slide 64)',
    etapa6: 'Módulo 4 · Etapa 6 — Sinalização (slide 65)',
    liberacao: 'Módulo 4 · Liberação para o serviço (slide 66)',
    reenerg: 'Módulo 4 · Reenergização — ordem inversa (slide 67)',
    erros: 'Módulo 4 · Erros que matam na desenergização (slide 68)',
    cogeracao: 'Módulo 2 · Cogeração com biomassa na usina (slide 28)',
    ilhamento: 'Módulo 2 · O perigo do ilhamento (slide 32)',
    inducao: 'Módulo 8 · (c) Controle da tensão induzida (slide 126)',
    sequencia: 'Módulo 17 · Sequência de operação (slide 254)',
    secc: 'Módulo 17 · Manobra de seccionadoras sem carga (slide 256)',
    autorizacao: 'Módulo 17 · Comunicação e autorização de manobra (slide 260)',
    paralelo: 'Módulo 17 · Manobras na cogeração e paralelismo (slide 261)',
    errosManobra: 'Módulo 17 · Erros comuns em manobras (slide 262)',
    caso1: 'Módulo 18 · Caso 1 — contato em MT por falha de bloqueio (slide 268)',
    caso2: 'Módulo 18 · Caso 2 — arco em manobra de cubículo (slide 269)',
    caso3: 'Módulo 18 · Caso 3 — tensão induzida em linha desligada (slide 270)'
  };

  var SYNC_TOL = 12; // graus de defasagem aceitos no fechamento do paralelo

  function ev(type, msg, extra) {
    var e = { type: type, msg: msg };
    if (extra) for (var k in extra) e[k] = extra[k];
    return e;
  }

  function rnd(min, max) { return Math.round(min + Math.random() * (max - min)); }

  function Game(level) {
    this.level = level;
    var st = level.start || {};
    var s = this.s = {
      dev: {}, grounds: {}, covers: {}, tests: {},
      signed: !!st.signed,
      authorized: false,
      version: 0,
      detector: { tested: false, faulty: !!level.detectorFaulty, knownFaulty: false },
      teamOut: level.mode !== 'reenergize',
      infractions: [],
      bonus: 0,
      over: false,
      result: null
    };
    for (var id in level.devices) {
      var d = level.devices[id];
      s.dev[id] = { closed: d.closed !== false, locks: ((st.locks && st.locks[id]) || []).slice() };
    }
    (st.grounds || []).forEach(function (n) { s.grounds[n] = true; });
    (st.covers || []).forEach(function (n) { s.covers[n] = true; });
  }

  // ---------- grafo ----------

  Game.prototype.neighbors = function (n, pass) {
    var out = [], L = this.level;
    for (var id in L.devices) {
      var d = L.devices[id];
      if (!pass(id)) continue;
      if (d.a === n) out.push(d.b); else if (d.b === n) out.push(d.a);
    }
    (L.links || []).forEach(function (l) {
      if (l.a === n) out.push(l.b); else if (l.b === n) out.push(l.a);
    });
    return out;
  };

  Game.prototype.reach = function (start, pass) {
    var seen = {}, q = [start];
    seen[start] = true;
    while (q.length) {
      var n = q.shift();
      var nb = this.neighbors(n, pass);
      for (var i = 0; i < nb.length; i++) if (!seen[nb[i]]) { seen[nb[i]] = true; q.push(nb[i]); }
    }
    return seen;
  };

  Game.prototype.sourcesAt = function (n) {
    var self = this;
    var closed = function (id) { return self.s.dev[id].closed; };
    return (this.level.sources || []).filter(function (src) { return self.reach(src.node, closed)[n]; });
  };

  Game.prototype.isLive = function (n) { return this.sourcesAt(n).length > 0; };

  Game.prototype.voltageAt = function (n) {
    var src = this.sourcesAt(n);
    if (src.length) return { kind: 'real', sources: src };
    if ((this.level.induced || []).indexOf(n) >= 0 && !this.s.grounds[n]) return { kind: 'induced' };
    return { kind: 'none' };
  };

  // Dispositivos que, mesmo abertos, ainda poderiam ser religados porque não têm cadeado.
  Game.prototype.unlockedPaths = function () {
    var self = this, L = this.level, s = this.s;
    var pass = function (id) { var st = s.dev[id]; return !(st.locks.length && !st.closed); };
    var hit = false, reach = {};
    (L.sources || []).forEach(function (src) {
      var r = self.reach(src.node, pass);
      for (var k in r) reach[k] = true;
      L.zone.forEach(function (z) { if (r[z]) hit = true; });
    });
    if (!hit) return [];
    var list = [];
    for (var id in L.devices) {
      var d = L.devices[id], st = s.dev[id];
      if (!st.closed && !st.locks.length && (reach[d.a] || reach[d.b])) list.push(d.label);
    }
    return list.length ? list : ['algum ponto de manobra'];
  };

  // Existe isolação visível (seccionadora/extraível aberta) entre cada fonte e a zona?
  Game.prototype.visibleIsolation = function () {
    var self = this, L = this.level, s = this.s;
    var pass = function (id) {
      var d = L.devices[id];
      var visible = d.type === '89' || d.visible;
      return s.dev[id].closed || !visible;
    };
    return !(L.sources || []).some(function (src) {
      var r = self.reach(src.node, pass);
      return L.zone.some(function (z) { return r[z]; });
    });
  };

  Game.prototype.needsSync = function (id) {
    var d = this.level.devices[id];
    return !!d.sync && this.isLive(d.a) && this.isLive(d.b);
  };

  // ---------- registro ----------

  Game.prototype.infraction = function (code, msg, ref) {
    if (this.s.infractions.some(function (i) { return i.code === code; })) return null;
    this.s.infractions.push({ code: code, msg: msg, ref: ref });
    return ev('infraction', msg, { ref: ref });
  };

  Game.prototype.die = function (d) {
    this.s.over = true;
    this.s.result = { dead: true, death: d };
    return ev('death', d.title, { death: d });
  };

  function compact(arr) { return arr.filter(Boolean); }

  function srcNames(sources) {
    return sources.map(function (s) { return s.label; }).join(' + ');
  }

  // ---------- ações em dispositivos ----------

  Game.prototype.operate = function (id, action, opts) {
    opts = opts || {};
    var L = this.level, s = this.s, d = L.devices[id], st = s.dev[id], out = [];
    if (s.over) return out;
    var close = action === 'close';
    if (st.closed === close) return [ev('info', d.label + ' já está ' + (close ? 'fechado' : 'aberto') + '.')];
    if (st.locks.length) {
      return [ev('info', d.label + ' está bloqueado (LOTO) — cadeado de ' + st.locks.join(', ') +
        '. Retire o bloqueio antes de manobrar.', { ref: REF.loto })];
    }
    if (!s.authorized) out.push(this.infraction('noauth', 'Manobra sem autorização formal e sem ordem de manobra conferida.', REF.autorizacao));
    if (d.wrong) out.push(this.infraction('wrong-' + id, d.wrong, REF.errosManobra));

    // Seccionadora não interrompe carga.
    if (d.type === '89' && d.assoc && s.dev[d.assoc].closed && (this.isLive(d.a) || this.isLive(d.b))) {
      var assoc = L.devices[d.assoc];
      out.push(this.die({
        kind: 'arc',
        title: 'ARCO ELÉTRICO — SECCIONADORA SOB CARGA',
        energy: rnd(28, 46) + ' cal/cm²',
        msg: 'Você ' + (close ? 'fechou' : 'abriu') + ' a ' + d.label + ' com o ' + assoc.label +
          ' ainda FECHADO. Seccionadora não é feita para interromper ou estabelecer corrente de carga: o arco abriu na lâmina, ' +
          'se sustentou e explodiu na sua frente.',
        lesson: 'Para desligar: abra o DISJUNTOR primeiro, depois a seccionadora. Para energizar: feche a seccionadora primeiro, o disjuntor por último.',
        ref: REF.sequencia,
        caseRef: REF.caso2
      }));
      return compact(out);
    }

    // Fechamento de paralelo exige sincronismo.
    if (close && d.sync && this.needsSync(id)) {
      var ang = Math.abs(opts.syncAngle == null ? 180 : opts.syncAngle);
      if (ang > SYNC_TOL) {
        out.push(this.die({
          kind: 'sync',
          title: 'FECHAMENTO FORA DE SINCRONISMO',
          energy: Math.round(ang) + '° de defasagem',
          msg: 'Você fechou o ' + d.label + ' com ' + Math.round(ang) + '° de diferença de ângulo entre o turbogerador e a rede. ' +
            'Corrente de surto absurda, torque brutal no eixo, acoplamento estourado e o painel virou uma bola de fogo.',
          lesson: 'Paralelo só fecha com tensão, frequência, sequência de fases e ÂNGULO conferidos — função 25 (sincronismo).',
          ref: REF.paralelo
        }));
        return compact(out);
      }
      s.bonus += 150;
      out.push(ev('good', 'Sincronismo perfeito (' + Math.round(ang) + '°). Paralelo fechado sem tranco. +150'));
    }

    st.closed = close;
    s.version++;
    out.push(ev('op', d.label + (close ? ' FECHADO' : ' ABERTO') + '.', { sound: d.type === '52' ? 'clunk' : 'click' }));

    if (close) {
      var self = this;
      var hot = Object.keys(s.grounds).filter(function (n) { return self.isLive(n); });
      if (hot.length) {
        out.push(this.die({
          kind: 'arc',
          title: 'CURTO-CIRCUITO — FECHOU SOBRE O ATERRAMENTO',
          energy: rnd(35, 60) + ' cal/cm²',
          msg: 'Ao fechar o ' + d.label + ', a energia encontrou o aterramento temporário em ' + L.nodes[hot[0]].label +
            '. Curto-circuito franco: explosão no ponto e no cubículo.',
          lesson: 'Na reenergização a ordem é inversa: pessoas e ferramentas fora → retirar aterramentos (fases primeiro, terra por último) → retirar bloqueios e sinalização → religar com autorização.',
          ref: REF.reenerg
        }));
        return compact(out);
      }
      if (L.mode === 'reenergize') {
        if (!s.teamOut && L.zone.some(function (z) { return self.isLive(z); })) {
          out.push(this.die({
            kind: 'shock',
            title: 'REENERGIZOU COM A EQUIPE NA ZONA',
            energy: '13,8 kV',
            msg: L.teamDeathMsg || 'Ainda havia gente trabalhando na zona quando você religou.',
            lesson: 'Antes de religar: confirme nominalmente a saída de TODAS as pessoas e ferramentas da zona de risco.',
            ref: REF.reenerg,
            caseRef: REF.erros
          }));
          return compact(out);
        }
        var w = this.checkReenergizeWin();
        if (w) out = out.concat(w);
      }
    }
    return compact(out);
  };

  Game.prototype.lock = function (id) {
    var d = this.level.devices[id], st = this.s.dev[id];
    if (this.s.over) return [];
    if (st.closed) return [ev('info', 'Bloqueio só se aplica com o dispositivo ABERTO. Abra o ' + d.label + ' antes.', { ref: REF.etapa2 })];
    if (st.locks.indexOf('Você') >= 0) return [ev('info', 'Seu cadeado já está no ' + d.label + '.')];
    st.locks.push('Você');
    return [ev('good', 'Cadeado + etiqueta no ' + d.label + ': "NÃO OPERE — homens trabalhando".', { sound: 'lock' })];
  };

  Game.prototype.unlock = function (id) {
    var d = this.level.devices[id], st = this.s.dev[id];
    if (this.s.over) return [];
    var mine = st.locks.indexOf('Você');
    var others = st.locks.filter(function (o) { return o !== 'Você'; });
    if (mine < 0) {
      if (others.length) return [ev('info', 'Esse cadeado não é seu: é de ' + others.join(' e ') + '. Cada um retira o próprio ao sair da área.', { ref: REF.loto })];
      return [ev('info', d.label + ' não tem bloqueio.')];
    }
    st.locks.splice(mine, 1);
    var out = [ev('op', 'Seu cadeado foi retirado do ' + d.label + '.', { sound: 'lock' })];
    if (others.length) out.push(ev('info', 'Ainda restam os cadeados de ' + others.join(' e ') + '.'));
    return out;
  };

  // ---------- ações gerais ----------

  Game.prototype.authorize = function () {
    if (this.s.over) return [];
    if (this.s.authorized) return [ev('info', 'Autorização já registrada.')];
    this.s.authorized = true;
    return [ev('radio', this.level.authMsg || 'COS: ordem de manobra conferida. Autorizado.', { who: 'COS', sound: 'radio' })];
  };

  Game.prototype.testDetector = function () {
    var dt = this.s.detector;
    if (this.s.over) return [];
    if (dt.faulty) {
      dt.knownFaulty = true;
      dt.tested = false;
      return [ev('warn', 'O detector NÃO acendeu na fonte de teste. Está com DEFEITO — não confie nele!', { sound: 'warn' })];
    }
    dt.tested = true;
    return [ev('good', 'Detector testado na fonte de teste: sinal luminoso e sonoro OK.', { sound: 'beep' })];
  };

  Game.prototype.replaceDetector = function () {
    var dt = this.s.detector;
    if (this.s.over) return [];
    dt.faulty = false; dt.knownFaulty = false; dt.tested = false;
    return [ev('info', 'Detector novo retirado do almoxarifado. Teste-o antes de usar.')];
  };

  Game.prototype.testNode = function (n) {
    var s = this.s, L = this.level, out = [];
    if (s.over) return out;
    if (!s.detector.tested) out.push(this.infraction('detector-untested', 'Usou o detector sem testá-lo antes (princípio de funcionamento).', REF.etapa3));
    var v = this.voltageAt(n);
    var reading = s.detector.faulty ? 'none' : v.kind;
    s.tests[n] = { reading: reading, version: s.version };
    var label = L.nodes[n].label;
    if (reading === 'real') out.push(ev('warn', label + ': PRESENÇA DE TENSÃO (' + (L.nodes[n].kv || 'MT') + ')!', { sound: 'detector' }));
    else if (reading === 'induced') out.push(ev('warn', label + ': presença de tensão BAIXA e INSTÁVEL. Fontes abertas e bloqueadas? Pode ser tensão INDUZIDA.', { sound: 'detector' }));
    else out.push(ev('good', label + ': ausência de tensão nas 3 fases.', { sound: 'beep' }));
    return compact(out);
  };

  Game.prototype.ground = function (n, order) {
    var s = this.s, L = this.level, out = [];
    if (s.over) return out;
    if (s.grounds[n]) return [ev('info', 'Já existe aterramento temporário em ' + L.nodes[n].label + '.')];
    if (order && order[0] !== 'T') out.push(this.infraction('ground-order', 'Conectou o grampo na FASE antes da TERRA. Se houvesse tensão, o caminho para a terra seria você.', REF.etapa4));
    var t = s.tests[n];
    if (!t || t.version !== s.version) out.push(this.infraction('ground-notest-' + n, 'Aterrou ' + L.nodes[n].label + ' sem constatar a ausência de tensão antes (Etapa 3 vem antes da 4).', REF.etapa3));
    var v = this.voltageAt(n);
    if (v.kind === 'real') {
      var why = s.detector.faulty && t ? ' O detector estava com DEFEITO e mostrou 0 V — e você não o testou antes de usar.'
        : (t && t.reading === 'real' && t.version === s.version) ? ' O detector MOSTROU tensão e você aterrou mesmo assim.'
        : ' Você não constatou a ausência de tensão antes.';
      out.push(this.die({
        kind: 'arc',
        title: 'ARCO ELÉTRICO — ATERRAMENTO EM PONTO ENERGIZADO',
        energy: rnd(30, 55) + ' cal/cm²',
        msg: 'O grampo encostou no ponto "' + L.nodes[n].label + '", ainda energizado por ' + srcNames(v.sources) + '.' + why,
        lesson: (v.sources[0] && v.sources[0].lesson) || 'Constate a ausência de tensão com detector testado antes de aterrar.',
        ref: REF.etapa3,
        caseRef: REF.caso1
      }));
      return compact(out);
    }
    s.grounds[n] = true;
    out.push(ev('good', 'Aterramento temporário instalado em ' + L.nodes[n].label + '.', { sound: 'clamp' }));
    return compact(out);
  };

  Game.prototype.unground = function (n, order) {
    var s = this.s, L = this.level, out = [];
    if (s.over) return out;
    if (!s.grounds[n]) return [ev('info', 'Não há aterramento em ' + L.nodes[n].label + '.')];
    if (order && order[order.length - 1] !== 'T') out.push(this.infraction('unground-order', 'Desconectou a TERRA antes das fases. Na retirada: fases primeiro, terra por último.', REF.etapa4));
    if (!s.teamOut) out.push(this.infraction('unground-team', 'Retirou aterramento com a equipe ainda dentro da zona de trabalho.', REF.reenerg));
    delete s.grounds[n];
    out.push(ev('op', 'Aterramento retirado de ' + L.nodes[n].label + '.', { sound: 'clamp' }));
    return compact(out);
  };

  Game.prototype.cover = function (n) {
    if (this.s.over) return [];
    this.s.covers[n] = true;
    return [ev('good', 'Manta isolante instalada em ' + this.level.nodes[n].label + '.', { sound: 'click' })];
  };

  Game.prototype.uncover = function (n) {
    if (this.s.over) return [];
    var out = [];
    if (!this.s.teamOut) out.push(this.infraction('uncover-team', 'Retirou a proteção isolante com a equipe ainda na zona.', REF.reenerg));
    delete this.s.covers[n];
    out.push(ev('op', 'Manta isolante retirada de ' + this.level.nodes[n].label + '.', { sound: 'click' }));
    return compact(out);
  };

  Game.prototype.signal = function () {
    if (this.s.over) return [];
    this.s.signed = true;
    return [ev('good', 'Área delimitada e placas de impedimento instaladas em todos os pontos de manobra.', { sound: 'click' })];
  };

  Game.prototype.unsignal = function () {
    if (this.s.over) return [];
    var out = [];
    if (!this.s.teamOut) out.push(this.infraction('unsign-team', 'Retirou a sinalização com a equipe ainda na zona.', REF.reenerg));
    this.s.signed = false;
    out.push(ev('op', 'Sinalização e barreiras recolhidas.', { sound: 'click' }));
    return compact(out);
  };

  Game.prototype.confirmExit = function () {
    var s = this.s;
    if (s.over) return [];
    if (s.teamOut) return [ev('info', 'Saída da equipe já confirmada.')];
    s.teamOut = true;
    for (var id in s.dev) s.dev[id].locks = s.dev[id].locks.filter(function (o) { return o === 'Você'; });
    return (this.level.exitMsgs || ['Todos fora da zona. Ferramentas recolhidas.']).map(function (m, i) {
      return ev(i === 0 ? 'radio' : 'good', m, { who: 'Chamada nominal', sound: i === 0 ? 'radio' : null });
    });
  };

  Game.prototype.checkReenergizeWin = function () {
    var L = this.level, s = this.s, out = [];
    if (!L.goal.every(function (id) { return s.dev[id].closed; })) return null;
    if (s.signed) out.push(this.infraction('sign-left', 'Religou com placas de impedimento ainda instaladas — ninguém mais confia na sinalização.', REF.reenerg));
    if (Object.keys(s.covers).length) out.push(this.infraction('cover-left', 'Esqueceu manta isolante instalada no equipamento.', REF.reenerg));
    s.over = true;
    s.result = { win: true };
    out.push(ev('win', L.winMsg || 'Instalação devolvida e reenergizada com segurança.'));
    return compact(out);
  };

  // ---------- liberação da equipe (fim da fase de desenergização) ----------

  Game.prototype.release = function () {
    var self = this, L = this.level, s = this.s, tl = [];
    if (s.over) return { timeline: tl };

    function death(d) {
      self.die(d);
      tl.push(ev('death', d.title, { death: d }));
      return { timeline: tl, dead: true, death: d };
    }
    function inf(code, msg, ref) { var e = self.infraction(code, msg, ref); if (e) tl.push(e); }

    tl.push(ev('info', 'Supervisor confere a PT e libera a equipe. Equipe entrando na zona de trabalho…'));

    for (var i = 0; i < L.zone.length; i++) {
      var z = L.zone[i], v = this.voltageAt(z), t = s.tests[z];
      var fresh = t && t.version === s.version;
      if (v.kind === 'real') {
        var src = v.sources[0];
        var why = s.detector.faulty && fresh ? 'O detector com DEFEITO mostrou 0 V — você não testou o detector antes de usar.'
          : fresh && t.reading === 'real' ? 'O detector MOSTROU tensão e você liberou mesmo assim.'
          : t ? 'Você mediu ANTES da última manobra e não mediu de novo.'
          : 'Ninguém constatou a ausência de tensão no ponto de trabalho.';
        return death({
          kind: 'shock',
          title: 'CHOQUE ELÉTRICO — ' + (L.nodes[z].kv || 'MT'),
          energy: L.nodes[z].kv || 'MT',
          msg: 'Ao tocar o condutor, o eletricista fechou o circuito para a terra. A zona continuava energizada por ' +
            srcNames(v.sources) + '. ' + why,
          lesson: src.lesson || 'Desligar não é desenergizar: isole TODAS as fontes e constate a ausência de tensão.',
          ref: src.ref || REF.desligar,
          caseRef: REF.caso1
        });
      }
      if (v.kind === 'induced') {
        return death({
          kind: 'shock',
          title: 'CHOQUE POR TENSÃO INDUZIDA',
          energy: 'tensão induzida',
          msg: 'A linha vizinha, energizada na mesma faixa, induziu tensão no trecho desligado. Sem aterramento no PONTO DE TRABALHO, ' +
            'o eletricista virou o caminho para a terra ao segurar o condutor.',
          lesson: 'Aterre as DUAS extremidades E o ponto de trabalho. Linha desligada não quer dizer linha sem tensão.',
          ref: REF.inducao,
          caseRef: REF.caso3
        });
      }
    }

    L.zone.forEach(function (z) {
      if (!s.grounds[z]) inf('zone-noground', 'Zona de trabalho (' + L.nodes[z].label + ') sem aterramento temporário.', REF.etapa4);
      var t = s.tests[z];
      if (!t || t.version !== s.version) inf('zone-notest', 'Não constatou a ausência de tensão na zona depois da última manobra.', REF.etapa3);
    });
    (L.requiredGrounds || []).forEach(function (n) {
      if (!s.grounds[n] && L.zone.indexOf(n) < 0) inf('ground-' + n, 'Faltou aterrar ' + L.nodes[n].label + '.', REF.inducao);
    });
    var unl = this.unlockedPaths();
    if (unl.length) inf('loto', 'Bloqueio incompleto: ' + unl.join(', ') + ' sem cadeado — alguém poderia religar.', REF.etapa2);
    if (!this.visibleIsolation()) inf('visible', 'Sem isolação visível: nenhuma seccionadora aberta entre alguma fonte e a zona.', REF.etapa1);
    if (!s.signed) inf('sign', 'Área de trabalho e pontos de manobra sem sinalização.', REF.etapa6);
    var touched = (L.events || []).filter(function (e) { return e.type === 'touchAdjacent'; }).map(function (e) { return e.node; });
    for (var n in L.nodes) {
      if (L.nodes[n].adjacent && !s.covers[n] && touched.indexOf(n) < 0) inf('cover-' + n, 'Partes energizadas vizinhas (' + L.nodes[n].label + ') sem proteção isolante.', REF.etapa5);
    }

    var events = L.events || [];
    for (var k = 0; k < events.length; k++) {
      var e = events[k];
      tl.push(ev('radio', e.msg, { who: e.who, sound: 'radio' }));
      if (e.type === 'remoteClose') {
        var st = s.dev[e.dev], d = L.devices[e.dev];
        if (st.locks.length) {
          s.bonus += 200;
          tl.push(ev('good', 'Comando RECUSADO: ' + d.label + ' está com cadeado e etiqueta. O LOTO salvou a equipe. +200', { sound: 'saved' }));
          continue;
        }
        if (!st.closed) { st.closed = true; s.version++; tl.push(ev('warn', d.label + ' FECHOU!', { sound: 'clunk' })); }
        var live = L.zone.filter(function (z) { return self.isLive(z); });
        if (!live.length) {
          inf('remote-' + e.dev, d.label + ' foi fechado à distância sem cadeado. Só não deu ruim porque outra isolação segurou. Bloqueie TODOS os pontos de manobra, inclusive comando remoto.', REF.etapa2);
          continue;
        }
        if (L.zone.every(function (z) { return s.grounds[z]; })) {
          st.closed = false;
          inf('ground-saved', 'O aterramento temporário fez curto e a proteção desligou. A equipe sobreviveu POR CAUSA do aterramento — mas faltou o cadeado.', REF.etapa4);
          tl.push(ev('warn', 'ESTRONDO no cubículo! Proteção atuou. Equipe viva — por um fio.', { sound: 'arcSmall' }));
          continue;
        }
        return death({
          kind: 'shock',
          title: 'REENERGIZAÇÃO ACIDENTAL',
          energy: L.nodes[live[0]].kv || 'MT',
          msg: e.who + ' fechou o ' + d.label + ' sem saber que havia gente trabalhando. Sem cadeado para impedir e sem aterramento para escoar, a tensão voltou direto no eletricista.',
          lesson: 'Cadeado e etiqueta em TODOS os pontos de manobra (locais e remotos) + aterramento temporário na zona. Um protege, o outro salva se o primeiro falhar.',
          ref: REF.loto,
          caseRef: REF.caso1
        });
      }
      if (e.type === 'touchAdjacent') {
        if (s.covers[e.node]) {
          s.bonus += 100;
          tl.push(ev('good', 'A manta isolante em ' + L.nodes[e.node].label + ' segurou o contato. +100', { sound: 'saved' }));
          continue;
        }
        return death({
          kind: 'shock',
          title: 'CONTATO COM PARTE ENERGIZADA VIZINHA',
          energy: L.nodes[e.node].kv || 'MT',
          msg: 'A zona estava desenergizada — mas a ' + L.nodes[e.node].label + ', a centímetros, não. Sem manta isolante, o contato acidental foi fatal.',
          lesson: 'Etapa 5: proteja os elementos energizados que ficam na zona controlada com coberturas e mantas isolantes.',
          ref: REF.etapa5
        });
      }
    }

    s.over = true;
    s.result = { win: true };
    tl.push(ev('win', L.winMsg || 'Serviço concluído. Todo mundo voltou pra casa.'));
    return { timeline: tl, win: true };
  };

  Game.prototype.score = function (timeLeft) {
    var s = this.s;
    if (!s.result || !s.result.win) return { total: 0, stars: 0 };
    var penalty = s.infractions.length * 150;
    var timeBonus = Math.max(0, Math.round(timeLeft || 0)) * 3;
    var total = Math.max(0, 1000 - penalty + s.bonus + timeBonus);
    var n = s.infractions.length;
    return { total: total, base: 1000, penalty: penalty, bonus: s.bonus, timeBonus: timeBonus, stars: n === 0 ? 3 : n <= 2 ? 2 : 1 };
  };

  var api = { Game: Game, REF: REF, SYNC_TOL: SYNC_TOL };
  root.SEP = root.SEP || {};
  for (var key in api) root.SEP[key] = api[key];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
