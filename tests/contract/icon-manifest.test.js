import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_VERSION } from '../../src/config/config.js';

test('Icon y Manifest - Verificación de configuración y assets', (t) => {
    const rootDir = process.cwd();
    const faviconPath = path.join(rootDir, 'favicon.svg');
    const manifestPath = path.join(rootDir, 'manifest.json');
    const indexPath = path.join(rootDir, 'index.html');
    const notFoundPath = path.join(rootDir, '404.html');

    // 1. Verificar existencia de favicon.svg y contenido SVG válido
    assert.strictEqual(fs.existsSync(faviconPath), true, 'favicon.svg debe existir en la raíz');
    const faviconContent = fs.readFileSync(faviconPath, 'utf8');
    assert.match(faviconContent, /<svg[^>]+viewBox="0 0 512 512"/, 'favicon.svg debe tener un viewBox 512x512');
    assert.match(faviconContent, /<rect[^>]+width="512"[^>]+height="512"/, 'favicon.svg debe ser edge-to-edge (512x512 rect)');

    // 2. Verificar manifest.json y propósito maskable
    assert.strictEqual(fs.existsSync(manifestPath), true, 'manifest.json debe existir');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'manifest.json debe definir iconos');
    
    const svgIcon = manifest.icons.find(i => i.src === 'favicon.svg');
    assert.ok(svgIcon, 'manifest.json debe incluir favicon.svg');
    assert.strictEqual(svgIcon.purpose, 'any maskable', 'El icono SVG debe tener purpose "any maskable"');

    // 3. Cache-busting automático en index.html y 404.html
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexHtml.includes(`href="/favicon.svg?v=${APP_VERSION}"`), `index.html debe contener favicon versionado con ?v=${APP_VERSION}`);

    const notFoundHtml = fs.readFileSync(notFoundPath, 'utf8');
    assert.ok(notFoundHtml.includes(`href="/favicon.svg?v=${APP_VERSION}"`), `404.html debe contener favicon versionado con ?v=${APP_VERSION}`);
});

test('SemVer - Sincronización de versiones en config, package.json y sw.js', (t) => {
    const rootDir = process.cwd();
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    const swContent = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');

    // 1. Comparar APP_VERSION con package.json
    assert.strictEqual(APP_VERSION, pkg.version, 'src/config/config.js y package.json deben compartir la misma versión');

    // 2. Comparar APP_VERSION con CACHE_NAME en sw.js
    const swVersionMatch = swContent.match(/CACHE_NAME = 'pokeboxvalue-v([^']+)'/);
    assert.ok(swVersionMatch, 'sw.js debe contener la constante CACHE_NAME con versión');
    assert.strictEqual(swVersionMatch[1], APP_VERSION, `sw.js debe tener la versión v${APP_VERSION}`);
});
