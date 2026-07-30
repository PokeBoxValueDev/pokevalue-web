import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemsRepository } from '../../src/infrastructure/repositories/ItemsRepository.js';
import { Item } from '../../src/domain/models/Item.js';

test('infrastructure/ItemsRepository - instance method getItems fetches and maps fallback data', async () => {
    const repository = new ItemsRepository();
    
    // Simular o usar fetch local
    const result = await repository.getItems();

    assert.ok(result, 'getItems should return a result object');
    assert.ok(Array.isArray(result.items), 'result.items should be an array');
    assert.ok(result.items.length > 0, 'result.items should contain domain items');
    assert.ok(result.items[0] instanceof Item, 'Each element should be an instance of Item domain model');
    assert.ok(typeof result.lastUpdated === 'string', 'lastUpdated should be a string');
});

test('infrastructure/ItemsRepository - static method ItemsRepository.getItems operates correctly', async () => {
    const result = await ItemsRepository.getItems();

    assert.ok(result, 'Static getItems should return a result object');
    assert.ok(Array.isArray(result.items), 'Static getItems items should be an array');
    assert.ok(result.items.length > 0, 'Static getItems should return populated array');
    assert.ok(result.items[0] instanceof Item, 'Items should be Item domain instances');
});

test('infrastructure/ItemsRepository - handles network error and recovers via fallback', async () => {
    // Pasar una URL inválida para forzar la estrategia de resiliencia y verificar que recupera del fallback sin lanzar error
    const repository = new ItemsRepository('https://invalid-domain-that-does-not-exist.test/bad.json');
    const result = await repository.getItems();

    assert.ok(result, 'Should recover via fallback when primary URL fails');
    assert.ok(Array.isArray(result.items), 'Fallback should return array of items');
    assert.ok(result.items.length > 0, 'Fallback items array should not be empty');
});
