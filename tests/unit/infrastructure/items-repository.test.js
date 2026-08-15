import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemsRepository } from '../../../src/infrastructure/repositories/ItemsRepository.js';

test('infrastructure/items-repository - Recupera datos usando fallback local si falla la red', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
        throw new Error('Network offline simulation');
    };

    try {
        const result = await ItemsRepository.getItems();
        assert.ok(result && Array.isArray(result.items), 'Debe devolver un objeto con propiedad items');
        assert.ok(result.items.length > 0, 'El array de items no debe estar vacío');
        assert.ok(result.items[0].nameEs || result.items[0].nameEn, 'Cada objeto debe tener nombre');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

test('infrastructure/items-repository - Maneja respuestas no-OK (HTTP 500) recuperando fallback', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        json: async () => ({})
    });

    try {
        const repo = new ItemsRepository();
        const result = await repo.getItems();
        assert.ok(result && Array.isArray(result.items));
        assert.ok(result.items.length > 0);
    } finally {
        globalThis.fetch = originalFetch;
    }
});
