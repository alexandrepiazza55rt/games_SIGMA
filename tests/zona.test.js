// Testes do "Zona Morta": tabela de raios, pontuação, geometria do munck e viabilidade das missões.
const test = require('node:test');
const assert = require('node:assert');
const G = require('../zona-morta/js/geo.js');
const { missions, PREP } = require('../zona-morta/js/missions.js');

test('raios seguem a tabela do curso (slide 96)', () => {
  assert.deepStrictEqual([G.zonesFor(0.38).zr, G.zonesFor(0.38).zc], [0.20, 0.70]);
  assert.deepStrictEqual([G.zonesFor(13.8).zr, G.zonesFor(13.8).zc], [0.38, 1.38]);
  assert.deepStrictEqual([G.zonesFor(34.5).zr, G.zonesFor(34.5).zc], [0.58, 1.58]);
  assert.deepStrictEqual([G.zonesFor(230).zr, G.zonesFor(230).zc], [1.60, 3.60]);
  assert.deepStrictEqual([G.zonesFor(500).zr, G.zonesFor(500).zc], [6.40, 9.40]);
  assert.strictEqual(G.zonesFor(69), null);
});

test('toda missão usa uma tensão que existe na tabela', () => {
  for (const m of missions) if (m.type !== 'emerg') assert.ok(G.zonesFor(m.kv), m.title);
});

test('aproximação: zona de risco mata, autorizado pode ficar na controlada', () => {
  const z = G.zonesFor(13.8);
  assert.strictEqual(G.approachResult(0.30, z, true).outcome, 'dead');
  const ok = G.approachResult(0.42, z, true);
  assert.strictEqual(ok.outcome, 'ok');
  assert.ok(ok.points > 800);
  assert.ok(G.approachResult(1.0, z, true).points < ok.points);
});

test('aproximação: não autorizado na zona controlada é invasão', () => {
  const z = G.zonesFor(13.8);
  assert.strictEqual(G.approachResult(1.0, z, false).outcome, 'invaded');
  assert.strictEqual(G.approachResult(1.45, z, false).outcome, 'ok');
  assert.strictEqual(G.approachResult(0.2, z, false).outcome, 'dead');
});

test('geometria: distância a segmento e retângulo', () => {
  assert.strictEqual(G.distSeg(0, 1, -1, 0, 1, 0), 1);
  assert.strictEqual(G.distSeg(3, 0, -1, 0, 1, 0), 2);
  assert.strictEqual(G.distRect(0, 0, -1, -1, 1, 1), 0);
  assert.strictEqual(G.distRect(3, 0, -1, -1, 1, 1), 2);
});

test('ponta da lança respeita alcance e chão', () => {
  const m = missions.find((x) => x.type === 'munck');
  const t = G.clampTip(m.pivot, { x: 100, y: 0 }, m);
  assert.ok(Math.abs(G.dist(t.x, t.y, m.pivot.x, m.pivot.y) - m.maxLen) < 1e-9 || t.y === m.cable + m.loadH);
  assert.ok(t.y >= m.cable + m.loadH);
});

// Percorre um caminho de pontos da ponta da lança em passos de 5 cm e devolve a menor distância à rede.
function walk(m, path) {
  let min = Infinity, tip = { ...m.start };
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], n = Math.ceil(G.dist(a.x, a.y, b.x, b.y) / 0.05);
    for (let k = 0; k <= n; k++) {
      tip = G.clampTip(m.pivot, { x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n }, m);
      const s = G.crane(m.pivot, tip, m);
      assert.ok(!G.rectsOverlap(s.load, m.wall), `carga bate no muro em ${tip.x.toFixed(1)},${tip.y.toFixed(1)}`);
      min = Math.min(min, G.craneDistance(s, m.cond));
    }
  }
  return { min, tip };
}

test('munck 13,8 kV tem solução por baixo da rede sem entrar na zona controlada', () => {
  const m = missions.find((x) => x.type === 'munck' && x.kv === 13.8);
  const r = walk(m, [m.start, { x: 6, y: 5.7 }, { x: 14.3, y: 5.7 }, { x: 14.3, y: 3.0 }]);
  assert.ok(r.min > G.zonesFor(m.kv).zc, `menor distância ${r.min.toFixed(2)}`);
  const load = G.crane(m.pivot, r.tip, m).load;
  assert.ok(load[0] >= m.target[0] && load[2] <= m.target[1] && load[1] < 0.3);
});

test('munck 230 kV tem solução por baixo da linha', () => {
  const m = missions.find((x) => x.type === 'munck' && x.kv === 230);
  const r = walk(m, [m.start, { x: 6, y: 9 }, { x: 20.7, y: 9 }, { x: 20.7, y: 4.0 }]);
  assert.ok(r.min > G.zonesFor(m.kv).zc, `menor distância ${r.min.toFixed(2)}`);
  const load = G.crane(m.pivot, r.tip, m).load;
  assert.ok(load[0] >= m.target[0] && load[2] <= m.target[1] && load[1] < 0.3);
});

test('armadilha: passar por cima obriga a lança a varrer a rede ao descer a carga', () => {
  const m = missions.find((x) => x.type === 'munck' && x.kv === 13.8);
  const r = walk(m, [m.start, { x: 3, y: 11.2 }, { x: 13.3, y: 9.9 }, { x: 14.3, y: 3.0 }]);
  assert.ok(r.min < G.zonesFor(m.kv).zr, `menor distância ${r.min.toFixed(2)}`);
});

test('caminho reto pela altura da rede encosta nela', () => {
  const m = missions.find((x) => x.type === 'munck' && x.kv === 13.8);
  const r = walk(m, [m.start, { x: 3, y: 9 }, { x: 10, y: 9 }]);
  assert.ok(r.min < G.zonesFor(m.kv).zr);
});

test('aproximação: a posição inicial é segura e o limite é alcançável', () => {
  for (const m of missions.filter((x) => x.type === 'aprox')) {
    const z = G.zonesFor(m.kv);
    assert.ok(G.dist(m.start.x, m.start.y, m.cond.x, m.cond.y) > z.zc, `${m.title}: começa fora da ZC`);
    const lim = m.authorized ? z.zr : z.zc;
    // existe ponto alcançável a exatamente lim + 5 cm do condutor
    const y = Math.min(m.reach.y1, Math.max(m.reach.y0, m.cond.y));
    const dy = Math.abs(y - m.cond.y), dx = Math.sqrt(Math.max(0, (lim + 0.05) ** 2 - dy * dy));
    assert.ok(m.cond.x - dx >= m.reach.x0, `${m.title}: limite alcançável`);
    assert.ok(dy < lim + 0.05, `${m.title}: altura permite chegar no limite`);
  }
});

test('emergências têm exatamente uma resposta certa e explicação para as erradas', () => {
  for (const m of missions.filter((x) => x.type === 'emerg')) {
    assert.strictEqual(m.options.filter((o) => o.ok).length, 1);
    for (const o of m.options) if (!o.ok) assert.ok(o.why);
  }
  assert.strictEqual(PREP.filter((p) => !p.ok).length, 1);
});
