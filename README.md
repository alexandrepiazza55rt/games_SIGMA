# Desenergiza ou Morre ⚡💀

Jogo web de treinamento para o **curso complementar NR-10 SEP**. O aluno é o executante da desenergização numa usina de etanol: manobra disjuntores e seccionadoras, bloqueia, mede, aterra, protege, sinaliza e libera a equipe. Se fizer errado, morre e o jogo explica o motivo, citando o slide do curso.

## Como jogar

Abra `index.html` no navegador (funciona direto do arquivo, sem servidor) ou publique a pasta em qualquer hospedagem estática, como o GitHub Pages. Roda no PC e no celular.

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

## Estrutura

- `js/engine.js`: simulação (grafo do unifilar, energização, regras, mortes e infrações). Não depende do DOM.
- `js/levels.js`: dados das fases (diagrama, fontes, eventos, pressão do rádio).
- `js/ui.js`: interface, diagrama SVG, minijogos (ordem dos grampos de aterramento e sincronoscópio), efeitos.
- `js/audio.js`: sons sintetizados com WebAudio, sem nenhum arquivo externo.
- `tests/engine.test.js`: testes do motor (`node --test tests/*.test.js`).

Para criar uma fase nova, adicione um objeto em `js/levels.js` e um teste com a solução limpa e as armadilhas.
