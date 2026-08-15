import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function scanDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file === '.git' || file === 'node_modules' || file === 'dist' || file === '.gemini' || file === '.agents' || file === 'privacy-hygiene.test.js') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            scanDir(filePath, fileList);
        } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.md')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

test('contract/privacy-hygiene - Ningún archivo rastreado contiene rutas de usuario locales o rutas absolutas de sistema', () => {
    const rootDir = process.cwd();
    const allFiles = scanDir(rootDir);

    // Patrones genéricos de rutas absolutas de usuario en Mac, Linux y Windows
    const genericForbiddenPatterns = [
        /\/Users\/[a-zA-Z0-9_.-]+\//i,
        /\/home\/[a-zA-Z0-9_.-]+\//i,
        /C:\\Users\\[a-zA-Z0-9_.-]+\\/i
    ];

    // Detección dinámica en memoria del directorio home actual sin hardcodear datos
    const currentHome = os.homedir();

    for (const filePath of allFiles) {
        const relativePath = path.relative(rootDir, filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        // 1. Validar contra el home del sistema actual
        if (currentHome && currentHome.length > 5) {
            assert.equal(
                content.includes(currentHome),
                false,
                `Violación de privacidad: "${relativePath}" contiene la ruta del directorio home local.`
            );
        }

        // 2. Validar contra patrones genéricos de carpetas de usuario
        for (const pattern of genericForbiddenPatterns) {
            assert.equal(
                pattern.test(content),
                false,
                `Violación de privacidad: "${relativePath}" contiene una ruta absoluta de usuario (${pattern}).`
            );
        }
    }
});
