import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { renderView } from '../../src/ui/components/ViewManager.js';
import { RouterController } from '../../src/ui/controllers/RouterController.js';

test('visual/views - renderView renders faq, legal and privacy without hidden class and toggles kofi and about-seo', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const dom = new JSDOM(html, { url: 'https://pokeboxvalue.com/es' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.localStorage = dom.window.localStorage;

    const viewContainer = document.getElementById('view-container');
    const viewForm = document.getElementById('view-form');
    const kofiContainer = document.getElementById('kofi-widget-container');
    const aboutSeo = document.getElementById('about-seo-section');

    assert.ok(viewContainer, 'view-container debe existir');
    assert.ok(viewForm, 'view-form debe existir');

    // 1. Abrir vista FAQ
    renderView('faq');
    assert.equal(viewContainer.classList.contains('hidden'), false, 'view-container debe ser visible');
    assert.ok(viewContainer.innerHTML.includes('view-faq'), 'Debe contener la sección view-faq');
    assert.equal(viewContainer.querySelector('#view-faq')?.classList.contains('hidden'), false, 'view-faq no debe tener la clase hidden');
    assert.equal(viewForm.classList.contains('hidden'), true, 'view-form debe estar oculto');
    if (kofiContainer) assert.equal(kofiContainer.classList.contains('hidden'), true, 'kofi debe estar oculto en vista secundaria');
    if (aboutSeo) assert.equal(aboutSeo.classList.contains('hidden'), true, 'about-seo debe estar oculto en vista secundaria');

    // 2. Abrir vista Legal
    renderView('legal');
    assert.ok(viewContainer.innerHTML.includes('view-legal'), 'Debe contener la sección view-legal');
    assert.equal(viewContainer.querySelector('#view-legal')?.classList.contains('hidden'), false, 'view-legal no debe tener la clase hidden');

    // 3. Abrir vista Privacidad
    renderView('privacy');
    assert.ok(viewContainer.innerHTML.includes('view-privacy'), 'Debe contener la sección view-privacy');
    assert.equal(viewContainer.querySelector('#view-privacy')?.classList.contains('hidden'), false, 'view-privacy no debe tener la clase hidden');

    // 4. Cerrar vista / Volver a la calculadora
    renderView('');
    assert.equal(viewContainer.classList.contains('hidden'), true, 'view-container debe ocultarse');
    assert.equal(viewForm.classList.contains('hidden'), false, 'view-form debe volver a ser visible');
    if (kofiContainer) assert.equal(kofiContainer.classList.contains('hidden'), false, 'kofi debe volver a ser visible');
    if (aboutSeo) assert.equal(aboutSeo.classList.contains('hidden'), false, 'about-seo debe volver a ser visible');
});

test('visual/views - lang-select y currency-select poseen estilos visibles y valores válidos', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const dom = new JSDOM(html);
    const langSelect = dom.window.document.getElementById('lang-select');
    const currencySelect = dom.window.document.getElementById('currency-select');

    assert.ok(langSelect, 'lang-select debe existir');
    assert.ok(currencySelect, 'currency-select debe existir');

    const langOptions = Array.from(langSelect.querySelectorAll('option')).map(o => o.value);
    assert.deepEqual(langOptions, ['es', 'en'], 'Las opciones de idioma deben ser ES y EN');

    assert.ok(langSelect.className.includes('text-gray-900'), 'lang-select debe tener color de texto explícito');
    assert.ok(currencySelect.className.includes('text-gray-900'), 'currency-select debe tener color de texto explícito');
});
