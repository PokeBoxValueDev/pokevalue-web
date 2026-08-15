import test from 'node:test';
import assert from 'node:assert/strict';
import { setupViews, renderView } from '../ViewManager.js';

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

test('ui/components - ViewManager delegated click opens legal and privacy views correctly', () => {
    const viewContainer = createMockElement('view-container');
    const viewForm = createMockElement('view-form');
    const viewResult = createMockElement('view-result');

    const listeners = new Map();
    const mockDocument = {
        getElementById: (id) => {
            if (id === 'view-container') return viewContainer;
            if (id === 'view-form') return viewForm;
            if (id === 'view-result') return viewResult;
            return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        documentElement: { setAttribute: () => {} },
        addEventListener: (event, handler) => {
            if (!listeners.has(event)) listeners.set(event, []);
            listeners.get(event).push(handler);
        }
    };

    const originalDoc = globalThis.document;
    const originalWin = globalThis.window;
    globalThis.document = mockDocument;
    globalThis.window = {
        location: { pathname: '/es' },
        history: { pushState: () => {}, replaceState: () => {} },
        addEventListener: () => { },
        scrollTo: () => { }
    };

    try {
        setupViews();

        const clickHandlers = listeners.get('click') || [];
        assert.ok(clickHandlers.length > 0, 'Should register delegated click handlers on document');

        // Simular click en el botón de Aviso Legal (#btn-legal)
        const mockLegalBtn = { id: 'btn-legal', closest: (sel) => sel.includes('#btn-legal') ? { id: 'btn-legal' } : null };
        const mockLegalEvent = { target: mockLegalBtn, preventDefault: () => { } };

        clickHandlers[0](mockLegalEvent);
        assert.equal(viewContainer.classList.contains('hidden'), false, 'View container should be visible');
        assert.ok(viewContainer.innerHTML.includes('id="view-legal"'), 'Legal view should be rendered');

        // Simular click en el botón de Privacidad (#btn-privacy)
        const mockPrivacyBtn = { id: 'btn-privacy', closest: (sel) => sel.includes('#btn-privacy') ? { id: 'btn-privacy' } : null };
        const mockPrivacyEvent = { target: mockPrivacyBtn, preventDefault: () => { } };

        clickHandlers[0](mockPrivacyEvent);
        assert.equal(viewContainer.classList.contains('hidden'), false, 'View container should be visible');
        assert.ok(viewContainer.innerHTML.includes('id="view-privacy"'), 'Privacy view should be rendered');

        // Simular click en botón de cierre (.btn-close-modal)
        const mockCloseBtn = { className: 'btn-close-modal', closest: (sel) => sel.includes('.btn-close-modal') ? { className: 'btn-close-modal' } : null };
        const mockCloseEvent = { target: mockCloseBtn, preventDefault: () => { } };

        clickHandlers[1](mockCloseEvent);
        assert.equal(viewContainer.classList.contains('hidden'), true, 'View container should be hidden after close click');
        assert.equal(viewContainer.innerHTML, '', 'View container should be cleared');

    } finally {
        globalThis.document = originalDoc;
        globalThis.window = originalWin;
    }
});
