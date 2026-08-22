import test from 'node:test';
import assert from 'node:assert/strict';
import { HistoryRepository } from '../../../src/infrastructure/repositories/HistoryRepository.js';

test('infrastructure/history - Inserta cálculo en localStorage y rota limitando a 10 elementos', () => {
    const mockStorage = new Map();
    globalThis.localStorage = {
        getItem: (k) => mockStorage.get(k) || null,
        setItem: (k, v) => mockStorage.set(k, String(v)),
        removeItem: (k) => mockStorage.delete(k)
    };

    HistoryRepository.clearHistory();

    for (let i = 1; i <= 15; i++) {
        HistoryRepository.saveCalculation({ boxPrice: i, totalValue: i * 2, diff: i, isProfitable: true, currencySymbol: '€', items: [] });
    }

    const history = HistoryRepository.getHistory();
    assert.equal(history.length, 10, 'El historial debe mantenerse en un máximo de 10 elementos');
    assert.equal(history[0].boxPrice, 15, 'El primer elemento debe ser el más reciente');
});

test('infrastructure/history - Se recupera con gracia ante JSON corrupto en localStorage', () => {
    const mockStorage = new Map();
    mockStorage.set('pokevalue_history', '{{corrupt_json');
    globalThis.localStorage = {
        getItem: (k) => mockStorage.get(k) || null,
        setItem: (k, v) => mockStorage.set(k, String(v)),
        removeItem: (k) => mockStorage.delete(k)
    };

    const history = HistoryRepository.getHistory();
    assert.deepEqual(history, [], 'Ante JSON corrupto debe retornar un array vacío sin lanzar excepciones');
});

test('infrastructure/history - Elimina un cálculo individual por índice correctamente', () => {
    const mockStorage = new Map();
    globalThis.localStorage = {
        getItem: (k) => mockStorage.get(k) || null,
        setItem: (k, v) => mockStorage.set(k, String(v)),
        removeItem: (k) => mockStorage.delete(k)
    };

    HistoryRepository.clearHistory();
    HistoryRepository.saveCalculation({ boxPrice: 10, totalValue: 20, diff: 10, isProfitable: true, currencySymbol: '€', items: [] });
    HistoryRepository.saveCalculation({ boxPrice: 20, totalValue: 40, diff: 20, isProfitable: true, currencySymbol: '€', items: [] });

    assert.equal(HistoryRepository.getHistory().length, 2);
    
    // Eliminar el primer elemento (índice 0, que es el de boxPrice 20)
    const success = HistoryRepository.deleteCalculation(0);
    assert.equal(success, true);
    const updated = HistoryRepository.getHistory();
    assert.equal(updated.length, 1);
    assert.equal(updated[0].boxPrice, 10);
});
