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

test('contract/architecture - css/styles.css debe contener sintaxis CSS válida sin dobles barras invertidas', () => {
    const rootDir = process.cwd();
    const cssPath = path.join(rootDir, 'css', 'styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.equal(cssContent.includes('\\\\'), false, 'css/styles.css no debe contener secuencias de escape inválidas (\\\\)');
});

