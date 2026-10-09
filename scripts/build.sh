#!/usr/bin/env bash
# Monta o site estático em _site/ (usado pelo GitHub Pages e pelo Cloudflare Pages).
# Roda os testes antes: se alguma regra de jogo quebrar, o deploy não acontece.
set -euo pipefail
cd "$(dirname "$0")/.."

node --test tests/*.test.js

rm -rf _site
mkdir -p _site
cp -r index.html qr.html css js img \
  desenergiza-ou-morre para-ou-libera zona-morta veste-ou-queima pericia \
  _site/
echo "Site montado em _site/ ($(find _site -type f | wc -l) arquivos)"
