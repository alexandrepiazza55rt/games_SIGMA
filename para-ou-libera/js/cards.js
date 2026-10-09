/*
 * Cartas do "Para ou Libera". Gerado a partir do curso NR-10 SEP; cada carta cita o slide.
 * ans: "para" (condição impeditiva / risco) ou "libera" (condições atendidas).
 */
(function (root) {
  'use strict';
  var cards = [
    {
      "id": 1,
      "ans": "para",
      "scene": "🌩️🗼👷",
      "place": "Torre 27 · LT-01 · 15h10",
      "title": "Raio a caminho",
      "text": "Equipe no alto da torre trocando isoladores. O radar mostra tempestade com descargas a 8 km, vindo na direção da faixa.",
      "chips": [
        "🌩 descargas",
        "🗼 trabalho em altura"
      ],
      "q": "Continua o serviço?",
      "why": "Tempestade com descargas atmosféricas impede trabalho exposto e em altura. Interrompa diante da APROXIMAÇÃO — não espere o primeiro raio.",
      "ref": "Módulo 7 · Clima: chuva, tempestade e descargas (slide 109)"
    },
    {
      "id": 2,
      "ans": "para",
      "scene": "🌙🧍⚡",
      "place": "Sala elétrica 2 · 02h40",
      "title": "Só eu mesmo",
      "text": "Seu colega foi jantar. A manobra no cubículo de 13,8 kV é rápida, então você pensa em fazer sozinho pra adiantar.",
      "chips": [
        "👤 1 trabalhador",
        "⚡ MT"
      ],
      "q": "Libera a manobra?",
      "why": "Trabalho crítico em MT exige no mínimo DOIS trabalhadores: socorro imediato e conferência mútua. Trabalho isolado em situação de risco é condição impeditiva.",
      "ref": "Módulo 7 · Mínimo de dois trabalhadores (slide 108)"
    },
    {
      "id": 3,
      "ans": "para",
      "scene": "🧤⚡13,8",
      "place": "Subestação interna · 08h",
      "title": "Luva da classe errada",
      "text": "Manobra com bastão na rede de 13,8 kV. A luva disponível é classe 0 (até 1.000 V), novinha e com ensaio em dia.",
      "chips": [
        "🧤 classe 0",
        "⚡ 13,8 kV"
      ],
      "q": "Libera a manobra?",
      "why": "Classe 0 é para até 1.000 V. Para 13,8 kV a luva é classe 2 (até 17.000 V). A classe tem que ser compatível com a tensão.",
      "ref": "Módulo 5 · Luvas isolantes de borracha (slide 82)"
    },
    {
      "id": 4,
      "ans": "para",
      "scene": "🧤📅❌",
      "place": "Almoxarifado · 07h30",
      "title": "Ensaio vencido",
      "text": "Luva classe 2 certinha para a rede de 13,8 kV, sem furos. A etiqueta do ensaio dielétrico venceu há dois meses.",
      "chips": [
        "🧤 classe 2",
        "📅 ensaio vencido"
      ],
      "q": "Libera o uso?",
      "why": "Confira a validade do ensaio antes do uso. EPI com ensaio vencido é EPI fora de condição — sai de uso e é identificado.",
      "ref": "Módulo 5 · Inspeção visual antes do uso (slide 88)"
    },
    {
      "id": 5,
      "ans": "para",
      "scene": "🧤💨🕳️",
      "place": "Pátio da SE · 09h",
      "title": "Teste do sopro",
      "text": "Ao inflar a luva classe 2 para inspeção, você sente um fio de ar saindo perto do polegar.",
      "chips": [
        "🧤 vazamento"
      ],
      "q": "Libera o uso?",
      "why": "Luva que vaza ao inflar está furada: reprovada, retirada de uso imediatamente e identificada.",
      "ref": "Módulo 5 · Inspeção visual antes do uso (slide 88)"
    },
    {
      "id": 6,
      "ans": "para",
      "scene": "📋✍️❓",
      "place": "Casa de força · 10h",
      "title": "O supervisor assina depois",
      "text": "A PT está preenchida, mas sem a assinatura do emissor. \"Pode começar, ele assina quando voltar da reunião.\"",
      "chips": [
        "📋 PT sem assinatura"
      ],
      "q": "Libera o serviço?",
      "why": "Sem permissão de trabalho emitida e autorizada, não há serviço. Falta de autorização é condição impeditiva.",
      "ref": "Módulo 7 · Falta de procedimento, autorização ou comunicação (slide 113)"
    },
    {
      "id": 7,
      "ans": "para",
      "scene": "😴💊👷",
      "place": "Turno da noite · 04h",
      "title": "Olho pesado",
      "text": "Seu parceiro dobrou turno, está bocejando sem parar e tomou um antialérgico que dá sono.",
      "chips": [
        "😴 fadiga",
        "💊 medicamento"
      ],
      "q": "Libera o serviço?",
      "why": "Fadiga, sonolência e substâncias que afetam a capacidade reduzem atenção e reflexo: condição impeditiva.",
      "ref": "Módulo 7 · Estado físico e emocional do trabalhador (slide 111)"
    },
    {
      "id": 8,
      "ans": "para",
      "scene": "🍺👷⚡",
      "place": "Portaria da usina · 07h",
      "title": "Ressaca do churrasco",
      "text": "O eletricista escalado chegou com cheiro forte de álcool. Diz que está \"100%\".",
      "chips": [
        "🍺 álcool"
      ],
      "q": "Libera o serviço?",
      "why": "Uso de substâncias que afetem a capacidade é impeditivo. A autoavaliação dele não substitui a sua.",
      "ref": "Módulo 7 · Estado físico e emocional do trabalhador (slide 111)"
    },
    {
      "id": 9,
      "ans": "para",
      "scene": "🌫️🌫️⚡",
      "place": "Pátio da SE · 05h50",
      "title": "Neblina de manhã",
      "text": "Neblina densa no pátio. Do ponto de manobra mal se distingue qual barramento é qual.",
      "chips": [
        "🌫 baixa visibilidade"
      ],
      "q": "Libera a manobra?",
      "why": "Baixa visibilidade impede identificar partes energizadas e riscos. Neblina densa também reduz a isolação.",
      "ref": "Módulo 7 · Visibilidade e iluminação (slide 110)"
    },
    {
      "id": 10,
      "ans": "para",
      "scene": "📱🔦🌙",
      "place": "Cubículo de MT · 23h",
      "title": "Lanterninha do celular",
      "text": "A iluminação da sala queimou. A ideia é fazer o serviço com a lanterna do celular na boca.",
      "chips": [
        "🔦 iluminação ruim"
      ],
      "q": "Libera o serviço?",
      "why": "Iluminação insuficiente é condição impeditiva. Trabalho noturno exige iluminação adequada e planejada.",
      "ref": "Módulo 7 · Visibilidade e iluminação (slide 110)"
    },
    {
      "id": 11,
      "ans": "para",
      "scene": "📻〰️❓",
      "place": "Pátio da SE · 14h",
      "title": "Rádio picotando",
      "text": "O rádio com o COS está cortando. Você entendeu \"abrir o 52-…\" e o resto sumiu.",
      "chips": [
        "📻 comunicação falha"
      ],
      "q": "Executa a manobra?",
      "why": "Sem comunicação confiável, manobras e liberações ficam inseguras. Identificação inequívoca + repetir a ordem — ou não se manobra.",
      "ref": "Módulo 3 · Comunicação na liberação e devolução (slide 49)"
    },
    {
      "id": 12,
      "ans": "para",
      "scene": "🔦❔0V",
      "place": "Cubículo 52-3 · 16h",
      "title": "Ontem funcionou",
      "text": "O detector de tensão marcou ausência nas 3 fases. Ninguém testou o detector antes: \"ontem ele funcionou\".",
      "chips": [
        "🔦 detector não testado"
      ],
      "q": "Libera o aterramento?",
      "why": "O detector deve ser testado ANTES (e depois) da medição. Detector com defeito mostra 0 V numa barra viva.",
      "ref": "Módulo 4 · Etapa 3 — Constatação de ausência de tensão (slide 61)"
    },
    {
      "id": 13,
      "ans": "para",
      "scene": "🔥🧥12",
      "place": "Painel CCM-A · 11h",
      "title": "Roupa fraca pro painel",
      "text": "A etiqueta de arc flash do painel indica 12 cal/cm². A vestimenta disponível tem ATPV 8 cal/cm².",
      "chips": [
        "🧥 ATPV 8",
        "🔥 12 cal/cm²"
      ],
      "q": "Libera o serviço?",
      "why": "O ATPV da vestimenta deve ser MAIOR que a energia incidente do ponto. 8 < 12: a roupa não segura o arco.",
      "ref": "Módulo 5 · Vestimenta resistente ao arco (ATPV) (slide 81)"
    },
    {
      "id": 14,
      "ans": "para",
      "scene": "📋➕🔧",
      "place": "SE de entrada · 13h",
      "title": "Já que estamos aqui…",
      "text": "O serviço era trocar o isolador. O encarregado decide aproveitar e trocar também o TC ao lado, sem refazer a APR nem a PT.",
      "chips": [
        "📋 escopo mudou"
      ],
      "q": "Continua o serviço?",
      "why": "Mudou o escopo, a equipe ou a condição? Reavaliar antes de prosseguir, atualizar PT e procedimento e comunicar a todos.",
      "ref": "Módulo 3 · Gestão de mudanças no planejamento (slide 51)"
    },
    {
      "id": 15,
      "ans": "para",
      "scene": "⚡🏭💸",
      "place": "Moenda · 09h",
      "title": "Não pode parar a produção",
      "text": "Dá pra desligar o alimentador em 10 minutos, mas o gerente pede pra fazer energizado \"pra não parar a moenda\".",
      "chips": [
        "⚡ energizado",
        "💸 pressão"
      ],
      "q": "Libera o trabalho energizado?",
      "why": "Trabalho energizado só quando desenergizar for tecnicamente inviável ou trouxer maior risco. Parar a produção não é justificativa.",
      "ref": "Módulo 6 · Quando é admitido o trabalho energizado (slide 101)"
    },
    {
      "id": 16,
      "ans": "para",
      "scene": "🏗️⚡👀",
      "place": "Pátio de cargas · 10h",
      "title": "Munck sem olheiro",
      "text": "O munck vai descarregar um painel perto da rede de 13,8 kV. Não tem observador e a lança passa a uns 2 m dos cabos.",
      "chips": [
        "🏗 munck",
        "👀 sem observador"
      ],
      "q": "Libera o içamento?",
      "why": "Veículos respeitam a distância mínima considerando o ALCANCE da lança, com observador dedicado. Caso 4 do curso: guindaste e linha aérea.",
      "ref": "Módulo 9 · Distância de veículos a partes energizadas (slide 142)"
    },
    {
      "id": 17,
      "ans": "para",
      "scene": "🆕👷📜",
      "place": "Subestação · 08h",
      "title": "O novato",
      "text": "Contratado ontem, ótimo eletricista predial, só tem o NR-10 básico. Vai executar a desenergização da barra de MT.",
      "chips": [
        "📜 sem curso SEP"
      ],
      "q": "Libera o serviço?",
      "why": "Para o SEP é preciso o curso complementar e autorização. Trabalhador não habilitado ou não autorizado é condição impeditiva.",
      "ref": "Módulo 7 · Falta de procedimento, autorização ou comunicação (slide 113)"
    },
    {
      "id": 18,
      "ans": "para",
      "scene": "📐🧶⚠️",
      "place": "Painel antigo · 15h",
      "title": "Ninguém sabe o que é esse cabo",
      "text": "O unifilar é de 2009 e não bate com o painel. Tem uma emenda improvisada que ninguém sabe de onde vem.",
      "chips": [
        "📐 doc desatualizada",
        "🧶 improviso"
      ],
      "q": "Libera o serviço?",
      "why": "Instalação com improvisos e documentação técnica desatualizada: corrigir antes de prosseguir.",
      "ref": "Módulo 7 · Instalação sem condições (slide 114)"
    },
    {
      "id": 19,
      "ans": "para",
      "scene": "🌧️🧑‍🔧⚡",
      "place": "Rede 13,8 kV · 14h",
      "title": "Linha viva na chuva",
      "text": "Manutenção em linha viva programada pra hoje. Começou uma chuva forte, mas a equipe já está montada.",
      "chips": [
        "🌧 chuva",
        "⚡ linha viva"
      ],
      "q": "Libera o serviço?",
      "why": "Linha viva é cancelada diante de condições impeditivas: chuva reduz a isolação. Equipe montada não muda isso.",
      "ref": "Módulo 6 · Trabalho em linha viva (slide 100)"
    },
    {
      "id": 20,
      "ans": "para",
      "scene": "🪛🩹⚡",
      "place": "CCM · 10h",
      "title": "Isolada na fita",
      "text": "Não achou a chave isolada. Alguém enrolou fita isolante numa chave de fenda comum pra mexer perto da barra viva.",
      "chips": [
        "🪛 ferramenta improvisada"
      ],
      "q": "Libera o serviço?",
      "why": "Perto de partes vivas: ferramenta isolada certificada (IEC 60900) e íntegra. Improviso é fonte de acidente.",
      "ref": "Módulo 5 · Ferramentas isoladas e manuais (slide 85)"
    },
    {
      "id": 21,
      "ans": "para",
      "scene": "⏚🧵⚡",
      "place": "Barra MT-B · 09h",
      "title": "Aterramento de enfeite",
      "text": "O único conjunto de aterramento temporário disponível tem cabo fininho, bem abaixo da corrente de curto do ponto.",
      "chips": [
        "⏚ subdimensionado"
      ],
      "q": "Libera o serviço?",
      "why": "O conjunto deve ser dimensionado para a corrente de curto do ponto. Subdimensionado, ele funde e não protege ninguém.",
      "ref": "Módulo 4 · O conjunto de aterramento temporário (slide 63)"
    },
    {
      "id": 22,
      "ans": "para",
      "scene": "🌬️🏗️📦",
      "place": "Pátio da SE · 16h",
      "title": "Ventania no içamento",
      "text": "Içamento do transformador marcado pra hoje. Ventos fortes balançando o cabo do guindaste.",
      "chips": [
        "🌬 vento forte",
        "🏗 içamento"
      ],
      "q": "Libera o içamento?",
      "why": "Ventos fortes comprometem estruturas e içamentos: condição impeditiva.",
      "ref": "Módulo 7 · Clima: chuva, tempestade e descargas (slide 109)"
    },
    {
      "id": 23,
      "ans": "para",
      "scene": "📋📎📋",
      "place": "Escritório da manutenção · 07h",
      "title": "APR Ctrl+C Ctrl+V",
      "text": "A APR desse serviço foi copiada de um trabalho em outra subestação, com outra tensão e outra equipe.",
      "chips": [
        "📋 APR genérica"
      ],
      "q": "Libera o serviço?",
      "why": "A APR é específica para a tarefa, o local e a equipe — não é documento genérico.",
      "ref": "Módulo 3 · Análise Preliminar de Risco (APR) no SEP (slide 40)"
    },
    {
      "id": 24,
      "ans": "para",
      "scene": "🔒1️⃣👷👷👷👷",
      "place": "Barra MT-B · 08h",
      "title": "Um cadeado pra todos",
      "text": "Equipe de 4 pessoas. O bloqueio tem só o cadeado do encarregado: \"ele cuida da gente\".",
      "chips": [
        "🔒 1 cadeado",
        "👷 4 pessoas"
      ],
      "q": "Libera o serviço?",
      "why": "Cada trabalhador aplica o PRÓPRIO cadeado e etiqueta. A instalação só é liberada quando todos retiram os seus.",
      "ref": "Módulo 4 · Bloqueio e etiquetagem (LOTO) (slide 60)"
    },
    {
      "id": 25,
      "ans": "libera",
      "scene": "😤📞✅",
      "place": "Barra MT-B · 10h",
      "title": "O gerente está bravo",
      "text": "O gerente liga pela 3ª vez cobrando. PT assinada, LOTO aplicado, ausência de tensão constatada, barra aterrada e sinalizada.",
      "chips": [
        "✅ 6 etapas",
        "😤 pressão"
      ],
      "q": "Libera a equipe?",
      "why": "Pressão não é condição impeditiva — falta de segurança é. Com as seis etapas concluídas e a PT registrada, a zona está controlada.",
      "ref": "Módulo 4 · Liberação para o serviço (slide 66)"
    },
    {
      "id": 26,
      "ans": "libera",
      "scene": "🌙💡👷👷",
      "place": "Sala elétrica 2 · 22h",
      "title": "Turno da noite, do jeito certo",
      "text": "Serviço noturno planejado: torres de iluminação montadas, equipe descansada, sinalização reforçada, comunicação testada.",
      "chips": [
        "💡 iluminado",
        "👷 equipe descansada"
      ],
      "q": "Libera o serviço?",
      "why": "Trabalho noturno é possível com iluminação adequada, planejamento reforçado e equipe descansada.",
      "ref": "Módulo 8 · (i) Trabalhos noturnos (slide 133)"
    },
    {
      "id": 27,
      "ans": "libera",
      "scene": "🧤✅13,8",
      "place": "Subestação interna · 08h",
      "title": "Luva certa",
      "text": "Rede de 13,8 kV. Luva classe 2, ensaio dentro da validade, inflada sem vazamento, com luva de cobertura.",
      "chips": [
        "🧤 classe 2",
        "📅 ensaio ok"
      ],
      "q": "Libera o uso?",
      "why": "Classe 2 vai até 17.000 V: compatível com 13,8 kV. Inspecionada e ensaiada, está pronta.",
      "ref": "Módulo 5 · Luvas isolantes de borracha (slide 82)"
    },
    {
      "id": 28,
      "ans": "libera",
      "scene": "🔥🧥40",
      "place": "Painel CCM-B · 11h",
      "title": "Roupa de sobra",
      "text": "Etiqueta do painel: 25 cal/cm². Vestimenta ATPV 40 cal/cm², com balaclava, protetor facial e luvas compatíveis.",
      "chips": [
        "🧥 ATPV 40",
        "🔥 25 cal/cm²"
      ],
      "q": "Libera o serviço?",
      "why": "ATPV 40 > 25 cal/cm² e o conjunto completo: a vestimenta é adequada à energia incidente.",
      "ref": "Módulo 5 · Vestimenta resistente ao arco (ATPV) (slide 81)"
    },
    {
      "id": 29,
      "ans": "libera",
      "scene": "☀️🌤️✅",
      "place": "Pátio da SE · 08h",
      "title": "Choveu ontem",
      "text": "Choveu forte ontem à noite. Hoje céu limpo, equipamentos secos, previsão sem chuva nem vento.",
      "chips": [
        "☀️ tempo firme"
      ],
      "q": "Libera o serviço?",
      "why": "A condição impeditiva é a chuva, a umidade e a tempestade AGORA. Com o tempo firme e tudo seco, o serviço segue.",
      "ref": "Módulo 7 · Clima: chuva, tempestade e descargas (slide 109)"
    },
    {
      "id": 30,
      "ans": "libera",
      "scene": "〰️⏚⏚⏚",
      "place": "LT-01 · Torre 27 · 14h",
      "title": "Induzida domada",
      "text": "O detector acusa tensão induzida da LT-02. A LT-01 está aterrada nas duas extremidades e no ponto de trabalho, equipotencializada.",
      "chips": [
        "〰 induzida",
        "⏚ 3 aterramentos"
      ],
      "q": "Libera a subida?",
      "why": "É exatamente o controle da induzida: aterrar as duas extremidades E a zona de trabalho, equipotencializando o local.",
      "ref": "Módulo 8 · (c) Controle da tensão induzida (slide 126)"
    },
    {
      "id": 31,
      "ans": "libera",
      "scene": "🔦✅⏚",
      "place": "Cubículo 52-3 · 16h",
      "title": "Medição de respeito",
      "text": "Detector testado na fonte antes e depois. Ausência de tensão nas 3 fases. Aterramento temporário instalado.",
      "chips": [
        "🔦 detector testado",
        "⏚ aterrado"
      ],
      "q": "Libera o serviço?",
      "why": "Detector testado antes e depois, todas as fases conferidas e aterramento instalado: constatação feita do jeito certo.",
      "ref": "Módulo 4 · Etapa 3 — Constatação de ausência de tensão (slide 61)"
    },
    {
      "id": 32,
      "ans": "libera",
      "scene": "🏗️👀🚧",
      "place": "Pátio de cargas · 10h",
      "title": "Munck com escolta",
      "text": "Operador habilitado, observador dedicado, distância mínima respeitada considerando o alcance da lança, área isolada com cones.",
      "chips": [
        "👀 observador",
        "🚧 área isolada"
      ],
      "q": "Libera o içamento?",
      "why": "Distância pelo alcance máximo, observador dedicado, área sinalizada e operador habilitado: é o procedimento.",
      "ref": "Módulo 9 · Distância de veículos a partes energizadas (slide 142)"
    },
    {
      "id": 33,
      "ans": "libera",
      "scene": "🗣️📋👷👷🦺",
      "place": "Subestação · 07h15",
      "title": "DDS em dia",
      "text": "DDS feito, APR revisada com a equipe, dois eletricistas e o supervisor presentes, PT assinada.",
      "chips": [
        "🗣 DDS",
        "📋 PT ok"
      ],
      "q": "Libera o serviço?",
      "why": "DDS alinhando riscos, APR revisada, equipe mínima e PT emitida: condições atendidas.",
      "ref": "Módulo 3 · Diálogo Diário de Segurança (DDS) (slide 50)"
    },
    {
      "id": 34,
      "ans": "libera",
      "scene": "✋➡️🚧✅",
      "place": "Barra MT · 13h",
      "title": "Depois da recusa",
      "text": "Ana recusou a tarefa porque a barra vizinha estava sem proteção. O supervisor instalou manta isolante e barreira, e registrou.",
      "chips": [
        "✋ recusa tratada"
      ],
      "q": "Libera o serviço?",
      "why": "A recusa é ferramenta de segurança: o risco foi corrigido e registrado. Agora o serviço pode seguir.",
      "ref": "Módulo 7 · Direito de recusa (slide 115)"
    },
    {
      "id": 35,
      "ans": "libera",
      "scene": "📋🔄✅",
      "place": "SE de entrada · 13h",
      "title": "Mudou, reanalisou",
      "text": "Entrou a troca do TC no escopo. APR refeita, PT atualizada, nova manobra conferida e equipe comunicada.",
      "chips": [
        "📋 escopo novo",
        "🔄 reanálise"
      ],
      "q": "Continua o serviço?",
      "why": "Mudança tratada do jeito certo: reavaliar, atualizar PT e procedimento e comunicar a todos antes de prosseguir.",
      "ref": "Módulo 3 · Gestão de mudanças no planejamento (slide 51)"
    },
    {
      "id": 36,
      "ans": "libera",
      "scene": "🔒🔒🔒🔒",
      "place": "Barra MT-B · 08h",
      "title": "Quatro cadeados",
      "text": "Dispositivo de bloqueio múltiplo com 4 cadeados e etiquetas — um de cada integrante da equipe.",
      "chips": [
        "🔒 1 por pessoa"
      ],
      "q": "Libera o serviço?",
      "why": "Cada trabalhador com seu próprio cadeado no bloqueio múltiplo: LOTO como manda o figurino.",
      "ref": "Módulo 4 · Bloqueio e etiquetagem (LOTO) (slide 60)"
    },
    {
      "id": 37,
      "ans": "libera",
      "scene": "⚡🧑‍🔧🌤️📋",
      "place": "Rede 13,8 kV · 09h",
      "title": "Linha viva justificada",
      "text": "Desligar o hospital da cidade é inviável. Equipe certificada, procedimento aprovado, supervisão presente, tempo firme.",
      "chips": [
        "⚡ linha viva",
        "📋 justificada"
      ],
      "q": "Libera o serviço?",
      "why": "Energizado admitido: desenergização inviável, justificativa documentada, equipe habilitada, supervisão e clima favorável.",
      "ref": "Módulo 6 · Requisitos para trabalho energizado (slide 102)"
    },
    {
      "id": 38,
      "ans": "libera",
      "scene": "🪛✅🔌",
      "place": "CCM · 10h",
      "title": "Ferramenta de verdade",
      "text": "Ajuste perto de borne de 480 V energizado, com ferramentas isoladas IEC 60900 para 1.000 V, isolamento íntegro, APR prevendo.",
      "chips": [
        "🪛 IEC 60900"
      ],
      "q": "Libera o serviço?",
      "why": "Ferramentas isoladas para 1.000 V, íntegras e adequadas à tarefa, perto de partes vivas de BT: correto.",
      "ref": "Módulo 5 · Ferramentas isoladas e manuais (slide 85)"
    },
    {
      "id": 39,
      "ans": "libera",
      "scene": "📻🔁✅",
      "place": "Pátio da SE · 14h",
      "title": "Repita a ordem",
      "text": "COS: \"abrir o disjuntor 52-3 do TR-03\". Você repete, o COS confirma, o equipamento está identificado na placa.",
      "chips": [
        "📻 ordem confirmada"
      ],
      "q": "Executa a manobra?",
      "why": "Mensagem clara, repetida de volta e confirmada, com identificação inequívoca do equipamento.",
      "ref": "Módulo 3 · Comunicação na liberação e devolução (slide 49)"
    },
    {
      "id": 40,
      "ans": "libera",
      "scene": "🏭⚙️🔒⏚",
      "place": "Usina · Barra MT-B · 09h",
      "title": "Cogeração lembrada",
      "text": "Rede aberta e bloqueada, TG-01 da cogeração aberto e bloqueado, barra testada e aterrada.",
      "chips": [
        "⚙️ TG-01 isolado"
      ],
      "q": "Libera o serviço?",
      "why": "Todas as fontes seccionadas, inclusive a cogeração, bloqueio aplicado, ausência constatada e aterramento: zona controlada.",
      "ref": "Módulo 4 · Etapa 1 — Seccionamento (slide 58)"
    }
  ];
  root.PL = root.PL || {};
  root.PL.cards = cards;
  if (typeof module !== 'undefined' && module.exports) module.exports = cards;
})(typeof window !== 'undefined' ? window : globalThis);
