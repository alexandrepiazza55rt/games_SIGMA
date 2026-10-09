/*
 * Fases do "Desenergiza ou Morre". Cada fase descreve o diagrama unifilar
 * (nós, dispositivos, fontes), a zona de trabalho e os eventos que acontecem
 * quando a equipe é liberada. Coordenadas em um viewBox de 900 x 540.
 *
 * nó:          { label, kv, paths: [[x1,y1,x2,y2,...]], kind: 'bus'|'wire', lp: [x,y] rótulo,
 *                bp: [x,y] selo da medição, gp: [x,y] ponto do aterramento, gd: 'r'|'d', adjacent }
 * dispositivo: { type: '52'|'89', label, short, a, b, x, y, o: 'v'|'h', assoc, closed, sync, visible, wrong }
 */
(function (root) {
  'use strict';
  var REF = root.SEP.REF;

  function motor(x, y, txt) {
    return '<circle cx="' + x + '" cy="' + y + '" r="22" class="sym"/><text x="' + x + '" y="' + (y + 6) +
      '" class="sym-t" text-anchor="middle">' + (txt || 'M') + '</text>';
  }
  function tower(x, y) {
    return '<path d="M' + (x - 14) + ' ' + (y + 46) + ' L' + x + ' ' + (y - 6) + ' L' + (x + 14) + ' ' + (y + 46) +
      ' M' + (x - 20) + ' ' + (y + 4) + ' L' + (x + 20) + ' ' + (y + 4) + '" class="tower"/>';
  }

  function fresh(g, n) { var t = g.s.tests[n]; return !!t && t.version === g.s.version; }

  // Topologia compartilhada pelas fases 2 e 5 (barra com rede + cogeração).
  function cogenTopology(closed) {
    return {
      nodes: {
        R: { label: 'Entrada da rede', kv: '13,8 kV', paths: [[200, 62, 200, 95]], lp: [212, 84], bp: [212, 66] },
        E1: { label: 'Trecho 89-E/52-E', kv: '13,8 kV', paths: [[200, 145, 200, 185]], lp: [212, 170], bp: [130, 170], gp: [200, 165], gd: 'l' },
        BUS: {
          label: 'Barra MT-B', kv: '13,8 kV', kind: 'bus',
          paths: [[200, 235, 200, 290], [120, 290, 780, 290], [600, 235, 600, 290], [400, 290, 400, 325]],
          lp: [124, 278], bp: [690, 318], gp: [740, 290], gd: 'd'
        },
        GT: { label: 'Terminais do TG-01', kv: '13,8 kV', paths: [[600, 62, 600, 95]], lp: [612, 84], bp: [612, 66] },
        G1: { label: 'Saída do TG (52-G/89-G)', kv: '13,8 kV', paths: [[600, 145, 600, 185]], lp: [652, 170], bp: [652, 188], gp: [600, 165], gd: 'r' },
        L1: { label: 'Trecho 89-L/52-L', kv: '13,8 kV', paths: [[400, 375, 400, 415]], lp: [412, 400], bp: [412, 380] },
        LOAD: { label: 'Alimentador CCMs/Moenda', kv: '13,8 kV', paths: [[400, 465, 400, 500]], lp: [412, 492], bp: [412, 470] }
      },
      sources: [
        { id: 'REDE', label: 'Rede da concessionária', short: 'Rede', node: 'R', x: 200, y: 40, kind: 'rede',
          lesson: 'Seccione TODAS as fontes da barra, bloqueie e constate a ausência de tensão antes de liberar.', ref: REF.etapa1 },
        { id: 'TG', label: 'Turbogerador TG-01 (cogeração)', short: 'TG-01 · cogeração', node: 'GT', x: 600, y: 40, kind: 'gerador',
          lesson: 'Na usina, a cogeração é fonte adicional: abra e bloqueie também o 52-G/89-G do TG-01. Desligar a rede não desenergiza a barra.', ref: REF.etapa1 }
      ],
      devices: {
        '89-E': { type: '89', label: 'Seccionadora 89-E', short: '89-E', a: 'R', b: 'E1', assoc: '52-E', x: 200, y: 120, closed: closed },
        '52-E': { type: '52', label: 'Disjuntor 52-E', short: '52-E', a: 'E1', b: 'BUS', x: 200, y: 210, closed: closed, sync: true },
        '52-G': { type: '52', label: 'Disjuntor 52-G', short: '52-G', a: 'GT', b: 'G1', x: 600, y: 120, closed: closed, sync: true },
        '89-G': { type: '89', label: 'Seccionadora 89-G', short: '89-G', a: 'G1', b: 'BUS', assoc: '52-G', x: 600, y: 210, closed: closed },
        '89-L': { type: '89', label: 'Seccionadora 89-L', short: '89-L', a: 'BUS', b: 'L1', assoc: '52-L', x: 400, y: 350 },
        '52-L': { type: '52', label: 'Disjuntor 52-L', short: '52-L', a: 'L1', b: 'LOAD', x: 400, y: 440 }
      },
      zone: ['BUS'],
      zoneRect: [110, 262, 680, 52],
      decor: '<text x="560" y="520" class="dim">CCMs · moenda · bombas</text>'
    };
  }

  var levels = [];

  // ------------------------------------------------------------------ 1
  levels.push({
    id: 'l1', title: 'Primeiro Turno', tag: 'TUTORIAL', time: 240,
    place: 'Usina Leste-Oeste · Casa de bombas · 06h12',
    briefing: 'A bomba de vinhaça M-01 parou com cheiro de queimado. A OS manda trocar o cabo de alimentação do motor. ' +
      'Você é o executante da desenergização. A Barra 13,8 kV continua energizada alimentando a moenda — e fica a um braço de distância do cubículo.',
    objective: 'Desenergize o alimentador do motor M-01 seguindo as 6 etapas e libere a equipe.',
    hints: true,
    authMsg: '"OM-0412 conferida — abrir 52-1, abrir 89-1, bloquear, constatar e aterrar o M-01. Autorizado." Você repete a ordem em voz alta.',
    nodes: {
      BAR: { label: 'Barra 13,8 kV', kv: '13,8 kV', kind: 'bus', adjacent: true,
        paths: [[450, 62, 450, 100], [150, 100, 750, 100], [300, 100, 300, 135], [600, 100, 600, 135]], lp: [156, 88], bp: [660, 84] },
      F1: { label: 'Trecho 89-1/52-1', kv: '13,8 kV', paths: [[300, 185, 300, 235]], lp: [314, 214], bp: [210, 214] },
      M01: { label: 'Cabo + motor M-01', kv: '13,8 kV', paths: [[300, 285, 300, 430]], lp: [314, 330], bp: [314, 352], gp: [300, 395], gd: 'r' },
      F2: { label: 'Trecho 89-2/52-2', kv: '13,8 kV', paths: [[600, 185, 600, 235]], lp: [614, 214], bp: [510, 214] },
      TR2: { label: 'Alimentador da moenda', kv: '13,8 kV', paths: [[600, 285, 600, 430]], lp: [614, 330], bp: [614, 352] }
    },
    sources: [
      { id: 'REDE', label: 'Rede (SE de entrada)', short: 'Rede · SE de entrada', node: 'BAR', x: 450, y: 40, kind: 'rede',
        lesson: 'Abra o disjuntor e a seccionadora do alimentador CERTO, bloqueie e constate a ausência de tensão antes de liberar. Desligar não é desenergizar.', ref: REF.desligar }
    ],
    devices: {
      '89-1': { type: '89', label: 'Seccionadora 89-1', short: '89-1', a: 'BAR', b: 'F1', assoc: '52-1', x: 300, y: 160 },
      '52-1': { type: '52', label: 'Disjuntor 52-1', short: '52-1', a: 'F1', b: 'M01', x: 300, y: 260 },
      '89-2': { type: '89', label: 'Seccionadora 89-2', short: '89-2', a: 'BAR', b: 'F2', assoc: '52-2', x: 600, y: 160,
        wrong: 'Manobrou o alimentador da MOENDA (89-2/52-2), não o do M-01. Identifique o equipamento antes de manobrar.' },
      '52-2': { type: '52', label: 'Disjuntor 52-2', short: '52-2', a: 'F2', b: 'TR2', x: 600, y: 260,
        wrong: 'Desligou o disjuntor da MOENDA (52-2): produção parada e o M-01 continua alimentado. Identifique o equipamento antes de manobrar.' }
    },
    zone: ['M01'],
    requiredGrounds: ['M01'],
    zoneRect: [232, 292, 150, 196],
    decor: motor(300, 452) + motor(600, 452, 'Mo') + '<text x="640" y="490" class="dim">moenda (produção)</text>',
    events: [
      { type: 'touchAdjacent', node: 'BAR', who: 'Ana (eletricista)', msg: 'Puxando o cabo velho… o cotovelo passou RENTE à barra de 13,8 kV!' }
    ],
    pressure: [
      { t: 25, who: 'Gerente de produção', msg: 'Bom dia! A vinhaça tá acumulando no tanque. Quanto tempo pra bomba voltar?' },
      { t: 95, who: 'Chefe de turno', msg: 'Pô, é só trocar um cabo. Pula essa burocracia aí que eu assino a PT depois.' }
    ],
    checklist: [
      ['Autorização / ordem de manobra', function (g) { return g.s.authorized; }],
      ['1 · Seccionar: abrir 52-1 e DEPOIS 89-1', function (g) { return !g.s.dev['52-1'].closed && !g.s.dev['89-1'].closed; }],
      ['2 · Impedir reenergização: cadeado + etiqueta', function (g) { return g.s.dev['52-1'].locks.length > 0 && g.s.dev['89-1'].locks.length > 0; }],
      ['3 · Testar o detector e constatar ausência no M-01', function (g) { return g.s.detector.tested && fresh(g, 'M01'); }],
      ['4 · Aterramento temporário no M-01', function (g) { return !!g.s.grounds.M01; }],
      ['5 · Manta isolante na barra energizada vizinha', function (g) { return !!g.s.covers.BAR; }],
      ['6 · Sinalizar a área', function (g) { return g.s.signed; }]
    ],
    winMsg: 'Cabo trocado. Ana, Bruno e você voltaram pra casa inteiros.'
  });

  // ------------------------------------------------------------------ 2
  var l2 = cogenTopology(true);
  levels.push(Object.assign(l2, {
    id: 'l2', title: 'Fonte Escondida', tag: 'COGERAÇÃO', time: 200,
    place: 'Usina Leste-Oeste · Subestação interna · 09h40',
    briefing: 'Um isolador trincou na Barra MT-B e precisa ser trocado. A barra é alimentada pela rede (52-E) — e pelo turbogerador TG-01 ' +
      'da cogeração, que queima bagaço e exporta energia. A produção não quer parar nada.',
    objective: 'Desenergize a Barra MT-B e libere a equipe.',
    authMsg: '"OM-0587 conferida — isolar a Barra MT-B de TODAS as fontes, inclusive o TG-01. Autorizado." Você repete a ordem.',
    requiredGrounds: ['BUS'],
    events: [
      { type: 'remoteClose', dev: '52-G', who: 'Operador da casa de força', msg: '"A produção tá cobrando! Vou sincronizar o TG-01 de volta pelo 52-G…"' }
    ],
    pressure: [
      { t: 20, who: 'Gerente industrial', msg: 'Se desligar o TG-01 a gente para de exportar energia. São R$ 18 mil por hora!' },
      { t: 85, who: 'Operador da casa de força', msg: 'O TG tá tão estável… precisa mesmo tirar ele? Desliga só a rede.' }
    ],
    winMsg: 'Isolador trocado. A barra estava viva pelo TG-01 até você isolar a cogeração. Ninguém se feriu.'
  }));

  // ------------------------------------------------------------------ 3
  levels.push({
    id: 'l3', title: 'Linha Fantasma', tag: 'INDUÇÃO', time: 220,
    place: 'Faixa de servidão da LT-01 69 kV · Torre 27 · 14h05',
    briefing: 'A equipe vai trocar uma cadeia de isoladores na torre 27. A LT-01 interliga a SE da usina à SE da concessionária — ' +
      'pode ser alimentada pelas DUAS pontas. Na mesma faixa corre a LT-02, que continuará energizada.',
    objective: 'Desenergize a LT-01 e libere a equipe para subir na Torre 27.',
    authMsg: '"OM-0733 conferida com o COS da concessionária — isolar a LT-01 nas duas extremidades. Autorizado." Você repete a ordem.',
    nodes: {
      SA: { label: 'Barra 69 kV SE Usina', kv: '69 kV', paths: [[72, 320, 100, 320]], bp: [30, 400] },
      A1: { label: 'Trecho 52-A/89-A', kv: '69 kV', paths: [[150, 320, 190, 320]], lp: [110, 420], bp: [110, 440] },
      LA: { label: 'LT-01 · ponta Usina', kv: '69 kV', paths: [[240, 320, 340, 320]], lp: [244, 384], bp: [244, 404], gp: [290, 320], gd: 'd' },
      LZ: { label: 'LT-01 · Torre 27', kv: '69 kV', paths: [[340, 320, 560, 320]], lp: [400, 384], bp: [400, 404], gp: [450, 320], gd: 'd' },
      LB: { label: 'LT-01 · ponta Concess.', kv: '69 kV', paths: [[560, 320, 660, 320]], lp: [544, 384], bp: [560, 404], gp: [610, 320], gd: 'd' },
      B1: { label: 'Trecho 89-B/52-B', kv: '69 kV', paths: [[710, 320, 750, 320]], lp: [690, 420], bp: [690, 440] },
      SB: { label: 'Barra 69 kV SE Concessionária', kv: '69 kV', paths: [[800, 320, 828, 320]], bp: [790, 400] }
    },
    links: [{ a: 'LA', b: 'LZ' }, { a: 'LZ', b: 'LB' }],
    induced: ['LA', 'LZ', 'LB'],
    sources: [
      { id: 'SEU', label: 'SE Usina (TG-01 + rede)', short: 'SE Usina', lp: [12, 284], node: 'SA', x: 50, y: 320, kind: 'rede',
        lesson: 'A linha tem DUAS pontas. Seccione, bloqueie e aterre as duas extremidades.', ref: REF.etapa1 },
      { id: 'SEC', label: 'SE Concessionária', short: 'SE Concessionária', lp: [890, 284], anchor: 'end', node: 'SB', x: 850, y: 320, kind: 'rede',
        lesson: 'A linha tem DUAS pontas. Seccione, bloqueie e aterre as duas extremidades.', ref: REF.etapa1 }
    ],
    devices: {
      '52-A': { type: '52', label: 'Disjuntor 52-A', short: '52-A', a: 'SA', b: 'A1', x: 125, y: 320, o: 'h' },
      '89-A': { type: '89', label: 'Seccionadora 89-A', short: '89-A', a: 'A1', b: 'LA', assoc: '52-A', x: 215, y: 320, o: 'h' },
      '89-B': { type: '89', label: 'Seccionadora 89-B', short: '89-B', a: 'LB', b: 'B1', assoc: '52-B', x: 685, y: 320, o: 'h' },
      '52-B': { type: '52', label: 'Disjuntor 52-B', short: '52-B', a: 'B1', b: 'SB', x: 775, y: 320, o: 'h' }
    },
    zone: ['LZ'],
    requiredGrounds: ['LA', 'LZ', 'LB'],
    viewBox: '0 170 900 290',
    zoneRect: [384, 262, 132, 106],
    zoneLabel: [390, 362],
    decor: '<path d="M60 210 L840 210" class="lt02"/><text x="64" y="196" class="hot-t">LT-02 69 kV — ENERGIZADA (mesma faixa de servidão)</text>' +
      tower(290, 262) + tower(450, 262) + tower(610, 262),
    events: [
      { type: 'remoteClose', dev: '52-B', who: 'COS da concessionária', msg: '"Religamento programado do 52-B da LT-01… executando."' }
    ],
    pressure: [
      { t: 25, who: 'Eng. da concessionária', msg: 'A linha tá desligada nos dois lados, pode mandar subir na torre.' },
      { t: 100, who: 'Encarregado', msg: 'Já aterramos uma ponta, tá bom né? Bora que vai chover.' }
    ],
    winMsg: 'Isoladores trocados. A LT-02 induziu tensão o tempo todo — e seus aterramentos escoaram tudo.'
  });

  // ------------------------------------------------------------------ 4
  levels.push({
    id: 'l4', title: 'Retorno pelo Trafo', tag: 'TURNO DA NOITE', time: 240,
    place: 'Sala elétrica 2 · CCM · 22h30',
    briefing: 'A termografia pegou o terminal MT do transformador TR-03 aquecendo. Ontem a manutenção fechou o acoplamento 52-TIE entre o CCM-A e o CCM-B. ' +
      'O detector da sala é "o de sempre". A barra MT ao lado do cubículo continua energizada.',
    objective: 'Desenergize os terminais MT do TR-03 e libere a equipe.',
    authMsg: '"OM-0921 conferida — desenergizar o TR-03 para reaperto do terminal MT. Autorizado." Você repete a ordem.',
    detectorFaulty: true,
    nodes: {
      BMT: { label: 'Barra MT 13,8 kV', kv: '13,8 kV', kind: 'bus', adjacent: true,
        paths: [[150, 62, 150, 100], [70, 100, 450, 100], [300, 100, 300, 125]], lp: [164, 88], bp: [340, 84] },
      T1: { label: 'Trecho 89-3/52-3', kv: '13,8 kV', paths: [[300, 175, 300, 215]], lp: [314, 200], bp: [204, 200] },
      MT3: { label: 'Terminais MT do TR-03', kv: '13,8 kV', paths: [[300, 265, 300, 318]], lp: [96, 290], bp: [96, 310], gp: [300, 290], gd: 'r' },
      BT3: { label: 'Secundário do TR-03', kv: '480 V', paths: [[300, 364, 300, 400]], lp: [314, 386], bp: [180, 386] },
      CCMA: { label: 'CCM-A 480 V', kv: '480 V', kind: 'bus', paths: [[300, 450, 300, 480], [180, 480, 490, 480]], lp: [186, 470], bp: [186, 500] },
      CCMB: { label: 'CCM-B 480 V', kv: '480 V', kind: 'bus', paths: [[540, 480, 820, 480], [720, 480, 720, 422]], lp: [736, 470], bp: [736, 500] }
    },
    links: [{ a: 'MT3', b: 'BT3', kind: 'trafo', x: 300, y: 341, label: 'TR-03 13,8 kV / 480 V' }],
    sources: [
      { id: 'REDE', label: 'Barra MT (rede)', short: 'Rede', node: 'BMT', x: 150, y: 40, kind: 'rede',
        lesson: 'Abra e bloqueie o lado de MT do TR-03 (52-3 e 89-3) e constate a ausência de tensão com detector TESTADO.', ref: REF.etapa1 },
      { id: 'TR4', label: 'retorno pelo CCM-B → acoplamento → secundário do TR-03', short: 'TR-04 (energizado)', node: 'CCMB', x: 720, y: 400, kind: 'trafo',
        lesson: 'Retorno pelo transformador: o CCM, alimentado pelo TR-04 via acoplamento, energizou o TR-03 de volta pelo secundário. Abra e bloqueie também o lado de BT (52-BT3) ou o acoplamento.', ref: REF.etapa1 }
    ],
    devices: {
      '89-3': { type: '89', label: 'Seccionadora 89-3', short: '89-3', a: 'BMT', b: 'T1', assoc: '52-3', x: 300, y: 150 },
      '52-3': { type: '52', label: 'Disjuntor 52-3', short: '52-3', a: 'T1', b: 'MT3', x: 300, y: 240 },
      '52-BT3': { type: '52', label: 'Disjuntor BT 52-BT3 (extraível)', short: '52-BT3', a: 'BT3', b: 'CCMA', x: 300, y: 425, visible: true },
      '52-TIE': { type: '52', label: 'Acoplamento 52-TIE (extraível)', short: 'TIE', a: 'CCMA', b: 'CCMB', x: 515, y: 480, o: 'h', visible: true }
    },
    zone: ['MT3'],
    requiredGrounds: ['MT3'],
    zoneRect: [232, 262, 150, 108],
    zoneLabel: [238, 278],
    decor: '<text x="190" y="520" class="dim">bombas de processo</text><text x="560" y="520" class="dim">TR-04 → CCM-B</text>',
    events: [
      { type: 'remoteClose', dev: '52-3', who: 'COS (comando remoto)', msg: '"Alarme de subtensão no CCM-A… vou fechar o 52-3 pelo supervisório."' },
      { type: 'touchAdjacent', node: 'BMT', who: 'Bruno (eletricista)', msg: 'Escuro na sala… Bruno se apoiou na lateral do cubículo, colado na barra MT!' }
    ],
    pressure: [
      { t: 30, who: 'Operador do CCM', msg: 'As bombas do CCM-A continuam rodando, hein! Não desliga elas não.' },
      { t: 100, who: 'Supervisor', msg: 'Esse detector é velho mas funciona. Usa ele e pronto.' }
    ],
    winMsg: 'Terminal reapertado. O TR-03 estava sendo alimentado de volta pelo secundário — e o detector estava morto. Você pegou as duas armadilhas.'
  });

  // ------------------------------------------------------------------ 5
  var l5 = cogenTopology(false);
  levels.push(Object.assign(l5, {
    id: 'l5', title: 'Devolução', tag: 'REENERGIZAÇÃO', time: 200, mode: 'reenergize',
    place: 'Usina Leste-Oeste · Subestação interna · 17h50',
    briefing: 'O isolador da Barra MT-B foi trocado. Agora é devolver a instalação: aterramentos, cadeados de 3 pessoas, sinalização, ' +
      'equipe na área — e o TG-01 precisa voltar em PARALELO com a rede. A produção quer tudo ligado AGORA.',
    objective: 'Reenergize a Barra MT-B pela rede e coloque o TG-01 em paralelo (52-E e 52-G fechados).',
    authMsg: '"Serviço na Barra MT-B encerrado. Autorizada a reenergização: rede pelo 89-E/52-E, depois sincronizar o TG-01 pelo 52-G." Você repete a ordem.',
    start: {
      locks: { '89-E': ['Você', 'Ana', 'Carlos'], '89-G': ['Você', 'Ana', 'Carlos'] },
      grounds: ['BUS', 'G1'],
      signed: true
    },
    goal: ['52-E', '52-G'],
    teamDeathMsg: 'Carlos ainda estava dentro do cubículo do TG reapertando a conexão do barramento. Ninguém fez a chamada nominal.',
    exitMsgs: [
      'Chamada nominal: Ana — fora ✓ · Bruno — fora ✓ · Carlos — "TÔ AQUI DENTRO! Só reapertando o barramento!"',
      'Carlos saiu. Uma chave de boca esquecida em cima da barra foi recolhida. Ana e Carlos retiraram seus cadeados. Todos fora ✓'
    ],
    pressure: [
      { t: 20, who: 'Gerente industrial', msg: 'Acabou? Religa logo que a moenda tá parada!' },
      { t: 70, who: 'Ana (eletricista)', msg: 'Já tô fora. O Carlos falou que ia só dar uma última olhada…' }
    ],
    winMsg: 'Barra energizada, TG-01 sincronizado e exportando. Ninguém ficou pra trás.'
  }));

  root.SEP.levels = levels;
  if (typeof module !== 'undefined' && module.exports) module.exports = levels;
})(typeof window !== 'undefined' ? window : globalThis);
