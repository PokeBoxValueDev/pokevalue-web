import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBreakdown, renderHistory, renderItems } from '../../js/ui.js';
import { setLanguage } from '../../js/i18n.js';
import { state } from '../../js/config.js';

// Setup Mock DOM and localStorage for UI component tests
const mockStore = new Map();
globalThis.localStorage = {
    getItem: (key) => mockStore.get(key) || null,
    setItem: (key, val) => mockStore.set(key, String(val)),
    removeItem: (key) => mockStore.delete(key),
    clear: () => mockStore.clear()
};

function createMockElement(id = '', classList = []) {
    const classes = new Set(classList);
    const children = [];
    return {
        id,
        innerHTML: '',
        innerText: '',
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            contains: (c) => classes.has(c)
        },
        querySelectorAll: (selector) => {
            if (selector === '.btn-restore') {
                // Return mock restore buttons if rendered
                return Array.from(children).filter(c => c.className && c.className.includes('btn-restore'));
            }
            return [];
        },
        appendChild: (child) => children.push(child)
    };
}

test('ui - renderBreakdown outputs breakdown bars correctly', () => {
    const mockContainer = createMockElement('breakdown-legend');
    globalThis.document = {
        getElementById: (id) => id === 'breakdown-legend' ? mockContainer : null
    };

    const categoryTotals = { pases: 10, incubadoras: 10, consumibles: 0, otros: 0 };
    renderBreakdown(categoryTotals, 20);

    assert.ok(mockContainer.innerHTML.includes('(50%)'));
    assert.ok(mockContainer.innerHTML.includes('Pases'));
    assert.ok(mockContainer.innerHTML.includes('Incubadoras'));
});

test('ui - renderHistory handles empty history state', () => {
    localStorage.clear();
    const mockSection = createMockElement('history-section');
    const mockContainer = createMockElement('history-container');

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'history-section') return mockSection;
            if (id === 'history-container') return mockContainer;
            return null;
        }
    };

    renderHistory();
    assert.ok(mockSection.classList.contains('hidden'));
    assert.equal(mockContainer.innerHTML, '');
});

test('ui - renderHistory renders profitable and non-profitable entries with formatted currencies', () => {
    setLanguage('es');
    localStorage.clear();

    const historyItems = [
        { boxPrice: 10, totalValue: 15, currencySymbol: '€', isProfitable: true, timestamp: Date.now() },
        { boxPrice: 100, totalValue: 50, currencySymbol: '🟡', isProfitable: false, timestamp: Date.now() }
    ];
    localStorage.setItem('pokevalue_history', JSON.stringify(historyItems));

    const mockSection = createMockElement('history-section');
    const mockContainer = createMockElement('history-container');

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'history-section') return mockSection;
            if (id === 'history-container') return mockContainer;
            return null;
        }
    };

    renderHistory();

    assert.equal(mockSection.classList.contains('hidden'), false);
    assert.ok(mockContainer.innerHTML.includes('Rentable'));
    assert.ok(mockContainer.innerHTML.includes('No rentable'));
    assert.ok(mockContainer.innerHTML.includes('10.00€'));
    assert.ok(mockContainer.innerHTML.includes('100🟡'));
    assert.ok(mockContainer.innerHTML.includes('data-i18n="btnRestore"'));
});

test('ui - renderItems renders item list grouped by category with ARIA labels and touch targets', () => {
    setLanguage('es');
    state.currentCurrency = 'EUR';

    const items = [
        { id: 1, name: 'Pase de Incursión', category: 'pases', unit_price_eur: 1.00 },
        { id: 2, name: 'Super Incubadora', category: 'incubadoras', unit_price_eur: 1.50 }
    ];

    const mockItemsContainer = createMockElement('items-container');
    globalThis.document = {
        getElementById: (id) => id === 'items-container' ? mockItemsContainer : null
    };

    renderItems(items);

    assert.ok(mockItemsContainer.innerHTML.includes('Pase de Incursión'));
    assert.ok(mockItemsContainer.innerHTML.includes('Super Incubadora'));
    assert.ok(mockItemsContainer.innerHTML.includes('1.00 <span class="currency-symbol">€</span>'));
    assert.ok(mockItemsContainer.innerHTML.includes('1.50 <span class="currency-symbol">€</span>'));

    // ARIA & Mobile Touch Targets (>= 40px)
    assert.ok(mockItemsContainer.innerHTML.includes('aria-label="Aumentar cantidad de Pase de Incursión"'));
    assert.ok(mockItemsContainer.innerHTML.includes('aria-label="Disminuir cantidad de Pase de Incursión"'));
    assert.ok(mockItemsContainer.innerHTML.includes('w-10 h-10'));
});
