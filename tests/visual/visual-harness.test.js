import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHistory } from '../../src/ui/components/HistoryRenderer.js';
import { renderBreakdown } from '../../src/ui/components/BreakdownRenderer.js';
import { renderItems } from '../../src/ui/components/ItemCardRenderer.js';
import { setLanguage } from '../../src/i18n/i18n.js';
import { state } from '../../src/config/config.js';

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

test('visual/harness - item increment/decrement buttons have touch-manipulation class for mobile zoom prevention', () => {
    state.currentCurrency = 'EUR';
    state.currentLang = 'es';
    
    const mockContainer = createMockElement('items-container');
    
    globalThis.document = {
        getElementById: (id) => {
            if (id === 'items-container') return mockContainer;
            return null;
        }
    };
    
    const items = [
        { id: 1, name: 'Pase Premium', category: 'pases', unit_price_eur: 1 }
    ];
    
    renderItems(items);
    
    const html = mockContainer.innerHTML;
    
    assert.ok(html.includes('btn-decrement'), 'btn-decrement must be present');
    assert.ok(html.includes('btn-increment'), 'btn-increment must be present');
    assert.ok(html.includes('touch-manipulation'), 'touch-manipulation class must be present to prevent mobile double-tap zoom');
});
