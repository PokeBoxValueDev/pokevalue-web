import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_VERSION, JSON_URL, FALLBACK_JSON_URL, CURRENCY_CONFIG, CATEGORY_CONFIG, state } from '../config.js';

test('config - exports valid constants', () => {
    assert.ok(typeof APP_VERSION === 'string' && APP_VERSION.length > 0);
    assert.ok(JSON_URL.includes('https://'));
    assert.equal(FALLBACK_JSON_URL, 'src/assets/items-fallback.json');
});

test('config - CURRENCY_CONFIG contains required currencies', () => {
    assert.ok(CURRENCY_CONFIG.EUR);
    assert.ok(CURRENCY_CONFIG.USD);
    assert.ok(CURRENCY_CONFIG.POKECOINS);

    assert.equal(CURRENCY_CONFIG.EUR.rate, 1);
    assert.equal(CURRENCY_CONFIG.EUR.symbol, '€');

    assert.ok(CURRENCY_CONFIG.USD.rate > 0);
    assert.equal(CURRENCY_CONFIG.USD.symbol, '$');

    assert.ok(CURRENCY_CONFIG.POKECOINS.rate > 0);
    assert.equal(CURRENCY_CONFIG.POKECOINS.symbol, '🟡');
});

test('config - CATEGORY_CONFIG contains styling for all main categories', () => {
    const requiredCategories = ['pases', 'incubadoras', 'potenciadores', 'mejoras', 'combates', 'otros'];
    requiredCategories.forEach(cat => {
        assert.ok(CATEGORY_CONFIG[cat], `Missing category config for ${cat}`);
        assert.ok(CATEGORY_CONFIG[cat].color, `Missing color for ${cat}`);
        assert.ok(CATEGORY_CONFIG[cat].label, `Missing label for ${cat}`);
        assert.ok(CATEGORY_CONFIG[cat].bg, `Missing bg for ${cat}`);
        assert.ok(CATEGORY_CONFIG[cat].text, `Missing text for ${cat}`);
    });
});

test('config - state object initializes correctly', () => {
    assert.ok(Array.isArray(state.storeData));
    assert.ok(['EUR', 'USD', 'POKECOINS'].includes(state.currentCurrency));
    assert.ok(['es', 'en'].includes(state.currentLang));
    assert.equal(typeof state.lastCalculationText, 'string');
});
