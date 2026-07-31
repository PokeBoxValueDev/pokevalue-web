import test from 'node:test';
import assert from 'node:assert/strict';
import { Category } from '../../../domain/valueObjects/Category.js';
import { ValuationService } from '../../../domain/services/ValuationService.js';

test('getCategoryKey - categorizes items correctly based on category property or name', () => {
    assert.equal(Category.normalizeKey('incubadoras'), 'incubadoras');
    assert.equal(Category.normalizeKey('PASES'), 'pases');

    assert.equal(Category.normalizeKey('Pase de Incursión'), 'pases');
    assert.equal(Category.normalizeKey('Raid Pass'), 'pases');
    assert.equal(Category.normalizeKey('Pass Remote'), 'pases');

    assert.equal(Category.normalizeKey('Incubadora Super'), 'incubadoras');
    assert.equal(Category.normalizeKey('Super Incubator'), 'incubadoras');

    assert.equal(Category.normalizeKey('Pocion Max'), 'consumibles');
    assert.equal(Category.normalizeKey('Max Revive'), 'consumibles');
    assert.equal(Category.normalizeKey('Health Potion'), 'consumibles');

    assert.equal(Category.normalizeKey('Huevo Suerte'), 'otros');
    assert.equal(Category.normalizeKey(''), 'otros');
    assert.equal(Category.normalizeKey(null), 'otros');
});

test('calculateResult - EUR currency profitable calculation', () => {
    const storeData = [
        { id: 1, name: 'Pase de Incursión', unit_price_eur: 1.00 },
        { id: 2, name: 'Incubadora', unit_price_eur: 1.50 }
    ];
    const quantities = { 1: 3, 2: 2 }; // 3*1 + 2*1.5 = 6.00
    const result = ValuationService.calculate(5.00, quantities, storeData, 'EUR');

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
    const result = ValuationService.calculate(2.00, quantities, storeData, 'EUR');

    assert.equal(result.diff, -1.00);
    assert.equal(result.isProfitable, false);
});

test('calculateResult - USD currency custom unit price handling', () => {
    const storeData = [
        { id: 1, name: 'Raid Pass', unit_price_usd: 1.25, unit_price_eur: 1.00 }
    ];
    const quantities = { 1: 2 }; // 2 * 1.25 = 2.50 USD
    const result = ValuationService.calculate(2.00, quantities, storeData, 'USD');

    assert.equal(result.totalValue, 2.50);
    assert.equal(result.isProfitable, true);
});

test('calculateResult - POKECOINS currency handling', () => {
    const storeData = [
        { id: 1, name: 'Pase', price_eur: 1.00 }
    ];
    const quantities = { 1: 10 };
    const result = ValuationService.calculate(1000, quantities, storeData, 'POKECOINS');

    assert.ok(result.totalValue > 0);
});

test('calculateResult - edge cases (zero quantity, missing item)', () => {
    const storeData = [{ id: 1, name: 'Pase', unit_price_eur: 1.00 }];
    const quantities = { 1: 0, 999: 5 };
    const result = ValuationService.calculate(5.00, quantities, storeData, 'EUR');

    assert.equal(result.totalValue, 0);
    assert.equal(result.diff, -5.00);
    assert.equal(result.isProfitable, false);
    assert.deepEqual(result.itemSummary, []);
});
