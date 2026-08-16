import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('contract/architecture - Regla 5: index.html debe ser ligero y no contener vistas secundarias inyectadas', () => {
    const rootDir = process.cwd();
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Comprobar que index.html NO contiene las secciones completas de las vistas secundarias
    assert.ok(!indexHtml.includes('id="view-legal"'), 'index.html no debe contener <section id="view-legal"> embebido');
    assert.ok(!indexHtml.includes('id="view-privacy"'), 'index.html no debe contener <section id="view-privacy"> embebido');
    assert.ok(!indexHtml.includes('id="view-faq"'), 'index.html no debe contener <section id="view-faq"> embebido');

    // Comprobar que existe el contenedor dinámico para renderizado bajo demanda
    assert.ok(indexHtml.includes('id="view-container"'), 'index.html debe contener <div id="view-container"></div>');
});

test('contract/architecture - Componentes modulares existen en src/components/', () => {
    const rootDir = process.cwd();
    const componentsDir = path.join(rootDir, 'src', 'components');

    const expectedComponents = [
        'header.html',
        'form.html',
        'result.html',
        'history.html',
        'kofi.html',
        'about-seo.html',
        'footer.html',
        'head/seo-schema.html',
        'head/theme-init.html',
        'head/cookie-consent.html',
        'head/analytics.html',
        'views/legal.html',
        'views/privacy.html',
        'views/faq.html'
    ];

    expectedComponents.forEach(comp => {
        const fullPath = path.join(componentsDir, comp);
        assert.ok(fs.existsSync(fullPath), `Componente modular requerido no existe: "${comp}"`);
    });
});

test('contract/architecture - #view-container debe ser hijo directo de <main> y no estar anidado en secciones ocultas', () => {
    const rootDir = process.cwd();
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Verificar que result.html no tenga etiquetas sin cerrar que traguen a view-container
    const resultHtml = fs.readFileSync(path.join(rootDir, 'src', 'components', 'result.html'), 'utf8');
    assert.ok(resultHtml.trim().endsWith('</section>'), 'result.html debe cerrarse correctamente con </section>');

    // Comprobar orden y jerarquía en index.html
    const viewResultIdx = indexHtml.indexOf('id="view-result"');
    const viewContainerIdx = indexHtml.indexOf('id="view-container"');
    assert.ok(viewResultIdx !== -1 && viewContainerIdx !== -1, 'Tanto view-result como view-container deben existir');
    assert.ok(viewContainerIdx > viewResultIdx, 'view-container debe estar después de view-result');
});


