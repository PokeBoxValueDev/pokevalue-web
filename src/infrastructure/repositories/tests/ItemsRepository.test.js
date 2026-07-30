import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemsRepository } from '../ItemsRepository.js';

test('infrastructure/ItemsRepository - instance method getItems fetches and maps fallback data', async () => {
    const repo = new ItemsRepository();
    const { items } = await repo.getItems();

    assert.ok(Array.isArray(items), 'getItems() should return an array');
    assert.ok(items.length > 0, 'getItems() should return at least 1 item');

    const firstItem = items[0];
    assert.ok(firstItem.id, 'Item must have an id');
    assert.ok(typeof firstItem.calculateUnitPrice === 'function', 'Item must have calculateUnitPrice method');
});

test('infrastructure/ItemsRepository - static method ItemsRepository.getItems operates correctly', async () => {
    const { items } = await ItemsRepository.getItems();

    assert.ok(Array.isArray(items));
    assert.ok(items.length > 0);
});

test('infrastructure/ItemsRepository - handles network error and recovers via fallback', async () => {
    // Probar pasando una URL inválida para forzar el fallo de red
    const repo = new ItemsRepository('https://invalid-domain-xyz-123456789.com/items.json');
    const { items } = await repo.getItems();

    assert.ok(Array.isArray(items), 'Should recover via local fallback file when network fails');
    assert.ok(items.length > 0, 'Fallback items array must not be empty');
});
