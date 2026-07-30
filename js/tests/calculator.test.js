import test from 'node:test';
import assert from 'node:assert/strict';
import { getCategoryKey, calculateResult } from '../calculator.js';

test('getCategoryKey - categorizes items correctly based on category property or name', () => {
    assert.equal(getCategoryKey({ category: 'incubadoras' }), 'incubadoras');
    assert.equal(getCategoryKey({ category: 'PASES' }), 'pases');

    assert.equal(getCategoryKey({ name: 'Pase de Incursión' }), 'pases');
    assert.equal(getCategoryKey({ name: 'Raid Pass' }), 'pases');
    assert.equal(getCategoryKey({ name: 'Pass Remote' }), 'pases');

    assert.equal(getCategoryKey({ name: 'Incubadora Super' }), 'incubadoras');
    assert.equal(getCategoryKey({ name: 'Super Incubator' }), 'incubadoras');

    assert.equal(getCategoryKey({ name: 'Pocion Max' }), 'consumibles');
    assert.equal(getCategoryKey({ name: 'Max Revive' }), 'consumibles');
    assert.equal(getCategoryKey({ name: 'Health Potion' }), 'consumibles');

    assert.equal(getCategoryKey({ name: 'Huevo Suerte' }), 'otros');
    assert.equal(getCategoryKey({ name: '' }), 'otros');
    assert.equal(getCategoryKey({}), 'otros');
    assert.equal(getCategoryKey(null), 'otros');
});

test('calculateResult - EUR currency profitable calculation', () => {
    const storeData = [
        { id: 1, name: 'Pase de Incursión', unit_price_eur: 1.00 },
        { id: 2, name: 'Incubadora', unit_price_eur: 1.50 }
    ];
    const quantities = { 1: 3, 2: 2 }; // 3*1 + 2*1.5 = 6.00
    const result = calculateResult(5.00, quantities, storeData, 'EUR');

    assert.equal(result.boxPrice, 5.00);
    assert.equal(result.totalValue, 6.00);
    assert.equal(result.diff, 1.00);
    assert.equal(result.isProfitable, true);
    assert.equal(result.savingsPercent, 20);
    assert.equal(result.categoryTotals.pases, 3.00);
    assert.equal(result.categoryTotals.incubadoras, 3.00);
    assert.deepEqual(result.itemSummary, ['3x Pase de Incursión', '2x Incubadora']);
});

test('calculateResult - EUR currency non-profitable calculation', () => {
    const storeData = [
        { id: 1, name: 'Pase de Incursión', unit_price_eur: 1.00 }
    ];
    const quantities = { 1: 1 };
    const result = calculateResult(2.00, quantities, storeData, 'EUR');

    assert.equal(result.diff, -1.00);
    assert.equal(result.isProfitable, false);
});

test('calculateResult - USD currency custom unit price handling', () => {
    const storeData = [
        { id: 1, name: 'Raid Pass', unit_price_usd: 1.25, unit_price_eur: 1.00 }
    ];
    const quantities = { 1: 2 }; // 2 * 1.25 = 2.50 USD
    const result = calculateResult(2.00, quantities, storeData, 'USD');

    assert.equal(result.totalValue, 2.50);
    assert.equal(result.isProfitable, true);
});

test('calculateResult - POKECOINS currency handling', () => {
    const storeData = [
        { id: 1, name: 'Pase', price_eur: 1.00 }
    ];
    const quantities = { 1: 10 };
    const result = calculateResult(1000, quantities, storeData, 'POKECOINS');

    assert.ok(result.totalValue > 0);
});

test('calculateResult - edge cases (zero quantity, missing item)', () => {
    const storeData = [{ id: 1, name: 'Pase', unit_price_eur: 1.00 }];
    const quantities = { 1: 0, 999: 5 };
    const result = calculateResult(5.00, quantities, storeData, 'EUR');

    assert.equal(result.totalValue, 0);
    assert.equal(result.diff, -5.00);
    assert.equal(result.isProfitable, false);
    assert.deepEqual(result.itemSummary, []);
});
