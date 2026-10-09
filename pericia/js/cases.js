/*
 * Casos do "Perícia SEP" — um por caso real do Módulo 18. Cada cena tem a arte (SVG 900 x 560)
 * e os pontos clicáveis (items): err=true é erro a achar (kind: 'imediata' | 'basica');
 * err=false é algo que está correto e serve de falso positivo.
 */
(function (root) {
  'use strict';

  var REF = {
    causas: 'Módulo 18 · Causas imediatas e básicas (slide 267)',
    loto: 'Módulo 4 · Bloqueio e etiquetagem (LOTO) (slide 60)',
    etapa3: 'Módulo 4 · Etapa 3 — Constatação de ausência de tensão (slide 61)',
    etapa4: 'Módulo 4 · Etapa 4 — Aterramento temporário (slide 62)',
    kitAterr: 'Módulo 4 · O conjunto de aterramento temporário (slide 63)',
    pt: 'Módulo 3 · Permissão de Trabalho (PT) (slide 46)',
    apr: 'Módulo 3 · Análise Preliminar de Risco (APR) no SEP (slide 40)',
    proc: 'Módulo 3 · Procedimentos de trabalho (slide 44)',
    recicl: 'Encerramento · Reciclagem e melhoria contínua (slide 299)',
    luvas: 'Módulo 5 · Luvas isolantes de borracha (slide 82)',
    exposicao: 'Módulo 16 · Procedimentos que reduzem a exposição (slide 248)',
    sequencia: 'Módulo 17 · Sequência de operação (slide 254)',
    manut: 'Módulo 16 · Modo de manutenção e relés de arco (slide 245)',
    etiqueta: 'Módulo 16 · Etiquetagem de arc flash (slide 242)',
    vestArco: 'Módulo 16 · EPI e vestimenta contra arco (slide 247)',
    arco: 'Módulo 16 · Como o arco se forma (slide 238)',
    ordem: 'Módulo 17 · Ordem de manobra (slide 253)',
    inducao: 'Módulo 8 · (c) Controle da tensão induzida (slide 126)',
    clima: 'Módulo 7 · Clima: chuva, tempestade e descargas (slide 109)',
    veiculos: 'Módulo 9 · Distância de veículos a partes energizadas (slide 142)',
    munck: 'Módulo 9 · Guindastes, munck e plataformas (slide 143)',
    tocou: 'Módulo 9 · Se o veículo tocar a rede (slide 144)',
    area: 'Módulo 9 · Sinalização e isolamento de área móvel (slide 150)',
    habil: 'Módulo 9 · Condução e operadores habilitados (slide 151)'
  };

  // ---------------------------------------------------------------- peças de desenho

  function t(x, y, s, size, fill, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 12) + '" fill="' + (fill || '#e6edf3') + '"' + (extra || '') + '>' + s + '</text>';
  }
  function room() {
    return '<rect width="900" height="470" fill="#1a2230"/><rect y="470" width="900" height="90" fill="#10151c"/>' +
      '<line x1="0" y1="470" x2="900" y2="470" stroke="#3a4a5e" stroke-width="2"/>' +
      '<rect x="200" y="0" width="120" height="10" fill="#e8f0ff" opacity=".5"/><rect x="600" y="0" width="120" height="10" fill="#e8f0ff" opacity=".5"/>';
  }
  function sky() {
    return '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16243a"/><stop offset="1" stop-color="#2e4560"/></linearGradient></defs>' +
      '<rect width="900" height="470" fill="url(#sk)"/><rect y="470" width="900" height="90" fill="#2a2a1c"/>' +
      '<line x1="0" y1="470" x2="900" y2="470" stroke="#4a4a30" stroke-width="2"/>';
  }
  function extintor(x, y) {
    return '<rect x="' + (x - 13) + '" y="' + (y - 34) + '" width="26" height="58" rx="10" fill="#d33"/>' +
      '<rect x="' + (x - 5) + '" y="' + (y - 44) + '" width="10" height="12" fill="#222"/>' + t(x - 11, y + 2, 'CO₂', 10, '#fff', ' font-weight="800"');
  }
  function tapete(x0, x1) {
    return '<rect x="' + x0 + '" y="472" width="' + (x1 - x0) + '" height="18" rx="3" fill="#2b2b2b" stroke="#444"/>' +
      t((x0 + x1) / 2 - 42, 486, 'tapete isolante', 11, '#9aa');
  }
  function cubicle(x, label, open) {
    var s = '<rect x="' + x + '" y="120" width="120" height="350" fill="#2a3646" stroke="#4c5b6d" stroke-width="2"/>' +
      t(x + 42, 142, label, 14, '#e6edf3', ' font-weight="800"') +
      '<rect x="' + (x + 30) + '" y="160" width="60" height="40" fill="#0d131b" stroke="#4c5b6d"/>';
    if (open) {
      s += '<rect x="' + (x + 8) + '" y="215" width="104" height="245" fill="#0a0e14"/>' +
        '<line x1="' + (x + 25) + '" y1="235" x2="' + (x + 25) + '" y2="440" stroke="#c87533" stroke-width="5"/>' +
        '<line x1="' + (x + 60) + '" y1="235" x2="' + (x + 60) + '" y2="440" stroke="#c87533" stroke-width="5"/>' +
        '<line x1="' + (x + 95) + '" y1="235" x2="' + (x + 95) + '" y2="440" stroke="#c87533" stroke-width="5"/>' +
        '<polygon points="' + (x + 120) + ',215 ' + (x + 175) + ',230 ' + (x + 175) + ',450 ' + (x + 120) + ',462" fill="#33414f" stroke="#4c5b6d" stroke-width="2"/>';
    } else {
      s += '<rect x="' + (x + 95) + '" y="290" width="10" height="28" rx="3" fill="#8b98a8"/>';
    }
    return s;
  }
  function person(x, y, opts) {
    opts = opts || {};
    return '<g stroke="#e6edf3" stroke-width="4" stroke-linecap="round" fill="none">' +
      '<line x1="' + x + '" y1="' + (y - 40) + '" x2="' + x + '" y2="' + (y + 10) + '"/>' +
      '<line x1="' + x + '" y1="' + (y + 10) + '" x2="' + (x - 12) + '" y2="' + (y + 45) + '"/><line x1="' + x + '" y1="' + (y + 10) + '" x2="' + (x + 12) + '" y2="' + (y + 45) + '"/>' +
      '<line x1="' + x + '" y1="' + (y - 28) + '" x2="' + (opts.hx != null ? opts.hx : x - 18) + '" y2="' + (opts.hy != null ? opts.hy : y) + '"/>' +
      '<line x1="' + x + '" y1="' + (y - 28) + '" x2="' + (x + 18) + '" y2="' + y + '"/></g>' +
      '<circle cx="' + x + '" cy="' + (y - 54) + '" r="13" fill="#e8b48a"/>' +
      (opts.helmet !== false ? '<path d="M' + (x - 15) + ' ' + (y - 58) + ' Q' + x + ' ' + (y - 80) + ' ' + (x + 15) + ' ' + (y - 58) + ' Z" fill="#ffd400"/>' : '') +
      (opts.vest ? '<rect x="' + (x - 10) + '" y="' + (y - 38) + '" width="20" height="40" fill="#ff8a1f" opacity=".9"/>' : '');
  }
  function clipboard(x, y, lines, title) {
    var s = '<rect x="' + (x - 42) + '" y="' + (y - 52) + '" width="84" height="104" rx="6" fill="#8a5a2b"/>' +
      '<rect x="' + (x - 36) + '" y="' + (y - 42) + '" width="72" height="88" fill="#f4f1e8"/>' +
      '<rect x="' + (x - 14) + '" y="' + (y - 58) + '" width="28" height="12" rx="3" fill="#888"/>' +
      t(x - 32, y - 28, title, 9, '#111', ' font-weight="900" textLength="64" lengthAdjust="spacingAndGlyphs"');
    lines.forEach(function (l, i) { s += t(x - 32, y - 14 + i * 13, l[0], 8.5, l[1] || '#333'); });
    return s;
  }

  // ---------------------------------------------------------------- casos

  var cases = [
    {
      id: 'c1', title: 'Contato em MT', place: 'Sala elétrica 2 · cubículos de 13,8 kV',
      intro: 'Um eletricista sofreu lesão grave ao tocar o barramento do cubículo 52-3, que deveria estar desenergizado. Alguém religou o disjuntor durante o serviço.',
      real: 'Caso 1 do curso: a equipe iniciou sem constatar ausência de tensão e o bloqueio incompleto permitiu a reenergização. Raiz: procedimento não seguido e ausência de constatação.',
      caseRef: 'Módulo 18 · Caso 1 — contato em MT por falha de bloqueio (slide 268)',
      art: function () {
        return room() +
          // quadro de treinamento
          '<rect x="30" y="100" width="130" height="120" fill="#6b4f2a" stroke="#4a3418" stroke-width="4"/>' +
          '<rect x="42" y="112" width="106" height="96" fill="#fff"/>' + t(48, 130, 'RECICLAGEM SEP', 10, '#111', ' font-weight="900"') +
          t(48, 148, 'Equipe elétrica', 9, '#333') + t(48, 166, 'Válida até:', 9, '#333') + t(48, 186, '03/2024', 15, '#c00', ' font-weight="900"') +
          // mesa com POP
          '<rect x="120" y="318" width="150" height="10" fill="#5a4630"/><rect x="130" y="328" width="8" height="70" fill="#5a4630"/><rect x="252" y="328" width="8" height="70" fill="#5a4630"/>' +
          '<rect x="160" y="268" width="62" height="50" rx="3" fill="#2f5fb0"/>' + t(166, 288, 'POP-112', 11, '#fff', ' font-weight="800"') + t(166, 306, 'rev. 2009', 10, '#ffd400') +
          // cubículos
          cubicle(320, '52-1') + cubicle(450, '52-2') + cubicle(580, '52-3', true) +
          '<polygon points="380,160 365,186 395,186" fill="#ffd400"/>' + t(375, 183, '⚡', 12) + t(342, 212, 'PERIGO', 10, '#ffd400', ' font-weight="900"') +
          // etiqueta sem cadeado no 52-3
          '<rect x="640" y="296" width="12" height="26" rx="3" fill="#8b98a8"/><line x1="646" y1="322" x2="646" y2="334" stroke="#ccc"/>' +
          '<rect x="630" y="334" width="34" height="22" fill="#ffd400"/>' + t(632, 344, 'NÃO', 7, '#111', ' font-weight="900"') + t(632, 353, 'OPERE', 7, '#111', ' font-weight="900"') +
          // detector lacrado
          '<rect x="210" y="420" width="76" height="44" rx="6" fill="#ff8a1f"/><rect x="210" y="436" width="76" height="9" fill="#c00"/>' + t(216, 432, 'DETECTOR', 9, '#111', ' font-weight="800"') + t(224, 459, 'LACRADO', 8, '#fff', ' font-weight="800"') +
          // aterramento enrolado
          '<circle cx="110" cy="440" r="26" fill="none" stroke="#c87533" stroke-width="5"/><circle cx="110" cy="440" r="16" fill="none" stroke="#c87533" stroke-width="5"/><circle cx="110" cy="440" r="6" fill="#c87533"/>' +
          t(78, 480, 'aterramento', 10, '#aab') +
          // luvas classe 0
          '<rect x="535" y="446" width="20" height="16" rx="6" fill="#d33a2c"/><rect x="558" y="446" width="20" height="16" rx="6" fill="#d33a2c"/>' + t(540, 458, '0', 9, '#fff', ' font-weight="900"') + t(563, 458, '0', 9, '#fff', ' font-weight="900"') + t(538, 440, 'luvas', 10, '#aab') +
          // capacete caído
          '<path d="M720 462 Q742 432 764 462 Z" fill="#ffd400"/>' +
          // PT e DEA
          clipboard(800, 205, [['Nº 0412'], ['Serviço: 52-3'], ['Executante: J. Souza'], ['Emissor: _______', '#c00'], ['Assinatura: ___', '#c00']], 'PERMISSÃO DE TRABALHO') +
          '<rect x="770" y="300" width="60" height="56" rx="6" fill="#1f9d55"/>' + t(785, 324, '♥', 18, '#fff') + t(784, 348, 'DEA', 12, '#fff', ' font-weight="900"') +
          extintor(855, 430) + tapete(320, 700);
      },
      items: [
        { id: 'tag', x: 648, y: 330, r: 34, err: true, kind: 'imediata', label: 'Só etiqueta, sem cadeado, no 52-3',
          why: 'A etiqueta avisa, mas só o cadeado impede fisicamente o religamento. Foi a condição insegura que permitiu a reenergização.', ref: REF.loto },
        { id: 'detector', x: 248, y: 442, r: 40, err: true, kind: 'imediata', label: 'Detector de tensão ainda lacrado na maleta',
          why: 'Ninguém constatou a ausência de tensão: o detector nem saiu da maleta. Foi o ato inseguro imediatamente antes do contato.', ref: REF.etapa3 },
        { id: 'aterr', x: 110, y: 440, r: 38, err: true, kind: 'imediata', label: 'Aterramento temporário enrolado no canto',
          why: 'Sem aterramento na zona, a reenergização encontrou o corpo do eletricista em vez de um curto para a terra.', ref: REF.etapa4 },
        { id: 'luvas', x: 556, y: 454, r: 30, err: true, kind: 'imediata', label: 'Luvas classe 0 num cubículo de 13,8 kV',
          why: 'Classe 0 vai até 1.000 V. Para 13,8 kV a luva é classe 2: EPI inadequado no momento do contato.', ref: REF.luvas },
        { id: 'pt', x: 800, y: 205, r: 48, err: true, kind: 'basica', label: 'PT sem emissor e sem assinatura',
          why: 'O serviço começou sem a permissão de trabalho emitida. O sistema de liberação existe, mas não foi cumprido — falha de gestão, raiz do evento.', ref: REF.pt },
        { id: 'pop', x: 191, y: 293, r: 36, err: true, kind: 'basica', label: 'Procedimento POP-112 de 2009',
          why: 'Procedimento desatualizado, sem as etapas de constatação e bloqueio individual. Procedimento deficiente é causa básica: explica por que a equipe agiu errado.', ref: REF.proc },
        { id: 'recicl', x: 95, y: 160, r: 52, err: true, kind: 'basica', label: 'Reciclagem SEP vencida em 03/2024',
          why: 'A reciclagem é bienal. Equipe com treinamento vencido é falha organizacional — está por trás dos atos inseguros.', ref: REF.recicl },
        { id: 'placa', x: 380, y: 192, r: 30, err: false, label: 'Placa de perigo no cubículo', why: 'Sinalização de alta tensão no lugar — está correta.' },
        { id: 'dea', x: 800, y: 328, r: 34, err: false, label: 'DEA na parede', why: 'DEA sinalizado e acessível — está correto.' },
        { id: 'ext', x: 855, y: 420, r: 32, err: false, label: 'Extintor de CO₂', why: 'Extintor de CO₂ no lugar — está correto para sala elétrica.' },
        { id: 'tapete', x: 470, y: 482, r: 26, err: false, label: 'Tapete isolante', why: 'Tapete isolante na frente dos cubículos — está correto.' }
      ]
    },
    {
      id: 'c2', title: 'Arco no cubículo', place: 'Subestação interna · cubículo de MT',
      intro: 'Durante uma manobra, um arco interno queimou gravemente o operador e destruiu o cubículo. A porta estava aberta.',
      real: 'Caso 2 do curso: manobra inadequada em painel sob condição imprópria; a falta do modo de manutenção e de EPI adequado agravou o evento. Raiz: procedimento de manobra e proteção contra arco deficientes.',
      caseRef: 'Módulo 18 · Caso 2 — arco em manobra de cubículo (slide 269)',
      art: function () {
        return room() +
          '<defs><radialGradient id="soot" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#000" stop-opacity=".95"/><stop offset=".6" stop-color="#1a1008" stop-opacity=".7"/><stop offset="1" stop-color="#1a1008" stop-opacity="0"/></radialGradient></defs>' +
          // luminária de emergência
          '<rect x="80" y="64" width="80" height="26" rx="4" fill="#f4f1e8"/>' + t(86, 82, 'EMERGÊNCIA', 10, '#1f9d55', ' font-weight="900"') +
          // goteira
          '<rect x="460" y="20" width="120" height="16" fill="#5d6878"/><circle cx="520" cy="52" r="4" fill="#5ab0ff"/><circle cx="522" cy="72" r="4" fill="#5ab0ff"/><circle cx="519" cy="94" r="4" fill="#5ab0ff"/>' +
          '<ellipse cx="520" cy="110" rx="22" ry="5" fill="#2f5f8f" opacity=".7"/>' +
          // cubículo grande
          '<rect x="300" y="100" width="280" height="370" fill="#2a3646" stroke="#4c5b6d" stroke-width="2"/>' +
          '<rect x="300" y="100" width="280" height="370" fill="url(#soot)"/>' +
          // mímico
          '<rect x="340" y="118" width="200" height="64" fill="#0d131b" stroke="#4c5b6d"/>' +
          '<line x1="360" y1="150" x2="390" y2="150" stroke="#8b98a8" stroke-width="3"/><line x1="390" y1="150" x2="405" y2="136" stroke="#ffd400" stroke-width="3"/>' + t(380, 175, '89 ?', 10, '#ffd400') +
          '<line x1="420" y1="150" x2="450" y2="150" stroke="#8b98a8" stroke-width="3"/><rect x="450" y="138" width="24" height="24" fill="#e5484d"/>' + t(480, 155, 'FECHADO', 10, '#ff8b85', ' font-weight="800"') +
          // etiqueta de arc flash desbotada
          '<rect x="410" y="312" width="80" height="44" fill="#d9b48a" opacity=".8"/><rect x="410" y="312" width="80" height="12" fill="#c98a4a"/>' + t(414, 321, 'ARC FLASH', 8, '#333', ' font-weight="900"') + t(414, 338, 'Estudo:', 8, '#333') + t(414, 351, '2012', 11, '#a00', ' font-weight="900"') +
          // porta aberta
          '<polygon points="580,110 690,135 690,445 580,462" fill="#33414f" stroke="#4c5b6d" stroke-width="2"/>' + t(608, 300, 'ABERTA', 13, '#ff8b85', ' font-weight="900"') +
          // relé
          '<rect x="720" y="110" width="110" height="160" fill="#2a3646" stroke="#4c5b6d" stroke-width="2"/>' + t(748, 130, 'RELÉ 50/51', 10, '#e6edf3', ' font-weight="800"') +
          '<rect x="732" y="140" width="86" height="46" fill="#071a10"/>' + t(738, 158, 'MODO MANUT.', 9, '#8fe3b4', ' font-family="monospace"') + t(738, 176, 'DESATIVADO', 10, '#ff5a50', ' font-family="monospace" font-weight="900"') +
          // ordem de manobra
          clipboard(130, 250, [['Nº: —', '#c00'], ['Equipamento: —', '#c00'], ['Sequência:', '#333'], ['(em branco)', '#c00']], 'ORDEM DE MANOBRA') +
          // camisa queimada
          '<path d="M160 430 L185 418 L215 418 L240 430 L232 446 L222 442 L222 468 L178 468 L178 442 L168 446 Z" fill="#5fb3e6"/>' +
          '<circle cx="200" cy="440" r="9" fill="#111"/><circle cx="212" cy="455" r="6" fill="#111"/>' + t(170, 486, 'camisa de algodão', 10, '#aab') +
          extintor(845, 430) + tapete(300, 580);
      },
      items: [
        { id: 'porta', x: 640, y: 290, r: 46, err: true, kind: 'imediata', label: 'Manobra com a porta do cubículo aberta',
          why: 'Operar com o painel aberto coloca o operador de frente para o arco. O seguro é operar com painel fechado ou manobra remota.', ref: REF.exposicao },
        { id: 'mimico', x: 440, y: 150, r: 42, err: true, kind: 'imediata', label: 'Seccionadora 89 aberta com o disjuntor 52 FECHADO',
          why: 'A seccionadora foi manobrada sob carga, com o disjuntor fechado. Foi o ato que abriu o arco: primeiro o disjuntor, depois a seccionadora.', ref: REF.sequencia },
        { id: 'goteira', x: 520, y: 70, r: 36, err: true, kind: 'imediata', label: 'Goteira pingando dentro do cubículo',
          why: 'Umidade e contaminação dentro do painel ajudam a formar e sustentar o arco. Condição insegura presente na hora da manobra.', ref: REF.arco },
        { id: 'camisa', x: 200, y: 444, r: 38, err: true, kind: 'imediata', label: 'Operador de camisa de algodão comum',
          why: 'Sem vestimenta com ATPV adequado, o arco virou queimadura grave. EPI inadequado no momento do evento.', ref: REF.vestArco },
        { id: 'rele', x: 775, y: 165, r: 44, err: true, kind: 'basica', label: 'Modo de manutenção desativado no relé',
          why: 'O procedimento de manobra não previa ativar o modo de manutenção, que reduz o tempo de atuação e a energia do arco. Proteção contra arco deficiente é causa básica.', ref: REF.manut },
        { id: 'etiq', x: 450, y: 334, r: 34, err: true, kind: 'basica', label: 'Etiqueta de arc flash de um estudo de 2012',
          why: 'O estudo de energia incidente não foi revisado após mudanças na instalação. Sem dado atualizado, o EPI é escolhido errado — falha organizacional.', ref: REF.etiqueta },
        { id: 'ordem', x: 130, y: 250, r: 48, err: true, kind: 'basica', label: 'Ordem de manobra em branco',
          why: 'Sem ordem de manobra escrita e conferida, a sequência foi improvisada. Procedimento de manobra deficiente é a raiz do caso.', ref: REF.ordem },
        { id: 'luz', x: 120, y: 77, r: 30, err: false, label: 'Luminária de emergência', why: 'Iluminação de emergência funcionando — está correta.' },
        { id: 'ext', x: 845, y: 420, r: 32, err: false, label: 'Extintor de CO₂', why: 'Extintor de CO₂ no lugar — está correto.' },
        { id: 'tapete', x: 360, y: 482, r: 24, err: false, label: 'Tapete isolante', why: 'Tapete isolante na frente do cubículo — está correto.' }
      ]
    },
    {
      id: 'c3', title: 'Linha fantasma', place: 'LT-01 69 kV · Torre 27',
      intro: 'Um eletricista levou choque ao segurar o condutor da LT-01, que estava desligada nas duas pontas. A LT-02, na mesma faixa, continuava energizada.',
      real: 'Caso 3 do curso: a linha paralela energizada induziu tensão no trecho desligado e a ausência de aterramento na zona de trabalho expôs a equipe. Raiz: indução não considerada e aterramento insuficiente.',
      caseRef: 'Módulo 18 · Caso 3 — tensão induzida em linha desligada (slide 270)',
      art: function () {
        return sky() +
          // tempestade
          '<ellipse cx="770" cy="50" rx="90" ry="34" fill="#3a4250"/><ellipse cx="840" cy="70" rx="70" ry="30" fill="#2e3440"/><ellipse cx="700" cy="72" rx="60" ry="26" fill="#2e3440"/>' +
          '<polyline points="790,96 774,128 792,128 770,170" fill="none" stroke="#ffe66d" stroke-width="4"/>' +
          // linhas
          '<line x1="0" y1="110" x2="900" y2="110" stroke="#ff3b30" stroke-width="3" opacity=".9"/>' + t(10, 102, 'LT-02 69 kV', 11, '#ff8b85', ' font-weight="800"') +
          '<line x1="0" y1="190" x2="900" y2="190" stroke="#aab4c0" stroke-width="3"/>' + t(10, 182, 'LT-01 (desligada)', 11, '#c4cfdb', ' font-weight="800"') +
          // aterramento só na ponta da SE
          '<line x1="40" y1="190" x2="40" y2="230" stroke="#2ecc71" stroke-width="3"/><line x1="28" y1="230" x2="52" y2="230" stroke="#2ecc71" stroke-width="3"/><line x1="33" y1="236" x2="47" y2="236" stroke="#2ecc71" stroke-width="3"/>' +
          t(10, 252, 'aterrado na SE', 9, '#8fe3b4') +
          // torre
          '<g stroke="#5d6b7c" stroke-width="4" fill="none"><line x1="395" y1="470" x2="432" y2="95"/><line x1="505" y1="470" x2="468" y2="95"/>' +
          '<line x1="410" y1="330" x2="490" y2="330"/><line x1="420" y1="230" x2="480" y2="230"/><line x1="402" y1="400" x2="498" y2="400"/>' +
          '<line x1="402" y1="400" x2="480" y2="230"/><line x1="498" y1="400" x2="420" y2="230"/><line x1="360" y1="190" x2="540" y2="190" stroke-width="5"/><line x1="380" y1="110" x2="520" y2="110" stroke-width="5"/></g>' +
          // eletricista na torre, mão nua no condutor
          person(470, 250, { hx: 500, hy: 196 }) +
          '<circle cx="502" cy="194" r="6" fill="#e8b48a" stroke="#fff" stroke-width="1"/>' +
          '<line x1="460" y1="244" x2="438" y2="232" stroke="#ff8a1f" stroke-width="3"/>' +
          // placa LT-02 energizada
          '<rect x="660" y="300" width="8" height="170" fill="#5d6b7c"/><rect x="610" y="290" width="110" height="48" fill="#ffd400"/>' + t(616, 309, '⚠ LT-02', 12, '#111', ' font-weight="900"') + t(616, 328, 'ENERGIZADA', 12, '#111', ' font-weight="900"') +
          // caminhão
          '<rect x="80" y="390" width="200" height="56" fill="#e6edf3"/><rect x="40" y="370" width="60" height="76" rx="6" fill="#e6edf3"/><circle cx="80" cy="452" r="18" fill="#111"/><circle cx="240" cy="452" r="18" fill="#111"/>' +
          '<rect x="150" y="372" width="60" height="22" fill="#c87533"/>' + t(156, 388, '1 kit', 12, '#fff', ' font-weight="900"') +
          // APR
          clipboard(320, 410, [['Riscos:'], ['- queda'], ['- animais'], ['- calor'], ['Indução: —', '#c00']], 'APR TORRE 27') +
          // cones
          '<path d="M560 470 L572 438 L584 470 Z" fill="#ff8a1f"/><path d="M590 470 L602 438 L614 470 Z" fill="#ff8a1f"/>';
      },
      items: [
        { id: 'sematerr', x: 395, y: 190, r: 40, err: true, kind: 'imediata', label: 'Ponto de trabalho sem aterramento temporário',
          why: 'A LT-01 só estava aterrada na subestação. Sem aterramento no ponto de trabalho, a tensão induzida passou pelo corpo do eletricista.', ref: REF.inducao },
        { id: 'mao', x: 502, y: 198, r: 30, err: true, kind: 'imediata', label: 'Mão nua segurando o condutor',
          why: 'Segurou o condutor sem luva isolante, contando que "linha desligada não tem tensão". Foi o ato que fechou o circuito.', ref: REF.luvas },
        { id: 'tempestade', x: 780, y: 85, r: 56, err: true, kind: 'imediata', label: 'Tempestade com raios se aproximando',
          why: 'Tempestade com descargas é condição impeditiva para trabalho em altura e exposto — o serviço deveria ter parado.', ref: REF.clima },
        { id: 'apr', x: 320, y: 410, r: 46, err: true, kind: 'basica', label: 'APR sem a tensão induzida',
          why: 'A APR não considerou a LT-02 energizada na mesma faixa. Indução não considerada na análise é a raiz do caso.', ref: REF.apr },
        { id: 'kit', x: 180, y: 383, r: 34, err: true, kind: 'basica', label: 'Um único conjunto de aterramento no caminhão',
          why: 'A equipe saiu com um conjunto só: impossível aterrar as duas extremidades e o ponto de trabalho. Falha de planejamento — aterramento insuficiente.', ref: REF.kitAterr },
        { id: 'talabarte', x: 446, y: 238, r: 22, err: false, label: 'Talabarte ancorado na torre', why: 'Trava-quedas ancorado na estrutura — está correto.' },
        { id: 'placa', x: 665, y: 314, r: 40, err: false, label: 'Placa "LT-02 energizada"', why: 'A sinalização da linha energizada está correta — o problema foi não tratar a indução.' },
        { id: 'cones', x: 587, y: 456, r: 30, err: false, label: 'Cones de sinalização', why: 'Área sinalizada em volta da torre — está correto.' },
        { id: 'se', x: 40, y: 220, r: 28, err: false, label: 'Aterramento na ponta da SE', why: 'Aterrar a extremidade da SE está certo — faltou aterrar o ponto de trabalho.' }
      ]
    },
    {
      id: 'c4', title: 'Lança na rede', place: 'Pátio da usina · rede de 13,8 kV',
      intro: 'A lança de um munck encostou na rede de 13,8 kV durante a descarga de um painel. O ajudante que segurava o caminhão foi atingido.',
      real: 'Caso 4 do curso: o guindaste aproximou a lança de uma linha energizada, o contato energizou o equipamento e o entorno, com risco de tensão de passo. Raiz: distância de segurança e observador ausentes.',
      caseRef: 'Módulo 18 · Caso 4 — veículo e linha aérea (slide 271)',
      art: function () {
        return sky() +
          // terreno irregular
          '<path d="M0 470 L60 470 L90 458 L130 474 L170 456 L210 476 L260 462 L300 470 L900 470 L900 480 L0 480 Z" fill="#3a3a26"/>' +
          // poste e rede
          '<rect x="556" y="100" width="12" height="370" fill="#5d6b7c"/><rect x="520" y="112" width="90" height="8" fill="#5d6b7c"/>' +
          '<line x1="380" y1="132" x2="900" y2="132" stroke="#ff3b30" stroke-width="3"/>' + t(700, 124, 'Rede 13,8 kV', 11, '#ff8b85', ' font-weight="800"') +
          // caminhão inclinado (patolas recolhidas em terreno irregular)
          '<g transform="rotate(-2.5 320 452)">' +
          '<rect x="60" y="360" width="80" height="78" rx="6" fill="#ffd400"/><rect x="74" y="372" width="50" height="28" fill="#9cd2ff"/>' +
          '<rect x="140" y="400" width="220" height="40" fill="#2a3646"/><circle cx="100" cy="452" r="18" fill="#111"/><circle cx="230" cy="452" r="18" fill="#111"/><circle cx="320" cy="452" r="18" fill="#111"/>' +
          // patolas recolhidas
          '<rect x="150" y="436" width="40" height="10" fill="#8b98a8"/><rect x="300" y="436" width="40" height="10" fill="#8b98a8"/>' +
          // crachá do operador
          '<rect x="86" y="378" width="28" height="18" fill="#fff"/>' + t(88, 386, 'EM', 6, '#c00', ' font-weight="900"') + t(88, 394, 'TREIN.', 6, '#c00', ' font-weight="900"') +
          // lança tocando a rede
          '<line x1="300" y1="400" x2="300" y2="360" stroke="#ffd400" stroke-width="12"/><line x1="300" y1="360" x2="528" y2="138" stroke="#ffd400" stroke-width="10" stroke-linecap="round"/>' +
          '<circle cx="528" cy="136" r="10" fill="#fff" opacity=".9"/><circle cx="528" cy="136" r="18" fill="#ffe66d" opacity=".4"/>' +
          '<line x1="510" y1="150" x2="510" y2="230" stroke="#c4cfdb" stroke-width="2"/><rect x="490" y="230" width="40" height="30" fill="#4a5a70"/>' +
          // extintor no caminhão
          extintor(250, 418) + '</g>' +
          // ajudante encostado no caminhão
          person(395, 418, { hx: 362, hy: 410, vest: true }) +
          // colete de observador pendurado, cadeira vazia
          '<path d="M466 470 L476 440 L506 440 L516 470 M476 440 L476 420 L506 420 L506 440" stroke="#8b98a8" stroke-width="4" fill="none"/>' +
          '<rect x="474" y="398" width="36" height="22" fill="#ff8a1f"/>' + t(476, 413, 'OBSERV.', 7, '#111', ' font-weight="900"') +
          // pedestres sem área isolada
          person(700, 418, { helmet: false }) + person(740, 418, { helmet: false }) +
          // placa de velocidade
          '<rect x="836" y="320" width="6" height="150" fill="#5d6b7c"/><circle cx="839" cy="320" r="26" fill="#fff" stroke="#d33" stroke-width="6"/>' + t(826, 326, '20', 16, '#111', ' font-weight="900"');
      },
      items: [
        { id: 'lanca', x: 524, y: 140, r: 40, err: true, kind: 'imediata', label: 'Lança encostada na rede de 13,8 kV',
          why: 'A lança passou do alcance seguro e tocou a rede: contato direto que energizou o caminhão e o solo ao redor.', ref: REF.veiculos },
        { id: 'ajudante', x: 375, y: 408, r: 32, err: true, kind: 'imediata', label: 'Ajudante com a mão no caminhão',
          why: 'Com os pés no chão e a mão no caminhão energizado, o ajudante virou o caminho da corrente (tensão de toque).', ref: REF.tocou },
        { id: 'patola', x: 170, y: 456, r: 32, err: true, kind: 'imediata', label: 'Patolas recolhidas em terreno irregular',
          why: 'Sem patolas em base firme e nivelada, o munck balançou e a lança se moveu na direção da rede.', ref: REF.munck },
        { id: 'observador', x: 491, y: 432, r: 34, err: true, kind: 'basica', label: 'Colete do observador pendurado — sem observador',
          why: 'Não havia observador dedicado acompanhando a lança. Distância de segurança e observador ausentes são a raiz do Caso 4.', ref: REF.munck },
        { id: 'cracha', x: 100, y: 387, r: 26, err: true, kind: 'basica', label: 'Operador "em treinamento" no comando',
          why: 'Operação de munck só por profissional habilitado e autorizado. Escalar operador não habilitado é falha de gestão.', ref: REF.habil },
        { id: 'pedestres', x: 720, y: 405, r: 46, err: true, kind: 'basica', label: 'Pessoas circulando, área sem isolamento',
          why: 'A área de içamento não foi isolada nem sinalizada: terceiros dentro do raio da tensão de passo. Falha de planejamento.', ref: REF.area },
        { id: 'ext', x: 250, y: 410, r: 26, err: false, label: 'Extintor no caminhão', why: 'Extintor no veículo — está correto.' },
        { id: 'placa', x: 839, y: 320, r: 30, err: false, label: 'Placa de velocidade 20 km/h', why: 'Limite de velocidade no pátio — está correto.' },
        { id: 'carga', x: 510, y: 245, r: 26, err: false, label: 'Carga presa no cabo', why: 'A carga está bem presa ao cabo — não é o problema.' }
      ]
    }
  ];

  var api = { cases: cases, REF: REF };
  root.PS = root.PS || {};
  for (var k in api) root.PS[k] = api[k];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
