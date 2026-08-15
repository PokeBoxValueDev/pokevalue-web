import test from 'node:test';
import assert from 'node:assert/strict';
import { renderView } from '../../../src/ui/components/ViewManager.js';

function createMockElement(id) {
    const classList = new Set(['hidden']);
    return {
        id,
        innerHTML: '',
        classList: {
            add: (c) => classList.add(c),
            remove: (c) => classList.delete(c),
            contains: (c) => classList.has(c)
        }
    };
}

test('router/view-manager - renderView renderiza e inyecta vistas bajo demanda y limpia el contenedor al salir', () => {
    const viewContainer = createMockElement('view-container');
    const viewForm = createMockElement('view-form');
    const viewResult = createMockElement('view-result');

    const originalDoc = globalThis.document;
    const originalWin = globalThis.window;

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'view-container') return viewContainer;
            if (id === 'view-form') return viewForm;
            if (id === 'view-result') return viewResult;
            return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null
    };
    globalThis.window = {
        scrollTo: () => {}
    };

    try {
        // 1. Cargar vista legal
        renderView('legal');
        assert.equal(viewContainer.classList.contains('hidden'), false);
        assert.ok(viewContainer.innerHTML.includes('id="view-legal"'));
        assert.equal(viewForm.classList.contains('hidden'), true);

        // 2. Cargar vista privacy
        renderView('privacy');
        assert.equal(viewContainer.classList.contains('hidden'), false);
        assert.ok(viewContainer.innerHTML.includes('id="view-privacy"'));

        // 3. Cargar vista faq
        renderView('faq');
        assert.equal(viewContainer.classList.contains('hidden'), false);
        assert.ok(viewContainer.innerHTML.includes('id="view-faq"'));

        // 4. Volver al inicio (vista vacía)
        renderView('');
        assert.equal(viewContainer.classList.contains('hidden'), true);
        assert.equal(viewContainer.innerHTML, '');
        assert.equal(viewForm.classList.contains('hidden'), false);
    } finally {
        globalThis.document = originalDoc;
        globalThis.window = originalWin;
    }
});
