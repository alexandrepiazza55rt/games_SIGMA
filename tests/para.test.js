// Testes do "Para ou Libera": dados das cartas e regras da rodada.
const test = require('node:test');
const assert = require('node:assert');
const cards = require('../para-ou-libera/js/cards.js');
const { Round, CFG, rank } = require('../para-ou-libera/js/core.js');

test('toda carta tem resposta, explicação e slide de referência', () => {
  const ids = new Set();
  for (const c of cards) {
    assert.ok(['para', 'libera'].includes(c.ans), `carta ${c.id}`);
    for (const k of ['scene', 'place', 'title', 'text', 'q', 'why']) assert.ok(c[k] && c[k].length > 2, `carta ${c.id} sem ${k}`);
    assert.match(c.ref, /^Módulo \d+ · .+ \(slide \d+\)$/, `carta ${c.id}`);
    assert.ok(!ids.has(c.id));
    ids.add(c.id);
  }
});

test('baralho equilibrado: nem sempre PARA é a resposta', () => {
  const para = cards.filter((c) => c.ans === 'para').length;
  assert.ok(para / cards.length >= 0.5 && para / cards.length <= 0.65, `${para}/${cards.length}`);
});

test('acertos seguidos sobem o multiplicador até ×4', () => {
  const r = new Round(cards);
  for (let i = 0; i < 12; i++) r.answer(r.current().ans, 5000);
  assert.strictEqual(r.multiplier(), 4);
  assert.strictEqual(r.correct, 12);
  assert.ok(r.score > 12 * CFG.base);
});

test('resposta rápida ganha bônus', () => {
  const r = new Round(cards);
  const a = r.answer(r.current().ans, 1000);
  assert.strictEqual(a.points, CFG.base + CFG.quickBonus);
});

test('liberar o que era PARA custa um capacete; três acidentes encerram', () => {
  const r = new Round(cards);
  let accidents = 0;
  while (!r.over()) {
    const c = r.current();
    const res = r.answer(c.ans === 'para' ? 'libera' : 'libera', 5000);
    if (res.lifeLost) accidents++;
  }
  assert.strictEqual(accidents, 3);
  assert.strictEqual(r.lives, 0);
});

test('parar o que era LIBERA custa tempo, não vida', () => {
  const r = new Round(cards);
  while (r.current().ans !== 'libera') r.answer(r.current().ans, 5000);
  const t = r.time;
  const res = r.answer('para', 5000);
  assert.strictEqual(res.kind, 'stop');
  assert.strictEqual(r.lives, 3);
  assert.strictEqual(r.time, t - CFG.stopPenalty);
  assert.strictEqual(r.combo, 0);
});

test('hesitar zera o combo e custa tempo', () => {
  const r = new Round(cards);
  r.answer(r.current().ans, 5000);
  const t = r.time;
  r.hesitate();
  assert.strictEqual(r.combo, 0);
  assert.strictEqual(r.time, t - CFG.hesitatePenalty);
});

test('pavio encurta até o mínimo', () => {
  const r = new Round(cards);
  assert.strictEqual(r.fuse(), CFG.fuseStart);
  r.answered = 1000;
  assert.strictEqual(r.fuse(), CFG.fuseMin);
});

test('baralho reembaralha sem acabar e revisão lista cada erro uma vez', () => {
  const r = new Round(cards, { time: 9999 });
  for (let i = 0; i < cards.length * 2 + 5; i++) r.answer(r.current().ans, 5000);
  assert.ok(r.current());
  const r2 = new Round(cards);
  const first = r2.current();
  r2.answer(first.ans === 'para' ? 'libera' : 'para', 5000);
  assert.strictEqual(r2.mistakes().length, 1);
  assert.strictEqual(r2.mistakes()[0].card.id, first.id);
});

test('ranking cresce com a pontuação', () => {
  assert.notStrictEqual(rank(0), rank(6000));
});
