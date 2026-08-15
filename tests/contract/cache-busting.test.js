import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_VERSION } from '../../src/config/config.js';

test('contract/cache-busting - index.html contiene parámetros de versionado ?v= para favicon SVG, PNG y CSS', () => {
    const rootDir = process.cwd();
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    // 1. Favicon SVG
    assert.ok(
        indexHtml.includes(`href="/favicon.svg?v=${APP_VERSION}"`),
        `index.html debe versionar favicon.svg con ?v=${APP_VERSION}`
    );

    // 2. Apple Touch Icon / PNG
    assert.ok(
        indexHtml.includes(`href="/favicon.png?v=${APP_VERSION}"`) || indexHtml.includes(`href="/favicon.svg?v=${APP_VERSION}"`),
        `index.html debe versionar el icono touch con ?v=${APP_VERSION}`
    );

    // 3. Hoja de estilos CSS
    assert.ok(
        indexHtml.includes(`href="/css/styles.css?v=${APP_VERSION}"`),
        `index.html debe versionar styles.css con ?v=${APP_VERSION}`
    );
});

test('contract/cache-busting - 404.html contiene parámetro de versionado ?v= para favicon', () => {
    const rootDir = process.cwd();
    const notFoundPath = path.join(rootDir, '404.html');
    const notFoundHtml = fs.readFileSync(notFoundPath, 'utf8');

    assert.ok(
        notFoundHtml.includes(`href="/favicon.svg?v=${APP_VERSION}"`),
        `404.html debe versionar favicon.svg con ?v=${APP_VERSION}`
    );
});

test('contract/cache-busting - Ningún enlace a favicon o CSS en index.html debe quedar sin query string de versión', () => {
    const rootDir = process.cwd();
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Comprobar que no existen referencias directas 'href="/favicon.svg"' sin ?v=
    const unversionedFavicon = /href="\/favicon\.svg"/g.test(indexHtml);
    assert.equal(unversionedFavicon, false, 'No debe haber enlaces a /favicon.svg sin versión ?v=');

    const unversionedCss = /href="\/css\/styles\.css"/g.test(indexHtml);
    assert.equal(unversionedCss, false, 'No debe haber enlaces a /css/styles.css sin versión ?v=');
});
