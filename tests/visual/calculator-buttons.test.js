import test from 'node:test';
import assert from 'node:assert/strict';
import { CalculatorController } from '../../src/ui/controllers/CalculatorController.js';
import { state } from '../../src/config/config.js';

function createMockElement(id, attrs = {}) {
    const listeners = {};
    const classes = new Set();
    return {
        id,
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            contains: (c) => classes.has(c)
        },
        getAttribute: (attr) => attrs[attr] || (attr === 'id' ? id : null),
        addEventListener: (event, fn) => {
            listeners[event] = fn;
        },
        click: () => {
            if (listeners['click']) listeners['click']();
        },
        focus: () => {},
        value: ''
    };
}

test('visual/harness - CalculatorController binds click handlers for btn-share, btn-share-card, and btn-reset', () => {
    const elements = {
        'btn-calculate': createMockElement('btn-calculate'),
        'box-price': createMockElement('box-price'),
        'price-error': createMockElement('price-error'),
        'btn-clear-history': createMockElement('btn-clear-history'),
        'btn-share': createMockElement('btn-share'),
        'btn-share-card': createMockElement('btn-share-card'),
        'btn-reset': createMockElement('btn-reset'),
        'view-form': createMockElement('view-form'),
        'view-result': createMockElement('view-result')
    };

    globalThis.document = {
        getElementById: (id) => elements[id] || null,
        querySelectorAll: () => []
    };
    globalThis.window = {
        scrollTo: () => {}
    };

    CalculatorController.init();

    // Verify btn-reset switches view-result to hidden and view-form to visible
    elements['view-result'].classList.remove('hidden');
    elements['view-form'].classList.add('hidden');

    elements['btn-reset'].click();

    assert.ok(elements['view-result'].classList.contains('hidden'), 'btn-reset must hide view-result');
    assert.ok(!elements['view-form'].classList.contains('hidden'), 'btn-reset must show view-form');
});

test('visual/harness - btn-share copies or shares text summary when clicked', async () => {
    let sharedData = null;
    let clipboardText = null;

    globalThis.navigator = {
        share: async (data) => { sharedData = data; },
        clipboard: {
            writeText: async (text) => { clipboardText = text; }
        }
    };

    state.lastBoxPrice = 500;
    state.lastResult = {
        totalValue: 750,
        isProfitable: true,
        diff: 250,
        grade: 'A'
    };
    state.currentCurrency = 'EUR';

    const btnShare = createMockElement('btn-share');

    globalThis.document = {
        getElementById: (id) => (id === 'btn-share' ? btnShare : null),
        querySelectorAll: () => []
    };

    CalculatorController.init();
    await btnShare.click();

    assert.ok(sharedData !== null || clipboardText !== null, 'btn-share click must trigger navigator.share or clipboard.writeText');
});

test('visual/harness - btn-reset-qty resets item quantity inputs to 0', () => {
    const btnResetQty = createMockElement('btn-reset-qty');
    const input1 = { value: '5', dispatchEvent: () => {} };
    const input2 = { value: '3', dispatchEvent: () => {} };

    globalThis.document = {
        getElementById: (id) => (id === 'btn-reset-qty' ? btnResetQty : null),
        querySelectorAll: (selector) => (selector === '.item-qty' ? [input1, input2] : [])
    };

    CalculatorController.init();
    btnResetQty.click();

    assert.equal(input1.value, 0, 'input1 value must be reset to 0');
    assert.equal(input2.value, 0, 'input2 value must be reset to 0');
});

test('visual/harness - ThemeController toggles dark mode when theme-toggle-btn is clicked', async () => {
    const themeBtn = createMockElement('theme-toggle-btn');
    const lightIcon = createMockElement('theme-toggle-light-icon');
    const darkIcon = createMockElement('theme-toggle-dark-icon');
    const docClasses = new Set();

    globalThis.localStorage = {
        getItem: () => null,
        setItem: () => {}
    };
    globalThis.window = {
        matchMedia: () => ({ matches: false })
    };
    globalThis.document = {
        getElementById: (id) => {
            if (id === 'theme-toggle-btn') return themeBtn;
            if (id === 'theme-toggle-light-icon') return lightIcon;
            if (id === 'theme-toggle-dark-icon') return darkIcon;
            return null;
        },
        documentElement: {
            classList: {
                add: (c) => docClasses.add(c),
                remove: (c) => docClasses.delete(c),
                contains: (c) => docClasses.has(c)
            }
        }
    };

    const { ThemeController } = await import('../../src/ui/controllers/ThemeController.js');
    ThemeController.init();

    // Click themeBtn to toggle dark mode
    themeBtn.click();
    assert.ok(docClasses.has('dark'), 'document element must contain dark class after clicking theme-toggle-btn');

    themeBtn.click();
    assert.ok(!docClasses.has('dark'), 'document element must remove dark class after clicking theme-toggle-btn again');
});

test('visual/harness - ModalManager opens modals when btn-legal and btn-privacy are clicked', async () => {
    const legalModal = createMockElement('legal-modal');
    const privacyModal = createMockElement('privacy-modal');
    legalModal.classList.add('hidden');
    privacyModal.classList.add('hidden');

    const docClickListeners = [];
    globalThis.document = {
        getElementById: (id) => {
            if (id === 'legal-modal') return legalModal;
            if (id === 'privacy-modal') return privacyModal;
            return null;
        },
        addEventListener: (event, fn) => {
            if (event === 'click') docClickListeners.push(fn);
        }
    };
    globalThis.window = {
        addEventListener: () => {}
    };

    const { setupModals } = await import('../../src/ui/components/ModalManager.js');
    setupModals();

    assert.ok(docClickListeners.length > 0, 'setupModals must attach document click listeners');

    // Simulate clicking btn-legal
    const btnLegal = createMockElement('btn-legal');
    btnLegal.closest = (selector) => (selector.includes('#btn-legal') ? btnLegal : null);
    docClickListeners.forEach(fn => fn({ target: btnLegal, preventDefault: () => {} }));

    assert.ok(!legalModal.classList.contains('hidden'), 'legal-modal must show (remove hidden) when btn-legal is clicked');

    // Simulate clicking btn-privacy
    const btnPrivacy = createMockElement('btn-privacy');
    btnPrivacy.closest = (selector) => (selector.includes('#btn-privacy') ? btnPrivacy : null);
    docClickListeners.forEach(fn => fn({ target: btnPrivacy, preventDefault: () => {} }));

    assert.ok(!privacyModal.classList.contains('hidden'), 'privacy-modal must show (remove hidden) when btn-privacy is clicked');
});
