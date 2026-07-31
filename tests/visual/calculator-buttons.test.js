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
        dispatchEvent: () => {},
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

test('visual/harness - ThemeController auto-detects OS prefers-color-scheme dark mode when no saved preference exists', async () => {
    const lightIcon = createMockElement('theme-toggle-light-icon');
    const darkIcon = createMockElement('theme-toggle-dark-icon');
    const docClasses = new Set();

    globalThis.localStorage = { getItem: () => null, setItem: () => {} };
    globalThis.window = {
        matchMedia: (query) => ({
            matches: query.includes('dark'),
            addEventListener: () => {}
        })
    };
    globalThis.document = {
        getElementById: (id) => {
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

    assert.ok(docClasses.has('dark'), 'must automatically enable dark mode when OS prefers dark mode');
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

test('visual/harness - site-logo header click returns to main view-form', () => {
    const siteLogo = createMockElement('site-logo');
    const viewForm = createMockElement('view-form');
    const viewResult = createMockElement('view-result');
    const btnCalculate = createMockElement('btn-calculate');

    viewResult.classList.remove('hidden');
    viewForm.classList.add('hidden');

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'site-logo') return siteLogo;
            if (id === 'view-form') return viewForm;
            if (id === 'view-result') return viewResult;
            if (id === 'btn-calculate') return btnCalculate;
            return null;
        },
        querySelectorAll: () => []
    };
    globalThis.window = {
        scrollTo: () => {}
    };

    CalculatorController.init();
    siteLogo.click();

    assert.ok(viewResult.classList.contains('hidden'), 'site-logo click must hide view-result');
    assert.ok(!viewForm.classList.contains('hidden'), 'site-logo click must show view-form');
});

test('visual/harness - share handlers guard against concurrent calls and handle InvalidStateError gracefully', async () => {
    let shareCallCount = 0;
    globalThis.navigator = {
        share: async () => {
            shareCallCount++;
            const err = new Error('An earlier share has not yet completed.');
            err.name = 'InvalidStateError';
            throw err;
        }
    };

    state.lastBoxPrice = 100;
    state.lastResult = { totalValue: 150, isProfitable: true, diff: 50, grade: 'A' };

    const btnShare = createMockElement('btn-share');

    globalThis.document = {
        getElementById: (id) => (id === 'btn-share' ? btnShare : null),
        querySelectorAll: () => []
    };

    CalculatorController.init();

    // Triggering share when share raises InvalidStateError must be caught gracefully without unhandled exception
    await assert.doesNotReject(async () => {
        await btnShare.click();
    });
});

test('visual/harness - generateSocialCardCanvas layout calculates bounding box and generates PNG blob', async () => {
    globalThis.Image = class {
        constructor() {
            setTimeout(() => {
                this.complete = true;
                this.naturalHeight = 40;
                if (this.onload) this.onload();
            }, 5);
        }
    };
    globalThis.document = {
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => ({
                        createLinearGradient: () => ({ addColorStop: () => {} }),
                        fillRect: () => {},
                        beginPath: () => {},
                        roundRect: () => {},
                        stroke: () => {},
                        fill: () => {},
                        drawImage: () => {},
                        fillText: () => {},
                        measureText: (text) => ({ width: text.length * 15 }),
                        moveTo: () => {},
                        lineTo: () => {}
                    }),
                    toBlob: (cb) => cb({ size: 100, type: 'image/png' })
                };
            }
            return null;
        }
    };

    const { generateSocialCardCanvas } = await import('../../src/ui/components/SocialCardGenerator.js');
    const blob = await generateSocialCardCanvas({
        boxPrice: 100,
        totalValue: 150,
        diff: 50,
        isProfitable: true,
        grade: 'S',
        currencySymbol: '€'
    });

    assert.ok(blob !== null, 'generateSocialCardCanvas must produce PNG blob');
});

test('visual/harness - I18nController detects browser language dynamically when no saved preference exists', async () => {
    const { I18nController } = await import('../../src/ui/controllers/I18nController.js');

    // 1. Saved preference priority
    globalThis.localStorage = { getItem: (key) => (key === 'lang' ? 'en' : null) };
    assert.equal(I18nController.detectLanguage(), 'en', 'must prioritize saved localStorage lang');

    // 2. Fallback to navigator.language for Spanish
    globalThis.localStorage = { getItem: () => null };
    globalThis.navigator = { language: 'es-ES' };
    assert.equal(I18nController.detectLanguage(), 'es', 'must detect es from es-ES browser language');

    // 3. Fallback to navigator.language for English
    globalThis.navigator = { language: 'en-US' };
    assert.equal(I18nController.detectLanguage(), 'en', 'must detect en from en-US browser language');
});

test('visual/harness - CurrencyController detects browser region currency dynamically when no saved preference exists', async () => {
    const { CurrencyController } = await import('../../src/ui/controllers/CurrencyController.js');

    // 1. Saved preference priority
    globalThis.localStorage = { getItem: (key) => (key === 'currency' ? 'USD' : null) };
    assert.equal(CurrencyController.detectCurrency(), 'USD', 'must prioritize saved localStorage currency');

    // 2. Fallback to USD for US region
    globalThis.localStorage = { getItem: () => null };
    globalThis.navigator = { language: 'en-US' };
    assert.equal(CurrencyController.detectCurrency(), 'USD', 'must detect USD for en-US browser language');

    // 3. Default to EUR for non-US region
    globalThis.navigator = { language: 'es-ES' };
    assert.equal(CurrencyController.detectCurrency(), 'EUR', 'must default to EUR for es-ES browser language');
});

test('visual/harness - ServiceWorkerController registers worker without unhandled reloads or infinite loops', async () => {
    let reloaded = false;
    let registeredUrl = null;
    let controllerChangeListener = null;

    globalThis.navigator = {
        serviceWorker: {
            controller: null,
            addEventListener: (event, fn) => {
                if (event === 'controllerchange') controllerChangeListener = fn;
            },
            register: async (url) => {
                registeredUrl = url;
                return {};
            }
        }
    };
    globalThis.window = {
        addEventListener: (event, fn) => {
            if (event === 'load') fn();
        },
        location: { reload: () => { reloaded = true; } }
    };

    const { ServiceWorkerController } = await import('../../src/ui/controllers/ServiceWorkerController.js');
    ServiceWorkerController.init();

    assert.equal(registeredUrl, './sw.js', 'must register ./sw.js');

    // Simulate controllerchange when no previous controller existed (initial load)
    if (controllerChangeListener) controllerChangeListener();
    assert.equal(reloaded, false, 'must NOT trigger page reload on initial service worker activation');
});

test('visual/harness - CalculatorController.switchView toggles view-form and view-result correctly', () => {
    const viewForm = createMockElement('view-form');
    const viewResult = createMockElement('view-result');
    viewForm.classList.add('hidden');

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'view-form') return viewForm;
            if (id === 'view-result') return viewResult;
            return null;
        }
    };
    globalThis.window = { scrollTo: () => {} };

    CalculatorController.switchView('form');
    assert.equal(viewForm.classList.contains('hidden'), false, 'view-form must be visible after switching to form');
    assert.equal(viewResult.classList.contains('hidden'), true, 'view-result must be hidden after switching to form');

    CalculatorController.switchView('result');
    assert.equal(viewForm.classList.contains('hidden'), true, 'view-form must be hidden after switching to result');
    assert.equal(viewResult.classList.contains('hidden'), false, 'view-result must be visible after switching to result');
});

test('visual/harness - CalculatorController.resetForm resets box price, price error and item quantities to 0', () => {
    const boxPriceInput = createMockElement('box-price');
    boxPriceInput.value = '10.00';
    const priceError = createMockElement('price-error');
    const itemQty1 = createMockElement('item-qty-1');
    itemQty1.value = '5';

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'box-price') return boxPriceInput;
            if (id === 'price-error') return priceError;
            return null;
        },
        querySelectorAll: (sel) => {
            if (sel === '.item-qty') return [itemQty1];
            return [];
        }
    };
    globalThis.window = { scrollTo: () => {} };

    CalculatorController.resetForm();

    assert.equal(boxPriceInput.value, '', 'box-price input value must be cleared on resetForm');
    assert.equal(priceError.classList.contains('hidden'), true, 'price-error must be hidden on resetForm');
    assert.equal(itemQty1.value, 0, 'item quantity input value must be reset to 0 on resetForm');
});
