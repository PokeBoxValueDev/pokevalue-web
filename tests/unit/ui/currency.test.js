import test from 'node:test';
import assert from 'node:assert/strict';
import { CurrencyController } from '../../../src/ui/controllers/CurrencyController.js';
import { state } from '../../../src/config/config.js';

test('ui/currency - detectCurrency detecta divisa regional (EUR/USD)', () => {
    const originalNavigator = globalThis.navigator;
    const originalStorage = globalThis.localStorage;

    globalThis.localStorage = { getItem: () => null, setItem: () => {} };

    // Estados Unidos -> USD
    globalThis.navigator = { language: 'en-US' };
    assert.equal(CurrencyController.detectCurrency(), 'USD');

    // España -> EUR
    globalThis.navigator = { language: 'es-ES' };
    assert.equal(CurrencyController.detectCurrency(), 'EUR');

    globalThis.navigator = originalNavigator;
    globalThis.localStorage = originalStorage;
});

test('ui/currency - setCurrency actualiza el estado y configuración de moneda', () => {
    state.setCurrency('USD');
    assert.equal(state.currentCurrency, 'USD');

    state.setCurrency('EUR');
    assert.equal(state.currentCurrency, 'EUR');

    state.setCurrency('POKECOINS');
    assert.equal(state.currentCurrency, 'POKECOINS');
});
