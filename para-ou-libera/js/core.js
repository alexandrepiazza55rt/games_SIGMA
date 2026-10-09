/*
 * Regras do "Para ou Libera". Sem DOM — testável no Node.
 *
 * Acertou: +100 × multiplicador (sobe a cada 3 acertos seguidos, até ×4) + bônus se responder antes de meio pavio.
 * Liberou o que era PARA: acidente, perde um capacete (3 vidas).
 * Parou o que era LIBERA: parada desnecessária, perde tempo — mas ninguém morre.
 * Hesitou até o pavio acabar: perde o combo e um pouco de tempo.
 */
(function (root) {
  'use strict';

  var CFG = {
    time: 150,         // segundos de turno
    lives: 3,
    base: 100,
    quick: 0.5,        // fração do pavio: responder antes da metade dá bônus
    quickBonus: 50,
    stopPenalty: 5,    // s perdidos por parada desnecessária
    hesitatePenalty: 3,
    readRate: 2.5,     // palavras por segundo (leitura com calma no celular)
    fuseStart: 7,      // s para decidir, além do tempo de leitura
    fuseMin: 4,        // folga mínima para decidir quando o jogo acelera
    fuseStep: 0.15     // quanto a folga encurta a cada carta respondida
  };

  function words(card) {
    return (card.title + ' ' + card.text + ' ' + card.q).split(/\s+/).filter(Boolean).length;
  }

  function shuffle(a, rnd) {
    a = a.slice();
    rnd = rnd || Math.random;
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function Round(cards, opts) {
    opts = opts || {};
    this.cards = cards;
    this.rnd = opts.rnd || Math.random;
    this.deck = shuffle(cards, this.rnd);
    this.i = 0;
    this.time = opts.time || CFG.time;
    this.lives = CFG.lives;
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.correct = 0;
    this.answered = 0;
    this.log = [];
  }

  Round.prototype.current = function () { return this.deck[this.i]; };

  Round.prototype.multiplier = function () { return 1 + Math.min(3, Math.floor(this.combo / 3)); };

  // Tempo do pavio: o necessário para ler a carta + uma folga para decidir que encurta com o jogo.
  Round.prototype.fuse = function (card) {
    card = card || this.current();
    var read = words(card) / CFG.readRate;
    return read + Math.max(CFG.fuseMin, CFG.fuseStart - this.answered * CFG.fuseStep);
  };

  Round.prototype.next = function () {
    this.i++;
    if (this.i >= this.deck.length) {
      var last = this.deck[this.deck.length - 1];
      this.deck = shuffle(this.cards, this.rnd);
      if (this.deck[0] === last && this.deck.length > 1) { this.deck.push(this.deck.shift()); }
      this.i = 0;
    }
  };

  // choice: 'para' | 'libera'; ms: tempo de reação
  Round.prototype.answer = function (choice, ms) {
    var card = this.current();
    var fuse = this.fuse(card);
    var ok = choice === card.ans;
    var r = { card: card, choice: choice, correct: ok, points: 0, lifeLost: false, timeLost: 0 };
    this.answered++;
    if (ok) {
      this.combo++;
      this.correct++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      r.mult = this.multiplier();
      r.quick = ms < fuse * 1000 * CFG.quick;
      r.points = CFG.base * r.mult + (r.quick ? CFG.quickBonus : 0);
      this.score += r.points;
    } else {
      this.combo = 0;
      if (card.ans === 'para') { this.lives--; r.lifeLost = true; r.kind = 'accident'; }
      else { r.timeLost = CFG.stopPenalty; this.time -= CFG.stopPenalty; r.kind = 'stop'; }
    }
    this.log.push({ id: card.id, choice: choice, correct: ok, ms: ms, kind: r.kind || 'ok' });
    this.next();
    return r;
  };

  Round.prototype.hesitate = function () {
    var card = this.current();
    this.combo = 0;
    this.answered++;
    this.time -= CFG.hesitatePenalty;
    this.log.push({ id: card.id, choice: null, correct: false, ms: null, kind: 'hesitate' });
    this.next();
    return { card: card, kind: 'hesitate', timeLost: CFG.hesitatePenalty, correct: false };
  };

  Round.prototype.tick = function (dt) { this.time = Math.max(0, this.time - dt); };

  Round.prototype.over = function () { return this.lives <= 0 || this.time <= 0; };

  Round.prototype.accuracy = function () { return this.answered ? Math.round(100 * this.correct / this.answered) : 0; };

  Round.prototype.mistakes = function () {
    var byId = {};
    this.cards.forEach(function (c) { byId[c.id] = c; });
    var seen = {};
    return this.log.filter(function (l) {
      if (l.correct || seen[l.id]) return false;
      seen[l.id] = true;
      return true;
    }).map(function (l) { return { card: byId[l.id], kind: l.kind }; });
  };

  var RANKS = [
    [0, 'Perigo Ambulante'], [600, 'Aprendiz Desconfiado'], [1500, 'Eletricista Atento'],
    [2600, 'Supervisor de Respeito'], [4000, 'Guardião da PT'], [5500, 'Lenda da Condição Impeditiva ⚡']
  ];
  function rank(score) {
    var r = RANKS[0][1];
    RANKS.forEach(function (x) { if (score >= x[0]) r = x[1]; });
    return r;
  }

  var api = { Round: Round, CFG: CFG, rank: rank, shuffle: shuffle, words: words };
  root.PL = root.PL || {};
  for (var k in api) root.PL[k] = api[k];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
