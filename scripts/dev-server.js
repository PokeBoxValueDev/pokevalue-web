import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PORT = 3000;
const ROOT_DIR = process.cwd();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

// Recompilar componentes al inicio
execFileSync(process.execPath, [path.join(ROOT_DIR, 'scripts', 'build-components.js')], { stdio: 'inherit' });

// Observar cambios en src/components para recompilar componentes al vuelo
let isRebuilding = false;
fs.watch(path.join(ROOT_DIR, 'src', 'components'), { recursive: true }, () => {
    if (isRebuilding) return;
    isRebuilding = true;
    setTimeout(() => {
        try {
            console.log('🔄 Detectados cambios en componentes, recompilando...');
            execFileSync(process.execPath, [path.join(ROOT_DIR, 'scripts', 'build-components.js')]);
            console.log('⚡ Componentes actualizados.');
        } catch (e) {
            console.error('Error al recompilar componentes:', e);
        } finally {
            isRebuilding = false;
        }
    }, 150);
});

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath.startsWith('/es') || reqPath.startsWith('/en')) {
        reqPath = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, reqPath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(ROOT_DIR, '404.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 [PokeBoxValue Dev Server] ejecutándose en http://localhost:${PORT}`);
    console.log(`📡 Recarga en caliente activa para componentes y scripts.`);
});
