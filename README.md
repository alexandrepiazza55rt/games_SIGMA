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

## Estrutura

- `js/engine.js`: simulação (grafo do unifilar, energização, regras, mortes e infrações). Não depende do DOM.
- `js/levels.js`: dados das fases (diagrama, fontes, eventos, pressão do rádio).
- `js/ui.js`: interface, diagrama SVG, minijogos (ordem dos grampos de aterramento e sincronoscópio), efeitos.
- `js/audio.js`: sons sintetizados com WebAudio, sem nenhum arquivo externo.
- `tests/engine.test.js`: testes do motor (`node --test tests/*.test.js`).
- `para-ou-libera/`: jogo 2. `js/cards.js` traz as cartas, `js/core.js` as regras (testadas em `tests/para.test.js`) e `js/para.js` a interface.

Para criar uma fase nova, adicione um objeto em `js/levels.js` e um teste com a solução limpa e as armadilhas.
