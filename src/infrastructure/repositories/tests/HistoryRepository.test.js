import test from 'node:test';
import assert from 'node:assert/strict';
import { HistoryRepository } from '../HistoryRepository.js';

// Setup Mock localStorage for Node test runner
const mockStore = new Map();
globalThis.localStorage = {
    getItem: (key) => mockStore.get(key) || null,
    setItem: (key, val) => mockStore.set(key, String(val)),
    removeItem: (key) => mockStore.delete(key),
    clear: () => mockStore.clear()
};

test('storage - getHistory returns empty array when storage is empty', () => {
    localStorage.clear();
    assert.deepEqual(HistoryRepository.getHistory(), []);
});

test('storage - saveCalculation adds entry with timestamp and limits to 10 entries', () => {
    localStorage.clear();

    // Save 12 entries
    for (let i = 1; i <= 12; i++) {
        HistoryRepository.saveCalculation({ boxPrice: i * 10, totalValue: i * 15, currencySymbol: '€', isProfitable: true });
    }

    const history = HistoryRepository.getHistory();
    assert.equal(history.length, 10);
    // Most recent should be first (boxPrice: 120)
    assert.equal(history[0].boxPrice, 120);
    assert.ok(history[0].timestamp);
    assert.equal(history[9].boxPrice, 30);
});

test('storage - getHistory handles corrupted JSON gracefully', () => {
    localStorage.setItem('pokevalue_history', 'INVALID_JSON{');
    const history = HistoryRepository.getHistory();
    assert.deepEqual(history, []);
});

test('storage - clearHistory removes history from localStorage', () => {
    localStorage.clear();
    HistoryRepository.saveCalculation({ boxPrice: 100, totalValue: 150, currencySymbol: '€', isProfitable: true });
    assert.equal(HistoryRepository.getHistory().length, 1);

    HistoryRepository.clearHistory();
    assert.equal(HistoryRepository.getHistory().length, 0);
});
