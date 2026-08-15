import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

test('accessibility/axe - Auditoría Oficial Axe-Core en index.html (Página Principal Completa)', async () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, {
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });

    const results = await axe.run(dom.window.document.documentElement, {
        runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        }
    });

    console.log('\n=======================================================');
    console.log('♿ INFORME AXE-CORE: PÁGINA PRINCIPAL (index.html)');
    console.log('=======================================================');
    console.log(`✅ Reglas WCAG Superadas: ${results.passes.length}`);
    results.passes.slice(0, 6).forEach(p => console.log(`   ✓ [${p.id}] ${p.description}`));
    if (results.passes.length > 6) {
        console.log(`   ... y ${results.passes.length - 6} reglas adicionales superadas.`);
    }

    if (results.violations.length > 0) {
        console.log(`\n❌ Violaciones (${results.violations.length}):`);
        results.violations.forEach(v => {
            console.log(`   ✗ [${v.impact ? v.impact.toUpperCase() : 'INFO'}] ${v.help}: ${v.description}`);
            v.nodes.forEach(n => console.log(`      Elemento: ${n.html}`));
        });
    } else {
        console.log('🎉 ¡Cero violaciones! Página principal 100% accesible.');
    }
    console.log('=======================================================\n');

    assert.equal(results.violations.length, 0, `Axe-Core detectó ${results.violations.length} violaciones en index.html: ${results.violations.map(v => v.help).join(', ')}`);
});

test('accessibility/axe - Auditoría Oficial Axe-Core en Vistas Secundarias (Legal, Privacidad, FAQ)', async () => {
    const viewsDir = path.resolve('src/components/views');
    const viewFiles = ['legal.html', 'privacy.html', 'faq.html'];

    for (const file of viewFiles) {
        const filePath = path.join(viewsDir, file);
        if (!fs.existsSync(filePath)) continue;

        const viewHtml = fs.readFileSync(filePath, 'utf8');
        const fullDocHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Test ${file}</title></head><body><main role="main">${viewHtml}</main></body></html>`;

        const dom = new JSDOM(fullDocHtml, { pretendToBeVisual: true });
        const results = await axe.run(dom.window.document.documentElement, {
            runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
            }
        });

        assert.equal(results.violations.length, 0, `Axe-Core detectó violaciones en vista ${file}: ${results.violations.map(v => v.help).join(', ')}`);
    }
});

test('accessibility/axe - Auditoría Oficial Axe-Core en 404.html (Página de Error)', async () => {
    const htmlPath = path.resolve('404.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, { pretendToBeVisual: true });
    const results = await axe.run(dom.window.document.documentElement, {
        runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
    });

    assert.equal(results.violations.length, 0, `Axe-Core detectó violaciones en 404.html: ${results.violations.map(v => v.help).join(', ')}`);
});

test('accessibility/axe - Auditoría Oficial Axe-Core en visual-test-runner.html (Todas las 7 Secciones)', async () => {
    const htmlPath = path.resolve('tests/visual/visual-test-runner.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, { pretendToBeVisual: true });
    const results = await axe.run(dom.window.document.documentElement, {
        runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
    });

    assert.equal(results.violations.length, 0, `Axe-Core detectó violaciones en visual-test-runner.html: ${results.violations.map(v => v.help).join(', ')}`);
});
