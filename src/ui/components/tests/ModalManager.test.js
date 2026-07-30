import test from 'node:test';
import assert from 'node:assert/strict';
import { setupModals } from '../ModalManager.js';

function createMockModal(id) {
    const classList = new Set(['hidden']);
    return {
        id,
        classList: {
            add: (c) => classList.add(c),
            remove: (c) => classList.delete(c),
            contains: (c) => classList.has(c)
        }
    };
}

test('ui/components - ModalManager delegated click opens legal and privacy modals correctly', () => {
    const legalModal = createMockModal('legal-modal');
    const privacyModal = createMockModal('privacy-modal');

    const listeners = new Map();
    const mockDocument = {
        getElementById: (id) => {
            if (id === 'legal-modal') return legalModal;
            if (id === 'privacy-modal') return privacyModal;
            return null;
        },
        addEventListener: (event, handler) => {
            if (!listeners.has(event)) listeners.set(event, []);
            listeners.get(event).push(handler);
        }
    };

    const originalDoc = globalThis.document;
    const originalWin = globalThis.window;
    globalThis.document = mockDocument;
    globalThis.window = { addEventListener: () => { } };

    try {
        setupModals();

        const clickHandlers = listeners.get('click') || [];
        assert.ok(clickHandlers.length > 0, 'Should register delegated click handlers on document');

        // Simular click en el botón de Aviso Legal (#btn-legal)
        const mockLegalBtn = { id: 'btn-legal', closest: (sel) => sel.includes('#btn-legal') ? { id: 'btn-legal' } : null };
        const mockLegalEvent = { target: mockLegalBtn, preventDefault: () => { } };

        clickHandlers[0](mockLegalEvent);
        assert.equal(legalModal.classList.contains('hidden'), false, 'Legal modal should be visible');

        // Simular click en el botón de Privacidad (#btn-privacy)
        const mockPrivacyBtn = { id: 'btn-privacy', closest: (sel) => sel.includes('#btn-privacy') ? { id: 'btn-privacy' } : null };
        const mockPrivacyEvent = { target: mockPrivacyBtn, preventDefault: () => { } };

        clickHandlers[0](mockPrivacyEvent);
        assert.equal(privacyModal.classList.contains('hidden'), false, 'Privacy modal should be visible');

        // Simular click en botón de cierre (.btn-close-modal)
        const mockCloseBtn = { className: 'btn-close-modal', closest: (sel) => sel.includes('.btn-close-modal') ? { className: 'btn-close-modal' } : null };
        const mockCloseEvent = { target: mockCloseBtn, preventDefault: () => { } };

        clickHandlers[1](mockCloseEvent);
        assert.equal(legalModal.classList.contains('hidden'), true, 'Legal modal should be hidden after close click');
        assert.equal(privacyModal.classList.contains('hidden'), true, 'Privacy modal should be hidden after close click');

    } finally {
        globalThis.document = originalDoc;
        globalThis.window = originalWin;
    }
});
