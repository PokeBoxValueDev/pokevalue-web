import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHistory, renderBreakdown, renderItems } from '../../js/ui.js';
import { setLanguage } from '../../js/i18n.js';
import { state } from '../../js/config.js';

// Setup Mock DOM
const mockStore = new Map();
globalThis.localStorage = {
    getItem: (key) => mockStore.get(key) || null,
    setItem: (key, val) => mockStore.set(key, String(val)),
    removeItem: (key) => mockStore.delete(key),
    clear: () => mockStore.clear()
};

function createMockElement(id) {
    const classes = new Set();
    return {
        id,
        innerHTML: '',
        innerText: '',
        classList: {
            add: (c) => classes.add(c),
            remove: (c) => classes.delete(c),
            contains: (c) => classes.has(c)
        },
        querySelectorAll: () => []
    };
}

test('visual/harness - history item visual badge styling for profitable vs unprofitable', () => {
    setLanguage('es');
    localStorage.clear();

    const historyItems = [
        { boxPrice: 10, totalValue: 15, currencySymbol: '€', isProfitable: true, timestamp: Date.now() },
        { boxPrice: 20, totalValue: 5, currencySymbol: '€', isProfitable: false, timestamp: Date.now() }
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

    const html = mockContainer.innerHTML;

    // Check profitable visual classes (Emerald)
    assert.ok(html.includes('text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'));
    assert.ok(html.includes('Rentable'));

    // Check non-profitable visual classes (Rose)
    assert.ok(html.includes('text-rose-500 bg-rose-50 dark:bg-rose-950/30'));
    assert.ok(html.includes('No rentable'));
});

test('visual/harness - category breakdown visual color coding and percentage widths', () => {
    const mockContainer = createMockElement('breakdown-legend');
    globalThis.document = {
        getElementById: (id) => id === 'breakdown-legend' ? mockContainer : null
    };

    const totals = {
        pases: 10,       // 50%
        incubadoras: 6,  // 30%
        mejoras: 4       // 20%
    };

    renderBreakdown(totals, 20);

    const html = mockContainer.innerHTML;

    // Category background colors
    assert.ok(html.includes('bg-indigo-500'));
    assert.ok(html.includes('bg-amber-500'));
    assert.ok(html.includes('bg-emerald-500'));

    // Percentage widths
    assert.ok(html.includes('style="width: 50%"'));
    assert.ok(html.includes('style="width: 30%"'));
    assert.ok(html.includes('style="width: 20%"'));
});
