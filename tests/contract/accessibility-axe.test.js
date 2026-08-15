import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

test('accessibility/axe - Auditoría Oficial Axe-Core en index.html', async () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Montar el DOM real de index.html con JSDOM
    const dom = new JSDOM(html, {
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });

    // Inyectar el motor axe-core oficial en la ventana de JSDOM
    const results = await axe.run(dom.window.document.documentElement, {
        runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        }
    });

    console.log('\n=======================================================');
    console.log('♿ INFORME OFICIAL DEL MOTOR AXE-CORE (Deque Systems)');
    console.log('=======================================================');
    console.log(`✅ Reglas WCAG Superadas con Éxito: ${results.passes.length}`);
    results.passes.slice(0, 8).forEach(p => console.log(`   ✓ [${p.id}] ${p.description}`));
    if (results.passes.length > 8) {
        console.log(`   ... y ${results.passes.length - 8} reglas adicionales superadas.`);
    }

    if (results.violations.length > 0) {
        console.log(`\n❌ Violaciones Detectadas por Axe-Core (${results.violations.length}):`);
        results.violations.forEach(v => {
            console.log(`   ✗ [${v.impact ? v.impact.toUpperCase() : 'INFO'}] ${v.help}: ${v.description}`);
            v.nodes.forEach(n => console.log(`      Elemento: ${n.html}`));
        });
    } else {
        console.log('\n🎉 ¡Cero violaciones de accesibilidad detectadas por Axe-Core! Nivel WCAG 2.1 AA alcanzado.');
    }
    console.log('=======================================================\n');

    assert.equal(results.violations.length, 0, `Axe-Core detectó ${results.violations.length} violaciones: ${results.violations.map(v => v.help).join(', ')}`);
});
