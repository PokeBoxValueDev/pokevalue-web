import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runProductionBuild } from '../../scripts/bundle.js';

test('contract/production-bundle - Genera bundle de producción minificado con hashes y assets estáticos', () => {
    runProductionBuild();

    const rootDir = process.cwd();
    const distDir = path.join(rootDir, 'dist');
    const assetsDir = path.join(distDir, 'assets');

    // 1. Verificar existencia del directorio dist y assets
    assert.ok(fs.existsSync(distDir), 'El directorio dist/ debe existir');
    assert.ok(fs.existsSync(assetsDir), 'El directorio dist/assets/ debe existir');

    // 2. Verificar existencia de bundles con hash
    const assetFiles = fs.readdirSync(assetsDir);
    const jsBundle = assetFiles.find(f => f.startsWith('app.') && f.endsWith('.js'));
    const cssBundle = assetFiles.find(f => f.startsWith('styles.') && f.endsWith('.css'));

    assert.ok(jsBundle, 'Debe existir un bundle JS minificado con hash (app.[hash].js)');
    assert.ok(cssBundle, 'Debe existir un bundle CSS minificado con hash (styles.[hash].css)');

    // 3. Verificar que dist/index.html contiene los enlaces a los bundles
    const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
    assert.ok(indexHtml.includes(jsBundle), 'dist/index.html debe importar el bundle JS minificado');
    assert.ok(indexHtml.includes(cssBundle), 'dist/index.html debe enlazar el bundle CSS minificado');

    // 4. Verificar presencia de assets esenciales en dist/
    const requiredStaticFiles = [
        'ads.txt',
        'CNAME',
        'robots.txt',
        'sitemap.xml',
        'sw.js',
        'manifest.json',
        'favicon.svg',
        'favicon.png',
        'logo.png',
        'og-image.svg',
        '404.html'
    ];
    requiredStaticFiles.forEach(file => {
        assert.ok(fs.existsSync(path.join(distDir, file)), `dist/${file} debe existir en el bundle de producción`);
    });
});
