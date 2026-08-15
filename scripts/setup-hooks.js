import fs from 'node:fs';
import path from 'node:path';

const hooksDir = path.resolve('.git/hooks');
const prePushFile = path.join(hooksDir, 'pre-push');

const prePushScript = `#!/bin/sh
echo "🔍 [Git Pre-Push Hook] Verificando sintaxis de JavaScript y Suite de Pruebas..."

# Buscar binario de Node dinámicamente
NODE_BIN="node"
if [ -n "$HOME" ] && [ -f "$HOME/.lmstudio/.internal/utils/node" ]; then
    NODE_BIN="$HOME/.lmstudio/.internal/utils/node"
fi

# 1. Comprobación de sintaxis de JavaScript (Linting)
$NODE_BIN --check src/**/*.js tests/**/*.js scripts/*.js sw.js
LINT_STATUS=$?

if [ $LINT_STATUS -ne 0 ]; then
    echo ""
    echo "❌ ERROR DE SINTAXIS DETECTADO: El código contiene fallos de sintaxis en JavaScript."
    echo "🚫 GIT PUSH CANCELADO AUTOMÁTICAMENTE."
    echo ""
    exit 1
fi

# 2. Ejecución de la Suite Completa de Tests
$NODE_BIN --test tests/**/*.test.js
TEST_STATUS=$?

if [ $TEST_STATUS -ne 0 ]; then
    echo ""
    echo "❌ PRUEBAS FALLIDAS: Al menos un test en la suite ha fallado."
    echo "🚫 GIT PUSH CANCELADO AUTOMÁTICAMENTE."
    echo ""
    exit 1
fi

echo "✅ [Git Pre-Push Hook] Sintaxis impecable y 100% de los tests pasados en verde. Verificando versión y tags de GitHub..."

# 3. Autocreate tag local de versión si no existe
SKIP_TAG_PUSH=1 $NODE_BIN scripts/tag-release.js

echo "🚀 Procediendo a subir a GitHub..."
exit 0
`;

try {
    if (fs.existsSync(hooksDir)) {
        fs.writeFileSync(prePushFile, prePushScript, { mode: 0o755 });
        console.log('✅ Git pre-push hook instalado correctamente en .git/hooks/pre-push');
    }
} catch (err) {
    console.error('Error al instalar git pre-push hook:', err);
}
