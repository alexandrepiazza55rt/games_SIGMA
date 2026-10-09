/*
 * Missões do "Zona Morta". Coordenadas em metros (y para cima, 0 = piso).
 *
 * aprox: o aluno arrasta o ponto mais avançado (mão ou ferramenta) até perto do condutor.
 * munck: o aluno opera a lança e leva a carga até a área-alvo, passando perto da rede.
 * emerg: a lança encostou na rede — decisão rápida.
 */
(function (root) {
  'use strict';

  var REF = {
    zonas: 'Módulo 6 · Zonas de risco, controlada e livre (slide 95)',
    raios: 'Módulo 6 · Raios das zonas — valores de referência (slide 96)',
    alcance: 'Módulo 8 · (a) Proximidade e contato com partes energizadas (slide 119)',
    veiculos: 'Módulo 9 · Distância de veículos a partes energizadas (slide 142)',
    munck: 'Módulo 9 · Guindastes, munck e plataformas (slide 143)',
    tocou: 'Módulo 9 · Se o veículo tocar a rede (slide 144)',
    area: 'Módulo 9 · Sinalização e isolamento de área móvel (slide 150)',
    caso4: 'Módulo 18 · Caso 4 — veículo e linha aérea (slide 271)'
  };

  // Itens do checklist antes de operar o munck. ok=false é armadilha.
  var PREP = [
    { id: 'obs', ok: true, label: '👀 Observador dedicado acompanhando a lança', why: 'Observador dedicado acompanha manobras próximas a redes.' },
    { id: 'patola', ok: true, label: '🦵 Patolas estendidas em base firme e nivelada', why: 'Estabilização correta (patolas) em base firme e nivelada.' },
    { id: 'area', ok: true, label: '🚧 Área isolada com cones e fita', why: 'Delimitar a área de operação de veículos e içamentos protege a equipe e terceiros.' },
    { id: 'apr', ok: true, label: '📋 Distância da rede conferida na APR considerando o alcance da lança', why: 'A distância considera o alcance máximo de lanças, caçambas e cargas.' },
    { id: 'alarme', ok: false, label: '🔕 Desligar o alarme de aproximação (ele apita à toa)', why: 'Limitadores de alcance e alarmes de aproximação existem para avisar antes do contato. Desligar é tirar a última barreira.' }
  ];

  var missions = [
    {
      type: 'aprox', kv: 13.8, authorized: true,
      title: 'Barramento do cubículo', place: 'Subestação interna · 13,8 kV',
      who: 'Você é eletricista autorizado (curso SEP), trabalhando em proximidade.',
      task: 'Arraste a MÃO do eletricista até o mais perto do barramento energizado que a regra permite.',
      hint: 'Autorizado pode entrar na zona controlada — nunca na zona de risco. Use a pessoa (1,75 m) como régua.',
      point: 'mão', tool: 0, cond: { x: 2.7, y: 1.7 }, start: { x: 0.9, y: 1.1 },
      reach: { x0: 0.6, x1: 4.6, y0: 0.5, y1: 2.6 }, view: { w: 5.2, h: 3.3 }, decor: 'cubiculo',
      ref: REF.raios
    },
    {
      type: 'aprox', kv: 13.8, authorized: false,
      title: 'O pintor terceirizado', place: 'Muro da subestação · rede de 13,8 kV',
      who: 'Você é pintor de uma empresa terceirizada. NÃO é autorizado em eletricidade.',
      task: 'Arraste a ponta do ROLO DE PINTURA (cabo extensível) até onde você pode chegar perto do condutor.',
      hint: 'A ferramenta conta como extensão do corpo. Não autorizado não entra na zona controlada.',
      point: 'rolo', tool: 1, cond: { x: 3.6, y: 3.0 }, start: { x: 1.1, y: 1.9 },
      reach: { x0: 0.7, x1: 5.4, y0: 1.0, y1: 3.8 }, view: { w: 6.2, h: 4.4 }, decor: 'poste',
      ref: REF.alcance
    },
    {
      type: 'munck', kv: 13.8,
      title: 'Munck sob a rede', place: 'Pátio da usina · rede de 13,8 kV a 7,5 m',
      who: 'Você opera o munck. A carga (painel de 1 t) precisa passar para o outro lado do muro.',
      task: 'Arraste para mover a ponta da lança. Leve a carga até a área verde e solte. A rede está no caminho.',
      hint: 'Toda a lança, o cabo e a carga contam na distância. Por cima ou por baixo da rede?',
      cond: { x: 9, y: 7.5 }, pivot: { x: 4.4, y: 2.6 }, start: { x: 3, y: 4.6 },
      cable: 2.0, loadW: 1.2, loadH: 1.0, minLen: 2.5, maxLen: 13,
      wall: [11, 0, 11.6, 2.2], target: [13, 15.6], view: { w: 17, h: 12 },
      ref: REF.veiculos
    },
    {
      type: 'aprox', kv: 0.38, authorized: false,
      title: 'A lâmpada do quadro', place: 'Sala de bombas · quadro de BT 380 V aberto',
      who: 'Você é mecânico de manutenção. NÃO é autorizado em eletricidade.',
      task: 'O quadro de 380 V está aberto e energizado. Arraste a sua MÃO até onde pode chegar para trocar a lâmpada ao lado.',
      hint: 'Baixa tensão também tem zona controlada.',
      point: 'mão', tool: 0, cond: { x: 1.9, y: 1.5 }, start: { x: 0.4, y: 1.0 },
      reach: { x0: 0.2, x1: 2.9, y0: 0.4, y1: 2.2 }, view: { w: 3.3, h: 2.6 }, decor: 'quadro',
      ref: REF.raios
    },
    {
      type: 'aprox', kv: 34.5, authorized: true,
      title: 'No cesto aéreo', place: 'Rede de distribuição · 34,5 kV',
      who: 'Você é eletricista autorizado no cesto aéreo, preparando um serviço à distância.',
      task: 'Arraste a sua MÃO até o mais perto do condutor que a regra permite antes de usar a vara.',
      hint: 'Tensão maior, zona maior.',
      point: 'mão', tool: 0, cond: { x: 2.5, y: 1.9 }, start: { x: 0.7, y: 1.2 },
      reach: { x0: 0.4, x1: 4.2, y0: 0.6, y1: 2.6 }, view: { w: 4.6, h: 3.2 }, decor: 'poste',
      ref: REF.raios
    },
    {
      type: 'emerg', fire: false,
      title: 'A lança encostou', place: 'Pátio da usina · rede de 13,8 kV',
      scene: '🏗️⚡💥',
      text: 'Você opera o munck. Um vento empurrou a carga e a LANÇA ENCOSTOU na rede de 13,8 kV. O caminhão está energizado. Não há fogo.',
      options: [
        { t: 'Fico na cabine, peço pelo rádio para desligarem a rede e grito para todos se afastarem.', ok: true },
        { t: 'Desço da cabine normalmente e me afasto andando.', ok: false, why: 'Ao tocar o caminhão e o solo ao mesmo tempo, você vira o caminho da corrente para a terra.' },
        { t: 'Pulo da cabine e saio correndo com passos largos.', ok: false, why: 'O solo em volta está energizado: passos largos pegam diferença de potencial entre os pés (tensão de passo).' },
        { t: 'Peço para o ajudante no chão abrir a porta para eu descer.', ok: false, why: 'Quem toca o caminhão estando no chão leva o choque. Terceiros devem se AFASTAR.' }
      ],
      why: 'Sem fogo, o operador permanece na cabine, não toca veículo e solo ao mesmo tempo e afasta terceiros — o solo ao redor pode estar energizado.',
      ref: REF.tocou
    },
    {
      type: 'munck', kv: 230,
      title: 'Linha de 230 kV', place: 'Ampliação da SE · linha de 230 kV a 14 m',
      who: 'Você opera o guindaste. Um transformador precisa ser colocado na base atrás do muro.',
      task: 'Leve a carga até a área verde. A linha de 230 kV passa no meio do caminho.',
      hint: 'Em 230 kV a zona de risco tem 1,60 m de raio e a controlada 3,60 m.',
      cond: { x: 12, y: 14 }, pivot: { x: 4.4, y: 2.8 }, start: { x: 3, y: 5.2 },
      cable: 2.4, loadW: 1.8, loadH: 1.6, minLen: 3, maxLen: 18,
      wall: [16, 0, 16.7, 3.2], target: [19, 22.5], view: { w: 25, h: 18 },
      ref: REF.munck
    },
    {
      type: 'aprox', kv: 500, authorized: false,
      title: 'O topógrafo', place: 'Faixa de servidão · linha de 500 kV',
      who: 'Você é topógrafo. NÃO é autorizado em eletricidade. Carrega uma régua de mira de 4 m.',
      task: 'Arraste o TOPO DA RÉGUA de mira até onde você pode chegar perto do condutor de 500 kV.',
      hint: 'Em extra-alta tensão, as distâncias assustam.',
      point: 'régua', tool: 1, cond: { x: 11, y: 13 }, start: { x: 1.4, y: 3.2 },
      reach: { x0: 0.8, x1: 20.5, y0: 1.8, y1: 5.8 }, view: { w: 22, h: 16 }, decor: 'torre',
      ref: REF.raios
    },
    {
      type: 'emerg', fire: true,
      title: 'Fogo no caminhão', place: 'Pátio da usina · rede de 13,8 kV',
      scene: '🚛🔥⚡',
      text: 'A lança encostou na rede e o caminhão está energizado. Agora saiu FOGO do motor e a fumaça está entrando na cabine.',
      options: [
        { t: 'Salto da cabine com os pés juntos, sem tocar o caminhão e o chão ao mesmo tempo, e me afasto em pequenos saltos com os pés juntos.', ok: true },
        { t: 'Fico na cabine até a concessionária desligar a rede.', ok: false, why: 'Com fogo, permanecer na cabine é pior. Sair é imprescindível — mas saltando com os pés juntos.' },
        { t: 'Desço segurando na porta para não cair.', ok: false, why: 'Segurar no caminhão com o pé no chão fecha o circuito pelo seu corpo.' },
        { t: 'Pulo e corro em zigue-zague o mais rápido possível.', ok: false, why: 'Correr com passos largos sobre solo energizado expõe à tensão de passo.' }
      ],
      why: 'Sair do veículo só se for imprescindível (fogo), saltando com os pés juntos, sem tocar veículo e solo ao mesmo tempo, e se afastar sem abrir as pernas.',
      ref: REF.tocou
    }
  ];

  var api = { missions: missions, PREP: PREP, REF: REF };
  root.ZM = root.ZM || {};
  for (var k in api) root.ZM[k] = api[k];
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
