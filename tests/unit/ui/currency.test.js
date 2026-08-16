import test from 'node:test';
import assert from 'node:assert/strict';
import { CurrencyController } from '../../../src/ui/controllers/CurrencyController.js';
import { state } from '../../../src/config/config.js';

test('ui/currency - detectCurrency detecta divisa regional (EUR/USD)', () => {
    const originalLanguage = globalThis.navigator?.language;
    const originalLanguages = globalThis.navigator?.languages;
    const originalStorage = globalThis.localStorage;

    globalThis.localStorage = { getItem: () => null, setItem: () => {} };

    // Estados Unidos -> USD
    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: 'en-US', configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: ['en-US'], configurable: true });
    } catch {
        // Fallback if navigator is not defineProperty configurable
    }
    assert.equal(CurrencyController.detectCurrency(), 'USD');

    // España -> EUR
    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: 'es-ES', configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: ['es-ES'], configurable: true });
    } catch {}
    assert.equal(CurrencyController.detectCurrency(), 'EUR');

    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: originalLanguage, configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: originalLanguages, configurable: true });
    } catch {}
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
