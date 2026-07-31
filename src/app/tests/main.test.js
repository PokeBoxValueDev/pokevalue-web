import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemsRepository } from '../../infrastructure/repositories/ItemsRepository.js';
import { state } from '../../config/config.js';
import { renderItems } from '../../ui/components/ItemCardRenderer.js';
import { setLanguage } from '../../i18n/i18n.js';

test('app integration - repository data loading flow populates state and renders UI without runtime errors', async () => {
    // 1. Verificar que ItemsRepository.getItems() funciona correctamente sin arrojar TypeError
    assert.equal(typeof ItemsRepository.getItems, 'function', 'ItemsRepository.getItems must be a function');
    assert.equal(typeof (new ItemsRepository()).getItems, 'function', 'repository.getItems must be a function');

    const repo = new ItemsRepository();
    const { items, lastUpdated } = await repo.getItems();

    assert.ok(Array.isArray(items), 'repository items must be an array');
    assert.ok(items.length > 0, 'repository items array must not be empty');

    // 2. Probar la asignación al estado global de la aplicación
    state.storeData = items;
    assert.equal(state.storeData.length, items.length);

    // 3. Probar que renderItems procesa las entidades de dominio sin error
    const mockContainer = {
        id: 'items-container',
        innerHTML: '',
        querySelectorAll: () => []
    };

    globalThis.document = {
        getElementById: (id) => id === 'items-container' ? mockContainer : null
    };

    setLanguage('es');
    renderItems(state.storeData);

    assert.ok(!mockContainer.innerHTML.includes('Error al cargar datos'), 'UI should not contain error message after successful load');
    assert.ok(mockContainer.innerHTML.includes('Pase'), 'UI should render items correctly');
});
