/*
 * Regras do "Veste ou Queima": catálogo do armário de EPI, tarefas com etiqueta de arc flash e
 * avaliação do "teste do arco". Sem DOM — testável no Node.
 */
(function (root) {
  'use strict';

  var REF = {
    epi: 'Módulo 5 · EPI — a última barreira (slide 79)',
    face: 'Módulo 5 · Proteção da cabeça, olhos e face (slide 80)',
    atpv: 'Módulo 5 · Vestimenta resistente ao arco (ATPV) (slide 81)',
    luvas: 'Módulo 5 · Luvas isolantes de borracha (slide 82)',
    calcados: 'Módulo 5 · Calçados, mangas e outras proteções (slide 83)',
    quedas: 'Módulo 5 · Proteção contra quedas (trabalho em altura) (slide 84)',
    hierarquia: 'Módulo 3 · Hierarquia das medidas de controle (slide 43)',
    etiqueta: 'Módulo 16 · Etiquetagem de arc flash (slide 242)',
    manut: 'Módulo 16 · Modo de manutenção e relés de arco (slide 245)',
    exposicao: 'Módulo 16 · Procedimentos que reduzem a exposição (slide 248)',
    classificada: 'Módulo 19 · Integração com áreas classificadas (slide 290)'
  };

  var BURN = 1.2; // cal/cm²: início de queimadura de 2º grau

  // Armário. atpv em cal/cm²; maxV da luva em volts.
  var SLOTS = [
    { id: 'corpo', label: 'Vestimenta', icon: '🧥', items: [
      { id: 'sint', label: 'Camiseta de poliéster', atpv: 0, melts: true },
      { id: 'alg', label: 'Uniforme de algodão comum', atpv: 0 },
      { id: 'fr8', label: 'Uniforme FR ATPV 8', atpv: 8 },
      { id: 'fr25', label: 'Conjunto FR ATPV 25', atpv: 25 },
      { id: 'fr40', label: 'Macacão FR ATPV 40', atpv: 40 }
    ] },
    { id: 'cabeca', label: 'Cabeça e face', icon: '⛑️', items: [
      { id: 'bone', label: 'Boné', atpv: 0, helmet: false },
      { id: 'cap', label: 'Capacete classe B + óculos', atpv: 0, helmet: true },
      { id: 'face12', label: 'Capacete + protetor facial ATPV 12', atpv: 12, helmet: true },
      { id: 'capuz40', label: 'Capacete + capuz balaclava ATPV 40', atpv: 40, helmet: true }
    ] },
    { id: 'maos', label: 'Mãos', icon: '🧤', items: [
      { id: 'vaq', label: 'Luva de vaqueta', maxV: 0 },
      { id: 'c00', label: 'Isolante classe 00 (500 V) + cobertura', maxV: 500 },
      { id: 'c0', label: 'Isolante classe 0 (1.000 V) + cobertura', maxV: 1000 },
      { id: 'c2', label: 'Isolante classe 2 (17.000 V) + cobertura', maxV: 17000 },
      { id: 'c4', label: 'Isolante classe 3/4 (até 36.000 V) + cobertura', maxV: 36000 }
    ] },
    { id: 'pes', label: 'Pés', icon: '🥾', items: [
      { id: 'tenis', label: 'Tênis comum', ok: false },
      { id: 'aco', label: 'Bota com biqueira de aço', ok: false, metal: true },
      { id: 'isol', label: 'Calçado isolante sem partes metálicas', ok: true }
    ] },
    { id: 'intima', label: 'Por baixo', icon: '🩲', items: [
      { id: 'isint', label: 'Roupa íntima sintética', melts: true },
      { id: 'ialg', label: 'Roupa íntima de algodão' }
    ] },
    { id: 'extras', label: 'Extras', icon: '🎒', multi: true, items: [
      { id: 'auric', label: 'Protetor auricular' },
      { id: 'colete', label: 'Colete de alta visibilidade' },
      { id: 'cinto', label: 'Cinturão paraquedista + talabarte' },
      { id: 'mangas', label: 'Mangas isolantes' },
      { id: 'lanEx', label: 'Lanterna Ex (à prova de explosão)' },
      { id: 'lanCom', label: 'Lanterna comum' }
    ] }
  ];

  var EXTRA_WHY = {
    auric: ['Protetor auricular conforme o ruído do ambiente (subestações, casas de máquina).', REF.calcados],
    colete: ['Vestimenta de alta visibilidade em pátios e vias com tráfego.', REF.calcados],
    cinto: ['Cinturão tipo paraquedista e talabarte com absorvedor de energia no trabalho em altura.', REF.quedas],
    mangas: ['Mangas isolantes complementam as luvas em manobras de MT.', REF.calcados],
    lanEx: ['Em área classificada, equipamentos elétricos seguem proteção Ex.', REF.classificada]
  };

  function item(slot, id) {
    var s = SLOTS.filter(function (x) { return x.id === slot; })[0];
    return s.items.filter(function (i) { return i.id === id; })[0];
  }

  var TASKS = [
    {
      id: 't1', title: 'Medição no CCM', place: 'Sala elétrica 2 · CCM-A 480 V',
      text: 'Medir a corrente de um motor com o painel aberto e energizado, a 45 cm dos barramentos.',
      kv: 0.48, shock: true, E: 4, boundary: '0,9 m',
      need: [], epc: []
    },
    {
      id: 't2', title: 'Extração do disjuntor', place: 'Cubículo de MT · 13,8 kV',
      text: 'Extrair o disjuntor 52-3 do cubículo para manutenção. A extração é feita na frente do painel.',
      kv: 13.8, shock: true, E: 25, boundary: '3,2 m',
      need: ['mangas'],
      epc: [{ id: 'remota', label: '🖥️ Abrir pelo supervisório e extrair com o dispositivo de extração remota, fora da fronteira de arco', E: 0.5, noShock: true, ref: REF.exposicao }]
    },
    {
      id: 't3', title: 'Ronda no pátio', place: 'Pátio da subestação · caminhões circulando',
      text: 'Inspeção termográfica nos seccionadores do pátio, de longe, fora da fronteira de arco. Caminhões de cana passam pela via ao lado.',
      kv: 138, shock: false, E: 0.3, boundary: '—',
      need: ['colete'], epc: []
    },
    {
      id: 't4', title: 'Casa de força', place: 'Turbogerador TG-01 · painel de excitação 480 V',
      text: 'Ajuste no painel de excitação energizado, ao lado do turbogerador em operação (ruído de 98 dB).',
      kv: 0.48, shock: true, E: 7, boundary: '1,3 m',
      need: ['auric'], epc: []
    },
    {
      id: 't5', title: 'Linha viva no alto', place: 'Rede de 34,5 kV · estrutura a 9 m',
      text: 'Trabalho à distância com bastão, em linha viva de 34,5 kV, a partir da estrutura.',
      kv: 34.5, shock: true, E: 6, boundary: '1,1 m',
      need: ['cinto', 'mangas'], epc: []
    },
    {
      id: 't6', title: 'O painel de 40', place: 'CCM principal · 480 V',
      text: 'Troca de gaveta no CCM principal energizado. A etiqueta mostra 40 cal/cm² — mas o relé tem modo de manutenção.',
      kv: 0.48, shock: true, E: 40, boundary: '6,5 m',
      need: [],
      epc: [{ id: 'manut', label: '⚙️ Ativar o modo de manutenção no relé (eliminação rápida)', E: 6, ref: REF.manut }]
    },
    {
      id: 't7', title: 'Perigo extremo', place: 'Barramento de entrada · 13,8 kV',
      text: 'Reaperto de conexão no barramento de entrada, energizado. A etiqueta indica 62 cal/cm².',
      kv: 13.8, shock: true, E: 62, boundary: '9,8 m',
      need: ['mangas'],
      epc: [{ id: 'desen', label: '🔌 Não fazer energizado: desenergizar, bloquear e aterrar antes', E: 0, noShock: true, ref: REF.hierarquia }],
      note: 'Nenhuma vestimenta do armário passa de 40 cal/cm². Acima do que o EPI suporta, o certo é eliminar o risco: desenergizar.'
    },
    {
      id: 't8', title: 'Pó de milho', place: 'Moagem de milho · área classificada · painel 480 V',
      text: 'Inspeção no painel da moega, dentro da área classificada (poeira de milho). Iluminação fraca dentro do painel.',
      kv: 0.48, shock: true, E: 4, boundary: '0,9 m',
      need: ['lanEx'], forbid: ['lanCom'], epc: []
    }
  ];

  function kvLabel(kv) { return kv < 1 ? Math.round(kv * 1000) + ' V' : String(kv).replace('.', ',') + ' kV'; }

  /*
   * kit = { corpo, cabeca, maos, pes, intima, extras: [] }, epc = id da medida coletiva ou null.
   * Devolve E efetivo, lesões por parte do corpo, infrações e o desfecho.
   */
  function evaluate(task, kit, epcId) {
    var epc = (task.epc || []).filter(function (x) { return x.id === epcId; })[0] || null;
    var E = epc ? epc.E : task.E;
    var shock = task.shock && !(epc && epc.noShock);
    var V = task.kv * 1000;
    var parts = { corpo: 'ok', cabeca: 'ok', maos: 'ok', pes: 'ok' };
    var injuries = [], infractions = [], fatal = false;

    function hurt(part, sev, msg, ref) {
      if (sev === 'grave' || parts[part] !== 'grave') parts[part] = sev;
      injuries.push({ part: part, sev: sev, msg: msg, ref: ref });
    }
    function inf(msg, ref) { infractions.push({ msg: msg, ref: ref }); }

    var body = item('corpo', kit.corpo), head = item('cabeca', kit.cabeca), hands = item('maos', kit.maos),
      feet = item('pes', kit.pes), under = item('intima', kit.intima), extras = kit.extras || [];

    // corpo
    if (E >= BURN && body.atpv < E) {
      var grave = body.atpv === 0 || body.melts || E / body.atpv > 1.5;
      hurt('corpo', grave ? 'grave' : 'leve', (body.melts ? 'O poliéster DERRETEU e grudou na pele. ' : '') +
        'Vestimenta ATPV ' + body.atpv + ' contra ' + E + ' cal/cm²: queimadura de ' + (grave ? '3º' : '2º') + ' grau no tronco e braços.', REF.atpv);
      if (grave && E >= 12) fatal = true;
    }
    // roupa íntima
    if (under.melts && E >= BURN) {
      if (parts.corpo !== 'ok') hurt('corpo', 'grave', 'A roupa íntima sintética derreteu por baixo da queimadura e agravou a lesão.', REF.atpv);
      else inf('Roupa íntima sintética: com o calor do arco ela pode derreter na pele, mesmo por baixo da roupa FR.', REF.atpv);
    }
    // cabeça e face
    if (!head.helmet) inf('Sem capacete classe B isolante.', REF.face);
    if (E >= BURN && head.atpv < E) {
      var gf = head.atpv === 0 || E / head.atpv > 1.5;
      hurt('cabeca', gf ? 'grave' : 'leve', (head.atpv === 0 ? 'Rosto exposto ao arco' : 'Protetor facial ATPV ' + head.atpv + ' contra ' + E + ' cal/cm²') +
        ': queimadura no rosto e risco de cegueira.', REF.face);
      if (gf && E >= 25) fatal = true;
    }
    // mãos
    if (shock && hands.maxV < V) {
      hurt('maos', 'grave', (hands.maxV ? 'Luva ' + hands.label.split(' (')[0].toLowerCase() + ' vai só até ' + hands.maxV.toLocaleString('pt-BR') + ' V' : 'Luva de vaqueta não isola') +
        ' — a tensão é ' + kvLabel(task.kv) + '. Choque elétrico pelas mãos.', REF.luvas);
      fatal = true;
    }
    // pés
    if (!feet.ok) {
      inf(feet.metal ? 'Bota com biqueira de aço: calçado de eletricista é isolante, sem partes metálicas expostas.' : 'Tênis comum não é calçado de segurança isolante.', REF.calcados);
      parts.pes = 'leve';
    }
    // extras
    (task.need || []).forEach(function (n) {
      if (n === 'mangas' && !shock) return;
      if (extras.indexOf(n) < 0) inf('Faltou: ' + item('extras', n).label.toLowerCase() + '. ' + EXTRA_WHY[n][0], EXTRA_WHY[n][1]);
    });
    (task.forbid || []).forEach(function (f) {
      if (extras.indexOf(f) >= 0) {
        hurt('corpo', 'grave', 'A lanterna comum faiscou na poeira de milho: ignição da atmosfera explosiva.', REF.classificada);
        fatal = true;
      }
    });

    var hasGrave = injuries.some(function (i) { return i.sev === 'grave'; });
    var outcome = fatal ? 'morto' : injuries.length ? 'ferido' : infractions.length ? 'ok' : 'perfeito';
    var epcBonus = epc && epc.E < task.E ? 200 : 0;
    var points = outcome === 'morto' ? 0 : outcome === 'ferido' ? Math.max(0, 300 - infractions.length * 100) :
      Math.max(200, 1000 - infractions.length * 150) + epcBonus;
    return { E: E, shock: shock, epc: epc, parts: parts, injuries: injuries, infractions: infractions, outcome: outcome, points: points, grave: hasGrave };
  }

  var api = { SLOTS: SLOTS, TASKS: TASKS, REF: REF, BURN: BURN, evaluate: evaluate, item: item, kvLabel: kvLabel };
  root.VQ = root.VQ || {};
  for (var k in api) root.VQ[k] = api[k];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
