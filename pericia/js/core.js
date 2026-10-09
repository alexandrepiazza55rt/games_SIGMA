/*
 * Regras do "Perícia SEP": achar os erros na cena e classificar cada um como causa imediata
 * ou causa básica. Sem DOM — testável no Node.
 */
(function (root) {
  'use strict';

  var CFG = {
    time: 150,        // segundos por cena
    find: 200,        // achou um erro
    classify: 100,    // classificou certo
    falsePos: 50,     // apontou algo que estava certo
    emptyTap: 2,      // segundos perdidos por toque no vazio
    hint: 100,        // custo da dica
    timeBonus: 3      // pontos por segundo restante quando acha tudo
  };

  function Investigation(scene) {
    this.scene = scene;
    this.time = CFG.time;
    this.score = 0;
    this.found = {};      // id -> { classified: 'imediata'|'basica'|null, correct: bool|null }
    this.falsePos = {};   // id -> true
    this.hints = 0;
    this.done = false;
  }

  Investigation.prototype.errors = function () { return this.scene.items.filter(function (i) { return i.err; }); };
  Investigation.prototype.item = function (id) { return this.scene.items.filter(function (i) { return i.id === id; })[0]; };

  // Toque em um ponto da cena (x, y no viewBox). Devolve o que foi tocado.
  Investigation.prototype.tap = function (x, y) {
    if (this.done) return { type: 'done' };
    var hit = null, best = Infinity;
    this.scene.items.forEach(function (it) {
      var d = Math.sqrt((it.x - x) * (it.x - x) + (it.y - y) * (it.y - y));
      if (d <= it.r && d < best) { best = d; hit = it; }
    });
    if (!hit) { this.time = Math.max(0, this.time - CFG.emptyTap); return { type: 'empty', timeLost: CFG.emptyTap }; }
    if (!hit.err) {
      if (this.falsePos[hit.id]) return { type: 'dup', item: hit };
      this.falsePos[hit.id] = true;
      this.score -= CFG.falsePos;
      return { type: 'ok', item: hit, points: -CFG.falsePos };
    }
    if (this.found[hit.id]) return { type: 'dup', item: hit };
    this.found[hit.id] = { classified: null, correct: null };
    this.score += CFG.find;
    return { type: 'error', item: hit, points: CFG.find };
  };

  Investigation.prototype.classify = function (id, kind) {
    var f = this.found[id], it = this.item(id);
    if (!f || f.classified) return null;
    f.classified = kind;
    f.correct = kind === it.kind;
    if (f.correct) this.score += CFG.classify;
    if (this.allFound()) this.finish();
    return { correct: f.correct, item: it, points: f.correct ? CFG.classify : 0 };
  };

  Investigation.prototype.allFound = function () {
    var self = this;
    return this.errors().every(function (e) { return self.found[e.id] && self.found[e.id].classified; });
  };

  Investigation.prototype.hint = function () {
    var self = this;
    var left = this.errors().filter(function (e) { return !self.found[e.id]; });
    if (!left.length || this.done) return null;
    this.hints++;
    this.score -= CFG.hint;
    return left[Math.floor(Math.random() * left.length)];
  };

  Investigation.prototype.tick = function (dt) {
    if (this.done) return;
    this.time = Math.max(0, this.time - dt);
    if (this.time <= 0) this.finish();
  };

  Investigation.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.bonus = this.allFound() ? Math.round(this.time * CFG.timeBonus) : 0;
    this.score += this.bonus;
  };

  // Resumo para o laudo.
  Investigation.prototype.report = function () {
    var self = this, errs = this.errors();
    var found = errs.filter(function (e) { return self.found[e.id]; });
    var right = found.filter(function (e) { return self.found[e.id].correct; });
    var ratio = (found.length + right.length) / (2 * errs.length);
    var grade = ratio >= 0.95 ? 'A' : ratio >= 0.8 ? 'B' : ratio >= 0.6 ? 'C' : ratio >= 0.4 ? 'D' : 'E';
    return {
      total: errs.length, found: found.length, right: right.length,
      missed: errs.filter(function (e) { return !self.found[e.id]; }),
      wrong: found.filter(function (e) { return !self.found[e.id].correct; }),
      falsePos: Object.keys(this.falsePos).length, hints: this.hints,
      bonus: this.bonus || 0, score: this.score, grade: grade
    };
  };

  var api = { Investigation: Investigation, CFG: CFG };
  root.PS = root.PS || {};
  for (var k in api) root.PS[k] = api[k];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
