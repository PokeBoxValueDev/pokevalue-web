import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('contract/visual-runner - visual-test-runner.html contiene las 7 secciones de producción', () => {
    const runnerPath = path.resolve('tests/visual/visual-test-runner.html');
    assert.ok(fs.existsSync(runnerPath), 'visual-test-runner.html debe existir');
    const content = fs.readFileSync(runnerPath, 'utf8');

    // 1. Verificar presencia de las 7 secciones
    assert.ok(content.includes('id="sec-form"'), 'Debe contener la sección 1: Calculadora Principal');
    assert.ok(content.includes('id="sec-result-profitable"'), 'Debe contener la sección 2: Resultado Rentable (S)');
    assert.ok(content.includes('id="sec-result-loss"'), 'Debe contener la sección 3: Resultado No Rentable (F)');
    assert.ok(content.includes('id="sec-history"'), 'Debe contener la sección 4: Historial de Cálculos');
    assert.ok(content.includes('id="sec-about-seo"'), 'Debe contener la sección 5: Guía SEO & FAQ');
    assert.ok(content.includes('id="sec-modals"'), 'Debe contener la sección 6: Modales Legales');
    assert.ok(content.includes('id="sec-404"'), 'Debe contener la sección 7: Error 404');

    // 2. Verificar presencia de controles de accesibilidad
    assert.ok(content.includes('id="btn-mode-light"'), 'Debe incluir botón de Modo Claro');
    assert.ok(content.includes('id="btn-mode-dark"'), 'Debe incluir botón de Modo Oscuro');
    assert.ok(content.includes('id="btn-toggle-zoom"'), 'Debe incluir control de Zoom 200%');
    assert.ok(content.includes('id="btn-run-axe"'), 'Debe incluir botón de auditoría Axe-Core en vivo');
});
