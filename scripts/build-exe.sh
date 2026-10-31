#!/usr/bin/env bash
# Собирает открытку в один exe для Windows: dist/otkrytka.exe
set -euo pipefail
cd "$(dirname "$0")/.."

CI=false npx vite build

rm -rf launcher/site
cp -r build launcher/site
# офлайн-кэш PWA в exe не нужен: сайт всегда отдаётся самой программой
rm -f launcher/site/sw.js launcher/site/registerSW.js launcher/site/workbox-*.js \
  launcher/site/manifest.webmanifest
sed -i 's#<link rel="manifest" href="./manifest.webmanifest"><script id="vite-plugin-pwa:register-sw" src="./registerSW.js"></script>##' \
  launcher/site/index.html

cd launcher
go vet ./...
go test ./...
GOOS=windows GOARCH=amd64 go vet ./...
GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "-H windowsgui -s -w" \
  -o ../dist/otkrytka.exe .
echo "Готово: dist/otkrytka.exe"
