// Testes do motor: cada fase tem uma solução limpa e as armadilhas matam.
// Rodar com: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const { Game } = require('../js/engine.js');
const levels = require('../js/levels.js');

const L = Object.fromEntries(levels.map((l) => [l.id, l]));
const T = ['T', 'A', 'B', 'C'];
const R = ['A', 'B', 'C', 'T'];

function types(evs) { return evs.map((e) => e.type); }
function play(g, steps) {
  let out = [];
  for (const [fn, ...args] of steps) out = out.concat(g[fn](...args));
  return out;
}

test('fase 1: solução limpa vence com 3 estrelas', () => {
  const g = new Game(L.l1);
  const evs = play(g, [
    ['authorize'], ['operate', '52-1', 'open'], ['operate', '89-1', 'open'],
    ['lock', '52-1'], ['lock', '89-1'], ['testDetector'], ['testNode', 'M01'],
    ['ground', 'M01', T], ['cover', 'BAR'], ['signal']
  ]);
  assert.ok(!types(evs).includes('infraction'), JSON.stringify(g.s.infractions));
  const r = g.release();
  assert.ok(r.win, JSON.stringify(r.timeline));
  assert.strictEqual(g.s.infractions.length, 0);
  assert.strictEqual(g.score(10).stars, 3);
});

test('fase 1: abrir seccionadora sob carga = arco', () => {
  const g = new Game(L.l1);
  const evs = play(g, [['authorize'], ['operate', '89-1', 'open']]);
  assert.strictEqual(evs.at(-1).type, 'death');
  assert.strictEqual(evs.at(-1).death.kind, 'arc');
});

test('fase 1: sem manta na barra vizinha = morte na execução', () => {
  const g = new Game(L.l1);
  play(g, [['authorize'], ['operate', '52-1', 'open'], ['operate', '89-1', 'open'], ['lock', '52-1'], ['lock', '89-1'],
    ['testDetector'], ['testNode', 'M01'], ['ground', 'M01', T], ['signal']]);
  const r = g.release();
  assert.ok(r.dead);
});

test('fase 1: liberar sem desligar nada = choque', () => {
  const g = new Game(L.l1);
  const r = g.release();
  assert.ok(r.dead);
  assert.strictEqual(r.death.kind, 'shock');
});

test('fase 1: manobrar alimentador errado gera infração', () => {
  const g = new Game(L.l1);
  const evs = play(g, [['authorize'], ['operate', '52-2', 'open']]);
  assert.ok(types(evs).includes('infraction'));
});

test('fase 2: esquecer a cogeração = aterrar barra viva', () => {
  const g = new Game(L.l2);
  const evs = play(g, [['authorize'], ['operate', '52-E', 'open'], ['operate', '89-E', 'open'], ['lock', '89-E'],
    ['testDetector'], ['ground', 'BUS', T]]);
  assert.strictEqual(evs.at(-1).type, 'death');
  assert.match(evs.at(-1).death.msg, /TG-01/);
});

test('fase 2: solução limpa + cadeado no 52-G recusa religamento', () => {
  const g = new Game(L.l2);
  play(g, [['authorize'], ['operate', '52-E', 'open'], ['operate', '89-E', 'open'], ['operate', '52-G', 'open'], ['operate', '89-G', 'open'],
    ['lock', '52-E'], ['lock', '89-E'], ['lock', '52-G'], ['lock', '89-G'], ['testDetector'], ['testNode', 'BUS'],
    ['ground', 'BUS', T], ['signal']]);
  const r = g.release();
  assert.ok(r.win, JSON.stringify(r.timeline));
  assert.strictEqual(g.s.infractions.length, 0);
  assert.strictEqual(g.s.bonus, 200);
});

test('fase 2: 52-G sem cadeado mas 89-G bloqueada = infração, não morte', () => {
  const g = new Game(L.l2);
  play(g, [['authorize'], ['operate', '52-E', 'open'], ['operate', '89-E', 'open'], ['operate', '52-G', 'open'], ['operate', '89-G', 'open'],
    ['lock', '89-E'], ['lock', '89-G'], ['testDetector'], ['testNode', 'BUS'], ['ground', 'BUS', T], ['signal']]);
  const r = g.release();
  assert.ok(r.win);
  assert.ok(g.s.infractions.some((i) => i.code === 'remote-52-G'));
});

test('fase 3: aterrar só as pontas = morte por indução', () => {
  const g = new Game(L.l3);
  play(g, [['authorize'], ['operate', '52-A', 'open'], ['operate', '89-A', 'open'], ['operate', '52-B', 'open'], ['operate', '89-B', 'open'],
    ['lock', '89-A'], ['lock', '89-B'], ['lock', '52-A'], ['lock', '52-B'], ['testDetector'],
    ['testNode', 'LA'], ['ground', 'LA', T], ['testNode', 'LB'], ['ground', 'LB', T], ['testNode', 'LZ'], ['signal']]);
  const r = g.release();
  assert.ok(r.dead);
  assert.match(r.death.title, /INDUZIDA/);
});

test('fase 3: solução limpa vence', () => {
  const g = new Game(L.l3);
  play(g, [['authorize'], ['operate', '52-A', 'open'], ['operate', '89-A', 'open'], ['operate', '52-B', 'open'], ['operate', '89-B', 'open'],
    ['lock', '89-A'], ['lock', '89-B'], ['lock', '52-A'], ['lock', '52-B'], ['testDetector'],
    ['testNode', 'LA'], ['ground', 'LA', T], ['testNode', 'LZ'], ['ground', 'LZ', T], ['testNode', 'LB'], ['ground', 'LB', T], ['signal']]);
  const r = g.release();
  assert.ok(r.win, JSON.stringify(r.timeline));
  assert.strictEqual(g.s.infractions.length, 0);
});

test('fase 4: detector com defeito mente e retorno pelo trafo mata', () => {
  const g = new Game(L.l4);
  const evs = play(g, [['authorize'], ['operate', '52-3', 'open'], ['operate', '89-3', 'open'], ['lock', '52-3'], ['lock', '89-3'],
    ['testNode', 'MT3']]);
  assert.match(evs.at(-1).msg, /ausência/);
  const death = play(g, [['ground', 'MT3', T]]).at(-1);
  assert.strictEqual(death.type, 'death');
  assert.match(death.death.msg, /DEFEITO/);
});

test('fase 4: solução limpa vence', () => {
  const g = new Game(L.l4);
  play(g, [['authorize'], ['testDetector'], ['replaceDetector'], ['testDetector'],
    ['operate', '52-3', 'open'], ['operate', '89-3', 'open'], ['operate', '52-BT3', 'open'],
    ['lock', '52-3'], ['lock', '89-3'], ['lock', '52-BT3'], ['testNode', 'MT3'], ['ground', 'MT3', T], ['cover', 'BMT'], ['signal']]);
  const r = g.release();
  assert.ok(r.win, JSON.stringify(r.timeline));
  assert.strictEqual(g.s.infractions.length, 0);
});

test('fase 5: solução limpa com sincronismo vence', () => {
  const g = new Game(L.l5);
  let evs = play(g, [['confirmExit'], ['unground', 'BUS', R], ['unground', 'G1', R], ['unsignal'],
    ['unlock', '89-E'], ['unlock', '89-G'], ['authorize'],
    ['operate', '89-E', 'close'], ['operate', '52-E', 'close'], ['operate', '89-G', 'close']]);
  assert.ok(!types(evs).includes('death'));
  assert.ok(g.needsSync('52-G'));
  evs = g.operate('52-G', 'close', { syncAngle: 4 });
  assert.ok(types(evs).includes('win'), JSON.stringify(evs));
  assert.strictEqual(g.s.infractions.length, 0);
});

test('fase 5: fechar com aterramento instalado = curto', () => {
  const g = new Game(L.l5);
  const evs = play(g, [['confirmExit'], ['unground', 'BUS', R], ['unsignal'], ['unlock', '89-E'], ['unlock', '89-G'], ['authorize'],
    ['operate', '89-E', 'close'], ['operate', '52-E', 'close'], ['operate', '89-G', 'close']]);
  assert.strictEqual(evs.at(-1).type, 'death');
  assert.match(evs.at(-1).death.title, /ATERRAMENTO/);
});

test('fase 5: religar sem chamada nominal = equipe morre', () => {
  const g = new Game(L.l5);
  g.s.grounds = {};
  g.s.dev['89-E'].locks = [];
  const evs = play(g, [['authorize'], ['operate', '89-E', 'close'], ['operate', '52-E', 'close']]);
  assert.strictEqual(evs.at(-1).type, 'death');
  assert.match(evs.at(-1).death.title, /EQUIPE/);
});

test('fase 5: fora de sincronismo = desastre', () => {
  const g = new Game(L.l5);
  play(g, [['confirmExit'], ['unground', 'BUS', R], ['unground', 'G1', R], ['unsignal'], ['unlock', '89-E'], ['unlock', '89-G'], ['authorize'],
    ['operate', '89-E', 'close'], ['operate', '52-E', 'close'], ['operate', '89-G', 'close']]);
  const evs = g.operate('52-G', 'close', { syncAngle: 90 });
  assert.strictEqual(evs.at(-1).death.kind, 'sync');
});

test('cadeados de outros só saem com a chamada nominal', () => {
  const g = new Game(L.l5);
  g.unlock('89-E');
  assert.deepStrictEqual(g.s.dev['89-E'].locks, ['Ana', 'Carlos']);
  g.confirmExit();
  assert.deepStrictEqual(g.s.dev['89-E'].locks, []);
});
