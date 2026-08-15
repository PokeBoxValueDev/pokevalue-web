#!/bin/bash
# Script ejecutor de pruebas autónomo para PokeBoxValue

# Buscar el ejecutable de Node disponible
NODE_BIN=""
if command -v node >/dev/null 2>&1; then
    NODE_BIN="node"
elif [ -f "$HOME/.lmstudio/.internal/utils/node" ]; then
    NODE_BIN="$HOME/.lmstudio/.internal/utils/node"
elif [ -f "/opt/homebrew/bin/node" ]; then
    NODE_BIN="/opt/homebrew/bin/node"
elif [ -f "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
fi

if [ -z "$NODE_BIN" ]; then
    echo "❌ No se encontró Node.js en el sistema."
    echo "💡 Puedes descargarlo e instalarlo gratis desde: https://nodejs.org"
    exit 1
fi

echo "🚀 Compilando componentes y empaquetando..."
"$NODE_BIN" scripts/bundle.js || exit 1

echo "🔍 Comprobando sintaxis..."
"$NODE_BIN" --check src/**/*.js tests/**/*.js sw.js scripts/*.js || exit 1

echo "🧪 Ejecutando suite completa de tests y auditoría Axe-Core..."
"$NODE_BIN" --test tests/**/*.test.js tests/**/**/*.test.js
