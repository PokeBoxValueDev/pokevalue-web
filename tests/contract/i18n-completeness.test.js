import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import es from '../../src/i18n/locales/es.js';
import en from '../../src/i18n/locales/en.js';
import { updateDOMTranslations, setLanguage } from '../../src/i18n/i18n.js';
import { JSDOM } from 'jsdom';

test('contract/i18n - Paridad total de claves entre es.js y en.js (0 claves faltantes)', () => {
    const esKeys = Object.keys(es);
    const enKeys = Object.keys(en);

    const missingInEn = esKeys.filter(k => !enKeys.includes(k));
    const missingInEs = enKeys.filter(k => !esKeys.includes(k));

    assert.deepStrictEqual(missingInEn, [], `Claves presentes en es.js pero ausentes en en.js: ${missingInEn.join(', ')}`);
    assert.deepStrictEqual(missingInEs, [], `Claves presentes en en.js pero ausentes en es.js: ${missingInEs.join(', ')}`);

    // Ninguna traducción debe ser un string vacío o undefined
    esKeys.forEach(k => {
        assert.ok(typeof es[k] === 'string' && es[k].trim().length > 0, `es.js['${k}'] no puede estar vacío`);
        assert.ok(typeof en[k] === 'string' && en[k].trim().length > 0, `en.js['${k}'] no puede estar vacío`);
    });
});

test('contract/i18n - Todos los atributos data-i18n y data-i18n-placeholder en plantillas HTML existen en el diccionario', () => {
    const rootDir = process.cwd();
    const filesToScan = [];

    function collectHtmlFiles(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
                collectHtmlFiles(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                filesToScan.push(fullPath);
            }
        }
    }

    collectHtmlFiles(path.join(rootDir, 'src'));
    const notFoundPath = path.join(rootDir, '404.html');
    if (fs.existsSync(notFoundPath)) filesToScan.push(notFoundPath);

    const esKeys = new Set(Object.keys(es));
    const missingKeys = [];

    filesToScan.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');

        // Buscar data-i18n="key"
        const i18nMatches = content.matchAll(/data-i18n="([^"]+)"/g);
        for (const match of i18nMatches) {
            const key = match[1];
            if (!esKeys.has(key)) {
                missingKeys.push({ file: path.relative(rootDir, filePath), key, type: 'data-i18n' });
            }
        }

        // Buscar data-i18n-placeholder="key"
        const placeholderMatches = content.matchAll(/data-i18n-placeholder="([^"]+)"/g);
        for (const match of placeholderMatches) {
            const key = match[1];
            if (!esKeys.has(key)) {
                missingKeys.push({ file: path.relative(rootDir, filePath), key, type: 'data-i18n-placeholder' });
            }
        }
    });

    assert.deepStrictEqual(missingKeys, [], `Se encontraron elementos HTML con claves i18n no definidas en los diccionarios: ${JSON.stringify(missingKeys, null, 2)}`);
});

test('contract/i18n - Invocaciones estáticas t(\'...\') en archivos JS existen en el diccionario', () => {
    const rootDir = process.cwd();
    const jsFiles = [];

    function collectJsFiles(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
                collectJsFiles(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.js') && !fullPath.includes('/i18n/locales/')) {
                jsFiles.push(fullPath);
            }
        }
    }

    collectJsFiles(path.join(rootDir, 'src'));

    const esKeys = new Set(Object.keys(es));
    const missingCalls = [];

    jsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        // Extraer llamadas literales t('...') o t("...")
        const tCalls = content.matchAll(/\bt\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g);
        for (const match of tCalls) {
            const key = match[1];
            if (!esKeys.has(key)) {
                missingCalls.push({ file: path.relative(rootDir, filePath), key });
            }
        }
    });

    assert.deepStrictEqual(missingCalls, [], `Llamadas a t(...) con claves no registradas en el diccionario: ${JSON.stringify(missingCalls, null, 2)}`);
});

test('contract/i18n - updateDOMTranslations actualiza correctamente textos en ES y EN', () => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>PokeBoxValue</title>
            <meta name="description" content="">
            <meta property="og:title" content="">
            <meta property="og:description" content="">
        </head>
        <body>
            <span id="test-elem" data-i18n="btnCalculate">Texto original</span>
            <input id="test-input" data-i18n-placeholder="searchPlaceholder" placeholder="original">
            <a class="kofitext"><span>☕</span> Apoyar proyecto</a>
        </body>
        </html>
    `);

    global.document = dom.window.document;
    global.window = dom.window;

    // 1. Probar en Español
    setLanguage('es');
    updateDOMTranslations();

    assert.strictEqual(document.getElementById('test-elem').innerHTML, es.btnCalculate);
    assert.strictEqual(document.getElementById('test-input').placeholder, es.searchPlaceholder);
    assert.strictEqual(document.title, es.metaTitle);

    // 2. Probar en Inglés
    setLanguage('en');
    updateDOMTranslations();

    assert.strictEqual(document.getElementById('test-elem').innerHTML, en.btnCalculate);
    assert.strictEqual(document.getElementById('test-input').placeholder, en.searchPlaceholder);
    assert.strictEqual(document.title, en.metaTitle);
});
