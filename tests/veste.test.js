// Testes do "Veste ou Queima": regras do teste do arco e viabilidade de cada tarefa.
const test = require('node:test');
const assert = require('node:assert');
const V = require('../veste-ou-queima/js/kit.js');

const slot = (id) => V.SLOTS.find((s) => s.id === id).items.map((i) => i.id);
const EXTRAS = slot('extras');

// Todos os kits possíveis (sem extras inúteis): para cada tarefa, extras = exatamente os exigidos.
function* kits(task) {
  for (const corpo of slot('corpo')) for (const cabeca of slot('cabeca')) for (const maos of slot('maos'))
    for (const pes of slot('pes')) for (const intima of slot('intima'))
      yield { corpo, cabeca, maos, pes, intima, extras: (task.need || []).slice() };
}

const BEST = {
  t1: { corpo: 'fr8', cabeca: 'face12', maos: 'c00', pes: 'isol', intima: 'ialg', extras: [] },
  t2: { corpo: 'fr8', cabeca: 'cap', maos: 'vaq', pes: 'isol', intima: 'ialg', extras: [], epc: 'remota' },
  t3: { corpo: 'alg', cabeca: 'cap', maos: 'vaq', pes: 'isol', intima: 'ialg', extras: ['colete'] },
  t4: { corpo: 'fr8', cabeca: 'face12', maos: 'c00', pes: 'isol', intima: 'ialg', extras: ['auric'] },
  t5: { corpo: 'fr8', cabeca: 'face12', maos: 'c4', pes: 'isol', intima: 'ialg', extras: ['cinto', 'mangas'] },
  t6: { corpo: 'fr8', cabeca: 'face12', maos: 'c00', pes: 'isol', intima: 'ialg', extras: [], epc: 'manut' },
  t7: { corpo: 'fr8', cabeca: 'cap', maos: 'vaq', pes: 'isol', intima: 'ialg', extras: [], epc: 'desen' },
  t8: { corpo: 'fr8', cabeca: 'face12', maos: 'c00', pes: 'isol', intima: 'ialg', extras: ['lanEx'] }
};

test('cada tarefa tem uma solução perfeita (usada também no teste de interface)', () => {
  for (const t of V.TASKS) {
    const k = BEST[t.id];
    const r = V.evaluate(t, k, k.epc || null);
    assert.strictEqual(r.outcome, 'perfeito', `${t.id}: ${JSON.stringify(r.injuries.concat(r.infractions))}`);
  }
});

test('ATPV menor que a energia queima; muito menor é grave e mata em alta energia', () => {
  const t = V.TASKS.find((x) => x.id === 't2');
  const base = { cabeca: 'capuz40', maos: 'c2', pes: 'isol', intima: 'ialg', extras: ['mangas'] };
  assert.strictEqual(V.evaluate(t, { ...base, corpo: 'fr40' }).outcome, 'perfeito');
  assert.strictEqual(V.evaluate(t, { ...base, corpo: 'fr25' }).outcome, 'perfeito');
  assert.strictEqual(V.evaluate(t, { ...base, corpo: 'fr8' }).outcome, 'morto');
});

test('luva de classe abaixo da tensão é choque fatal', () => {
  const t = V.TASKS.find((x) => x.id === 't5');
  const r = V.evaluate(t, { ...BEST.t5, maos: 'c2' });
  assert.strictEqual(r.outcome, 'morto');
  assert.strictEqual(r.parts.maos, 'grave');
});

test('poliéster derrete; roupa íntima sintética é infração ou agrava', () => {
  const t = V.TASKS.find((x) => x.id === 't1');
  assert.strictEqual(V.evaluate(t, { ...BEST.t1, corpo: 'sint' }).parts.corpo, 'grave');
  const r = V.evaluate(t, { ...BEST.t1, intima: 'isint' });
  assert.strictEqual(r.outcome, 'ok');
  assert.strictEqual(r.infractions.length, 1);
});

test('62 cal/cm²: nenhum EPI resolve, só desenergizar', () => {
  const t = V.TASKS.find((x) => x.id === 't7');
  for (const k of kits(t)) assert.notStrictEqual(V.evaluate(t, k, null).outcome, 'perfeito');
  assert.strictEqual(V.evaluate(t, { corpo: 'fr40', cabeca: 'capuz40', maos: 'c2', pes: 'isol', intima: 'ialg', extras: ['mangas'] }, null).outcome, 'morto');
});

test('modo de manutenção reduz a energia e dá bônus', () => {
  const t = V.TASKS.find((x) => x.id === 't6');
  const sem = V.evaluate(t, { ...BEST.t6, corpo: 'fr40', cabeca: 'capuz40' }, null);
  const com = V.evaluate(t, BEST.t6, 'manut');
  assert.strictEqual(sem.outcome, 'perfeito');
  assert.ok(com.points > sem.points);
  assert.strictEqual(V.evaluate(t, BEST.t6, null).outcome, 'morto');
});

test('lanterna comum em área classificada é fatal; extras obrigatórios viram infração', () => {
  const t = V.TASKS.find((x) => x.id === 't8');
  assert.strictEqual(V.evaluate(t, { ...BEST.t8, extras: ['lanCom'] }).outcome, 'morto');
  const t4 = V.TASKS.find((x) => x.id === 't4');
  assert.strictEqual(V.evaluate(t4, { ...BEST.t4, extras: [] }).outcome, 'ok');
});

test('bota com biqueira de aço e boné são infrações', () => {
  const t = V.TASKS.find((x) => x.id === 't1');
  assert.strictEqual(V.evaluate(t, { ...BEST.t1, pes: 'aco' }).infractions.length, 1);
  const r = V.evaluate(t, { ...BEST.t1, cabeca: 'bone' });
  assert.ok(r.infractions.length === 1 && r.parts.cabeca === 'grave');
});

test('extras do catálogo cobrem os exigidos e proibidos', () => {
  for (const t of V.TASKS) for (const e of (t.need || []).concat(t.forbid || [])) assert.ok(EXTRAS.includes(e), e);
});

module.exports = { BEST };
