import test from 'node:test';
import assert from 'node:assert/strict';
import { Item } from '../../src/domain/models/Item.js';
import { CalculationResult } from '../../src/domain/models/CalculationResult.js';
import { Category } from '../../src/domain/valueObjects/Category.js';
import { ValuationService } from '../../src/domain/services/ValuationService.js';

test('domain/Item - constructs and calculates unit prices correctly', () => {
    const item = new Item({
        id: 'pass_1',
        nameEs: 'Pase de Incursión',
        nameEn: 'Raid Pass',
        category: 'pases',
        unitPriceEur: 1.00,
        unitPriceUsd: 1.20,
        unitPriceCoins: 100
    });

    assert.equal(item.getLocalizedName('es'), 'Pase de Incursión');
    assert.equal(item.getLocalizedName('en'), 'Raid Pass');

    assert.equal(item.calculateUnitPrice('EUR', { EUR: { rate: 1 } }), 1.00);
    assert.equal(item.calculateUnitPrice('USD', { USD: { rate: 1.08 } }), 1.20);
    assert.equal(item.calculateUnitPrice('POKECOINS', { POKECOINS: { rate: 110 } }), 100);
});

test('domain/Category - normalizes categories and maps i18n keys correctly', () => {
    assert.equal(Category.normalizeKey('Raid Pass'), 'pases');
    assert.equal(Category.normalizeKey('Super Incubator'), 'incubadoras');
    assert.equal(Category.normalizeKey('Revive'), 'consumibles');
    assert.equal(Category.normalizeKey('unknown_category'), 'otros');

    assert.equal(Category.getI18nKey('pases'), 'catPases');
    assert.equal(Category.getI18nKey('incubadoras'), 'catIncubadoras');
    assert.equal(Category.getI18nKey('consumibles'), 'catConsumibles');
});

test('domain/ValuationService - calculates box valuation and returns CalculationResult entity', () => {
    const items = [
        new Item({ id: '1', nameEs: 'Pase', category: 'pases', unitPriceEur: 1.00 }),
        new Item({ id: '2', nameEs: 'Incubadora', category: 'incubadoras', unitPriceEur: 1.50 })
    ];

    const result = ValuationService.calculate(5.00, { '1': 3, '2': 2 }, items, 'EUR', 'es');

    assert.ok(result instanceof CalculationResult);
    assert.equal(result.boxPrice, 5.00);
    assert.equal(result.totalValue, 6.00);
    assert.equal(result.diff, 1.00);
    assert.equal(result.isProfitable, true);
    assert.equal(result.categoryTotals.pases, 3.00);
    assert.equal(result.categoryTotals.incubadoras, 3.00);
    assert.deepEqual(result.itemSummary, ['3x Pase', '2x Incubadora']);
});
