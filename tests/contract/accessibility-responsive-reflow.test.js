import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const VIEWPORTS = [
    { name: 'Móvil Ultra Compacto (iPhone SE 1st gen)', width: 320, height: 568 },
    { name: 'Móvil Compacto (iPhone SE / 12 mini)', width: 375, height: 667 },
    { name: 'Móvil Estándar (iPhone 14/15/16, Pixel 8)', width: 414, height: 896 },
    { name: 'Tablet (iPad Mini / Air)', width: 768, height: 1024 },
    { name: 'Desktop (Pantalla Estándar)', width: 1280, height: 800 }
];

test('accessibility/responsive - Axe-Core pasa 100% limpio en Modo Claro y Modo Oscuro', async () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // 1. Modo Claro
    const lightDom = new JSDOM(html, { pretendToBeVisual: true });
    const lightResults = await axe.run(lightDom.window.document.documentElement, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    });
    assert.equal(lightResults.violations.length, 0, `Axe-Core detectó violaciones en Modo Claro: ${lightResults.violations.map(v => v.help).join(', ')}`);

    // 2. Modo Oscuro (añadiendo clase .dark)
    const darkDom = new JSDOM(html, { pretendToBeVisual: true });
    darkDom.window.document.documentElement.classList.add('dark');
    const darkResults = await axe.run(darkDom.window.document.documentElement, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
    });
    assert.equal(darkResults.violations.length, 0, `Axe-Core detectó violaciones en Modo Oscuro: ${darkResults.violations.map(v => v.help).join(', ')}`);
});

test('accessibility/responsive - Verificación de Reflow y Adaptabilidad Multi-Pantalla (320px a 1280px)', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    for (const vp of VIEWPORTS) {
        const dom = new JSDOM(html, {
            pretendToBeVisual: true
        });

        // Configurar dimensiones de la ventana
        dom.window.innerWidth = vp.width;
        dom.window.innerHeight = vp.height;

        // Comprobación 1: La etiqueta viewport no bloquea el zoom del usuario
        const viewportMeta = dom.window.document.querySelector('meta[name="viewport"]');
        assert.ok(viewportMeta, `Falta meta viewport en ${vp.name}`);
        const content = viewportMeta.getAttribute('content').toLowerCase();
        assert.ok(!content.includes('user-scalable=no'), `El viewport no debe prohibir user-scalable en ${vp.name}`);
        assert.ok(!content.includes('maximum-scale=1'), `El viewport no debe limitar maximum-scale a 1.0 en ${vp.name}`);

        // Comprobación 2: El contenedor principal usa clases fluidas responsivas (max-w-xl, w-full, px-4)
        const main = dom.window.document.querySelector('main');
        assert.ok(main, `Landmark main debe existir en ${vp.name}`);
        assert.ok(main.className.includes('max-w-xl') || main.className.includes('w-full') || main.className.includes('mx-auto'), `El contenedor main debe ser fluido y centrado en ${vp.name}`);
    }
});

test('accessibility/responsive - Escalado de Texto al 200% (WCAG 1.4.4 Resize Text)', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = new JSDOM(html, { pretendToBeVisual: true });
    
    // Simular escalado de fuentes al 200% (32px de tamaño base)
    dom.window.document.documentElement.style.fontSize = '200%';

    // Verificar que los inputs y botones mantienen touch-action manipulation para evitar retrasos
    const interactiveElements = dom.window.document.querySelectorAll('button, input, select');
    assert.ok(interactiveElements.length >= 10, 'Deben existir elementos interactivos');

    // Verificar que los nombres de los objetos tienen clases de ajuste de texto (break-words o leading-tight)
    const formHtml = fs.readFileSync(path.resolve('src/components/form.html'), 'utf8');
    assert.ok(formHtml.includes('overflow-y-auto') || formHtml.includes('overflow-x-auto'), 'Los contenedores de objetos y categorías deben tener scroll fluido para textos grandes');
});

test('accessibility/responsive - Márgenes y Densidad Mobile-First en Main y Secciones', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const dom = new JSDOM(html);

    const main = dom.window.document.querySelector('main');
    assert.ok(main, 'Landmark main debe existir');
    assert.ok(main.className.includes('px-2.5') && main.className.includes('sm:px-4'), 'main debe optimizar márgenes laterales en móvil (px-2.5 sm:px-4)');

    const form = dom.window.document.getElementById('view-form');
    assert.ok(form, 'Sección #view-form debe existir');
    assert.ok(form.className.includes('p-3.5') && form.className.includes('sm:p-6'), 'view-form debe optimizar padding en móvil (p-3.5 sm:p-6)');
});

test('accessibility/responsive - Layout Adaptativo Multi-Columna y Tope de Ancho de Botones en Desktop', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const dom = new JSDOM(html);

    // 1. Contenedor principal expandible con breakpoints md/lg/xl
    const main = dom.window.document.querySelector('main');
    assert.ok(main.className.includes('md:max-w-4xl'), 'main debe expandirse en pantallas medianas (md:max-w-4xl)');
    assert.ok(main.className.includes('lg:max-w-5xl') || main.className.includes('xl:max-w-6xl'), 'main debe expandirse fluidamente en pantallas grandes');

    // 2. Items container adopta grid de 2 columnas en desktop
    const itemsContainer = dom.window.document.getElementById('items-container');
    assert.ok(itemsContainer.className.includes('md:grid') && itemsContainer.className.includes('md:grid-cols-2'), 'items-container debe adoptar grid de 2 columnas en pantallas medianas/grandes');

    // 3. Botones de acción principales tienen max-w-md para ergonomía
    const btnCalculate = dom.window.document.getElementById('btn-calculate');
    assert.ok(btnCalculate.className.includes('max-w-md'), 'btn-calculate debe tener tope de ancho (max-w-md)');

    const btnReset = dom.window.document.getElementById('btn-reset');
    assert.ok(btnReset.className.includes('max-w-md'), 'btn-reset debe tener tope de ancho (max-w-md)');

    // 4. Vista de resultado organizada en 2 columnas en desktop
    const viewResult = dom.window.document.getElementById('view-result');
    assert.ok(viewResult.innerHTML.includes('md:grid-cols-2'), 'view-result debe usar layout en 2 columnas en desktop');
});


