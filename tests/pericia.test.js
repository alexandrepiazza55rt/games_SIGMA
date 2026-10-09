// Testes do "Perícia SEP": dados das cenas e regras da investigação.
const test = require('node:test');
const assert = require('node:assert');
const { cases } = require('../pericia/js/cases.js');
const { Investigation, CFG } = require('../pericia/js/core.js');

test('cada caso tem 5+ erros, com causas imediatas e básicas, e falsos positivos', () => {
  for (const c of cases) {
    const errs = c.items.filter((i) => i.err);
    assert.ok(errs.length >= 5, c.id);
    assert.ok(errs.some((e) => e.kind === 'imediata') && errs.some((e) => e.kind === 'basica'), c.id);
    assert.ok(c.items.some((i) => !i.err), c.id);
    for (const e of errs) {
      assert.ok(['imediata', 'basica'].includes(e.kind), `${c.id}/${e.id}`);
      assert.match(e.ref, /\(slide \d+\)$/, `${c.id}/${e.id}`);
      assert.ok(e.why.length > 30 && e.label.length > 5);
    }
    assert.match(c.caseRef, /^Módulo 18 · Caso \d/);
    assert.ok(typeof c.art() === 'string' && c.art().length > 500);
  }
});

test('pontos clicáveis dentro da cena e sem sobreposição', () => {
  for (const c of cases) {
    for (const a of c.items) {
      assert.ok(a.x - a.r >= -10 && a.x + a.r <= 910 && a.y - a.r >= -10 && a.y + a.r <= 570, `${c.id}/${a.id} fora da cena`);
      for (const b of c.items) {
        if (a === b) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        assert.ok(d >= a.r + b.r - 6, `${c.id}: ${a.id} e ${b.id} se sobrepõem (${d.toFixed(0)} < ${a.r + b.r})`);
      }
    }
  }
});

test('achar e classificar dá pontos; repetido não conta; falso positivo desconta', () => {
  const c = cases[0], inv = new Investigation(c);
  const e = c.items.find((i) => i.err), ok = c.items.find((i) => !i.err);
  assert.strictEqual(inv.tap(e.x, e.y).type, 'error');
  assert.strictEqual(inv.tap(e.x, e.y).type, 'dup');
  assert.strictEqual(inv.classify(e.id, e.kind).correct, true);
  assert.strictEqual(inv.score, CFG.find + CFG.classify);
  assert.strictEqual(inv.tap(ok.x, ok.y).type, 'ok');
  assert.strictEqual(inv.score, CFG.find + CFG.classify - CFG.falsePos);
  const t0 = inv.time;
  assert.strictEqual(inv.tap(5, 5).type, 'empty');
  assert.strictEqual(inv.time, t0 - CFG.emptyTap);
});

test('achar todos encerra com bônus de tempo e nota A', () => {
  for (const c of cases) {
    const inv = new Investigation(c);
    for (const e of c.items.filter((i) => i.err)) { inv.tap(e.x, e.y); inv.classify(e.id, e.kind); }
    assert.ok(inv.done);
    const r = inv.report();
    assert.strictEqual(r.grade, 'A');
    assert.ok(r.bonus > 0);
    assert.strictEqual(r.missed.length, 0);
  }
});

test('classificar errado e deixar passar derruba a nota', () => {
  const c = cases[1], inv = new Investigation(c);
  const errs = c.items.filter((i) => i.err);
  errs.slice(0, 2).forEach((e) => { inv.tap(e.x, e.y); inv.classify(e.id, e.kind === 'basica' ? 'imediata' : 'basica'); });
  inv.tick(9999);
  const r = inv.report();
  assert.ok(inv.done);
  assert.strictEqual(r.found, 2);
  assert.strictEqual(r.right, 0);
  assert.strictEqual(r.wrong.length, 2);
  assert.strictEqual(r.missed.length, errs.length - 2);
  assert.strictEqual(r.bonus, 0);
  assert.ok(['D', 'E'].includes(r.grade));
});

test('dica aponta um erro ainda não achado e custa pontos', () => {
  const c = cases[2], inv = new Investigation(c);
  const h = inv.hint();
  assert.ok(h && h.err);
  assert.strictEqual(inv.score, -CFG.hint);
});
