import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('SEO - Verificación de robots.txt y sitemap.xml', (t) => {
    const rootDir = process.cwd();
    const robotsPath = path.join(rootDir, 'robots.txt');
    const sitemapPath = path.join(rootDir, 'sitemap.xml');

    // 1. Verificar robots.txt
    assert.strictEqual(fs.existsSync(robotsPath), true, 'robots.txt debe existir en la raíz');
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    assert.match(robotsContent, /User-agent:\s*\*/i, 'robots.txt debe permitir User-agent: *');
    assert.match(robotsContent, /Allow:\s*\//i, 'robots.txt debe declarar Allow: /');
    assert.match(robotsContent, /Sitemap:\s*https:\/\/pokeboxvalue\.com\/sitemap\.xml/i, 'robots.txt debe enlazar al sitemap');

    // 2. Verificar sitemap.xml
    assert.strictEqual(fs.existsSync(sitemapPath), true, 'sitemap.xml debe existir en la raíz');
    const sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
    assert.ok(sitemapContent.includes('https://pokeboxvalue.com/es'), 'sitemap.xml debe contener la ruta /es');
    assert.ok(sitemapContent.includes('https://pokeboxvalue.com/en'), 'sitemap.xml debe contener la ruta /en');
    assert.ok(sitemapContent.includes('hreflang="es"'), 'sitemap.xml debe contener hreflang es');
    assert.ok(sitemapContent.includes('hreflang="en"'), 'sitemap.xml debe contener hreflang en');
    assert.ok(sitemapContent.includes('hreflang="x-default"'), 'sitemap.xml debe contener hreflang x-default');
});

test('SEO - Schema.org JSON-LD structured data en plantilla y HTML generado', (t) => {
    const rootDir = process.cwd();
    const templatePath = path.join(rootDir, 'src', 'templates', 'index.template.html');
    const indexPath = path.join(rootDir, 'index.html');

    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    [templateContent, indexContent].forEach((html, idx) => {
        const fileLabel = idx === 0 ? 'index.template.html' : 'index.html';
        assert.ok(html.includes('application/ld+json'), `${fileLabel} debe contener script application/ld+json`);
        assert.ok(html.includes('"@type": "WebApplication"'), `${fileLabel} debe definir Schema WebApplication`);
        assert.ok(html.includes('"name": "PokeBoxValue"'), `${fileLabel} debe contener el nombre de la app`);
    });
});

test('PWA - manifest.json contiene metadatos completos y sw.js incluye assets de SEO', (t) => {
    const rootDir = process.cwd();
    const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
    const swContent = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');

    // Manifest
    assert.strictEqual(manifest.id, '/', 'manifest.json debe definir id="/"');
    assert.ok(manifest.description, 'manifest.json debe tener description');
    assert.ok(Array.isArray(manifest.categories) && manifest.categories.length > 0, 'manifest.json debe definir categories');

    // Service Worker
    assert.ok(swContent.includes("'./robots.txt'"), 'sw.js debe incluir robots.txt en STATIC_ASSETS');
    assert.ok(swContent.includes("'./sitemap.xml'"), 'sw.js debe incluir sitemap.xml en STATIC_ASSETS');
});
