/*
 * Regras e geometria do "Zona Morta". Sem DOM — testável no Node.
 * Unidades em metros, eixo y para cima (0 = chão ou piso de trabalho).
 */
(function (root) {
  'use strict';

  // Raios de referência do curso (Módulo 6, slide 96 — valores ilustrativos do anexo da NR-10).
  var ZONES = [
    { min: 0, max: 1, label: '< 1 kV', zr: 0.20, zc: 0.70 },
    { min: 10, max: 15, label: '≥ 10 e < 15 kV', zr: 0.38, zc: 1.38 },
    { min: 30, max: 36, label: '≥ 30 e < 36 kV', zr: 0.58, zc: 1.58 },
    { min: 145, max: 245, label: '≥ 145 e < 245 kV', zr: 1.60, zc: 3.60 },
    { min: 500, max: 750, label: '≥ 500 e < 750 kV', zr: 6.40, zc: 9.40 }
  ];

  function zonesFor(kv) {
    for (var i = 0; i < ZONES.length; i++) if (kv >= ZONES[i].min && kv < ZONES[i].max) return ZONES[i];
    return null;
  }

  function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }

  // Distância do ponto P ao segmento AB.
  function distSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    var t = L ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)) : 0;
    return dist(px, py, ax + t * dx, ay + t * dy);
  }

  // Distância do ponto P a um retângulo (0 se dentro).
  function distRect(px, py, x0, y0, x1, y1) {
    var dx = Math.max(x0 - px, 0, px - x1), dy = Math.max(y0 - py, 0, py - y1);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function zoneOf(d, z) { return d < z.zr ? 'risco' : d < z.zc ? 'controlada' : 'livre'; }

  /*
   * Aproximação: o ponto mais avançado (mão ou ferramenta) para a distância d do condutor.
   * Autorizado pode entrar na zona controlada, nunca na de risco.
   * Não autorizado fica na zona livre.
   * Quanto mais perto do limite permitido (por fora), mais pontos.
   */
  function approachResult(d, z, authorized) {
    var limit = authorized ? z.zr : z.zc;
    var r = { d: d, zone: zoneOf(d, z), limit: limit };
    if (d < z.zr) { r.outcome = 'dead'; r.points = 0; return r; }
    if (!authorized && d < z.zc) { r.outcome = 'invaded'; r.points = 100; return r; }
    var gap = d - limit;
    var precision = Math.max(0, 1 - gap / (limit * 0.8 + 0.25));
    r.outcome = 'ok';
    r.precision = precision;
    r.points = Math.round(200 + 800 * precision);
    return r;
  }

  /*
   * Munck: pivô da lança, ponta (tip), cabo de comprimento `cable` e carga (w × h) pendurada.
   * Devolve as formas e a menor distância até o condutor.
   */
  function crane(pivot, tip, cfg) {
    var loadTop = tip.y - cfg.cable, loadBot = loadTop - cfg.loadH;
    return {
      boom: [pivot.x, pivot.y, tip.x, tip.y],
      cable: [tip.x, tip.y, tip.x, loadTop],
      load: [tip.x - cfg.loadW / 2, loadBot, tip.x + cfg.loadW / 2, loadTop]
    };
  }

  function craneDistance(shapes, c) {
    var b = shapes.boom, k = shapes.cable, l = shapes.load;
    return Math.min(
      distSeg(c.x, c.y, b[0], b[1], b[2], b[3]),
      distSeg(c.x, c.y, k[0], k[1], k[2], k[3]),
      distRect(c.x, c.y, l[0], l[1], l[2], l[3])
    );
  }

  // Limita a ponta da lança ao alcance e ao chão (a carga não atravessa o solo).
  function clampTip(pivot, p, cfg) {
    var dx = p.x - pivot.x, dy = p.y - pivot.y, L = Math.sqrt(dx * dx + dy * dy) || 1e-6;
    var len = Math.max(cfg.minLen, Math.min(cfg.maxLen, L));
    var x = pivot.x + dx / L * len, y = pivot.y + dy / L * len;
    y = Math.max(y, cfg.cable + cfg.loadH);
    return { x: x, y: y };
  }

  function rectsOverlap(a, b) { return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }

  var api = {
    ZONES: ZONES, zonesFor: zonesFor, dist: dist, distSeg: distSeg, distRect: distRect, zoneOf: zoneOf,
    approachResult: approachResult, crane: crane, craneDistance: craneDistance, clampTip: clampTip, rectsOverlap: rectsOverlap
  };
  root.ZM = root.ZM || {};
  for (var k in api) root.ZM[k] = api[k];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
