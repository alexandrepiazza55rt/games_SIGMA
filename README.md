# Desenergiza ou Morre ⚡💀

Jogo web de treinamento para o **curso complementar NR-10 SEP**. O aluno é o executante da desenergização numa usina de etanol: manobra disjuntores e seccionadoras, bloqueia, mede, aterra, protege, sinaliza e libera a equipe. Se fizer errado, morre e o jogo explica o motivo, citando o slide do curso.

## Como jogar

**Online:** https://alexandrepiazza55rt.github.io/games_SIGMA/ · QR para a turma: [`qr.html`](https://alexandrepiazza55rt.github.io/games_SIGMA/qr.html) (também no botão "📱 QR para a turma" do menu). A publicação é feita automaticamente pelo workflow `.github/workflows/pages.yml` a cada push.

Também dá para abrir `index.html` no navegador (funciona direto do arquivo, sem servidor) ou publicar a pasta em qualquer outra hospedagem estática. Roda no PC e no celular.

- O diagrama **não mostra** onde há tensão. O aluno precisa **medir**, e com detector testado.
- Ao **liberar a equipe**, o jogo dispara os eventos da fase (COS religando à distância, colega encostando na barra vizinha...).
- Errou? O **Raio-X** mostra de onde veio a energia.
- Infrações não matam, mas tiram pontos e aparecem no fim com a referência do slide.

## Fases

| # | Fase | O que ensina | Armadilha |
|---|------|--------------|-----------|
| 1 | Primeiro Turno (tutorial) | As 6 etapas da desenergização (Mód. 4) | Barra vizinha energizada; alimentador errado |
| 2 | Fonte Escondida | Cogeração como fonte adicional (Mód. 2 e 4) | TG-01 mantém a barra viva; operador tenta religar |
| 3 | Linha Fantasma | Tensão induzida e linha com duas pontas (Mód. 8 e Caso 3) | Aterrar só as extremidades mata |
| 4 | Retorno pelo Trafo | Retorno pelo secundário e teste do detector (Mód. 4) | Detector com defeito; COS fecha 52-3 à distância |
| 5 | Devolução | Reenergização na ordem inversa e sincronismo (Mód. 4 e 17) | Gente na zona, aterramento esquecido, paralelo fora de fase |

## Jogo 2: Para ou Libera ✋✅

**Online:** https://alexandrepiazza55rt.github.io/games_SIGMA/para-ou-libera/ (também linkado no menu do jogo 1).

O aluno recebe cartas com situações de campo e tem segundos para decidir se a situação é **condição impeditiva (PARA)** ou se o **serviço pode ser liberado (LIBERA)**. Dá para arrastar a carta, tocar nos botões ou usar ← e →.

- 40 cartas (24 PARA e 16 LIBERA) sobre clima, equipe, EPI/EPC, PT/APR, comunicação, veículos, trabalho energizado e LOTO, cada uma com o slide de referência.
- São 3 capacetes. Liberar o que devia parar causa um acidente e custa um capacete. Parar o que estava certo custa 5 s de turno.
- Acertos seguidos multiplicam os pontos até ×4, e o pavio de cada carta encurta conforme o jogo avança.
- No fim aparece a revisão de cada erro, com a explicação e o slide.

## Jogo 3: Zona Morta ☠️

**Online:** https://alexandrepiazza55rt.github.io/games_SIGMA/zona-morta/

As zonas de risco e controlada são **invisíveis**. O aluno só vê onde elas estavam depois de confirmar a posição. São 9 missões:

- **Aproximação** (13,8 kV, 380 V, 34,5 kV e 500 kV): o aluno arrasta a mão ou a ferramenta até o limite que a função dele permite. O autorizado pode entrar na zona controlada, nunca na de risco; o não autorizado fica na zona livre, e a ferramenta conta como corpo. Ao confirmar, as zonas aparecem na tela com a medida real.
- **Munck** (13,8 kV e 230 kV): começa com um checklist de preparação (observador, patolas, área isolada, APR e uma armadilha). Depois o aluno opera a lança em tempo real, e a lança, o cabo e a carga contam na distância. Passar por cima da rede de 13,8 kV obriga a lança a varrer a linha.
- **Emergência:** a lança encostou na rede, com e sem fogo, e o aluno tem 20 s para decidir (Caso 4 do curso).
- São 3 capacetes. No fim aparece a revisão de cada missão e a tabela de raios do slide 96.

## Jogo 4: Veste ou Queima 🧥🔥

**Online:** https://alexandrepiazza55rt.github.io/games_SIGMA/veste-ou-queima/

O aluno lê a **etiqueta de arc flash** do painel (energia incidente, tensão e fronteira de arco) e veste o eletricista no **armário de EPI**: vestimenta, cabeça e face, luvas, calçado, roupa íntima e extras. Depois vem o **teste do arco**, com explosão e mapa de queimaduras no corpo.

- São 8 tarefas: CCM 480 V, extração de disjuntor de 13,8 kV, pátio com tráfego, casa de força com ruído, linha viva de 34,5 kV em altura, painel de 40 cal/cm², painel de 62 cal/cm² e moagem de milho em área classificada.
- Regras: o ATPV precisa ser maior que a energia (slide 81), a classe da luva compatível com a tensão (slide 82), o protetor facial adequado à energia (slide 80), o calçado sem metal (slide 83) e a roupa íntima não sintética.
- **Hierarquia de controle:** quando dá, o jogo oferece medidas coletivas antes do EPI (modo de manutenção, extração remota, desenergizar), e elas dão bônus. Em 62 cal/cm² nenhum EPI resolve, e só desenergizar salva.
- Armadilhas: poliéster que derrete, bota com biqueira de aço, boné em vez de capacete e lanterna comum na poeira de milho.

## Jogo 5: Perícia SEP 🔍

**Online:** https://alexandrepiazza55rt.github.io/games_SIGMA/pericia/

São quatro cenas congeladas, uma para cada caso real do Módulo 18: contato em MT por falha de bloqueio, arco em manobra de cubículo, tensão induzida e munck na rede. O aluno toca nos erros da cena e classifica cada um como **causa imediata** (o ato ou a condição que disparou o evento) ou **causa básica** (a raiz: procedimento, gestão, treinamento, planejamento), conforme o slide 267.

- Cada caso tem de 5 a 7 erros e alguns itens corretos (extintor, DEA, placas). Apontar um item correto conta como falso positivo e desconta pontos.
- O aluno tem 2:30 por caso. Tocar no vazio custa 2 s, e a dica custa 100 pontos.
- Ao final de cada caso sai um laudo com nota de A a E, os erros que passaram, as classificações erradas e a conclusão do caso real.

## Estrutura

- `js/engine.js`: simulação (grafo do unifilar, energização, regras, mortes e infrações). Não depende do DOM.
- `js/levels.js`: dados das fases (diagrama, fontes, eventos, pressão do rádio).
- `js/ui.js`: interface, diagrama SVG, minijogos (ordem dos grampos de aterramento e sincronoscópio), efeitos.
- `js/audio.js`: sons sintetizados com WebAudio, sem nenhum arquivo externo.
- `tests/engine.test.js`: testes do motor (`node --test tests/*.test.js`).
- `pericia/`: jogo 5. `js/cases.js` traz as cenas (arte SVG e pontos clicáveis), `js/core.js` as regras da investigação (testadas em `tests/pericia.test.js`, inclusive a garantia de que nenhum ponto se sobrepõe a outro) e `js/pericia.js` a interface.
- `veste-ou-queima/`: jogo 4. `js/kit.js` traz o armário, as tarefas e a avaliação do teste do arco (testados em `tests/veste.test.js`, com uma solução perfeita por tarefa) e `js/veste.js` a interface.
- `zona-morta/`: jogo 3. `js/geo.js` traz a tabela de raios, a pontuação e a geometria do munck (testados em `tests/zona.test.js`, incluindo um teste que prova que cada missão tem solução), `js/missions.js` as missões e `js/zona.js` a interface.
- `para-ou-libera/`: jogo 2. `js/cards.js` traz as cartas, `js/core.js` as regras (testadas em `tests/para.test.js`) e `js/para.js` a interface.

Para criar uma fase nova, adicione um objeto em `js/levels.js` e um teste com a solução limpa e as armadilhas.
