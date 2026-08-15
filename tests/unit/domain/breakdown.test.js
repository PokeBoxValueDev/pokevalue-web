import test from 'node:test';
import assert from 'node:assert/strict';
import { Category } from '../../../src/domain/valueObjects/Category.js';
import { ValuationService } from '../../../src/domain/services/ValuationService.js';

test('domain/breakdown - Categoriza correctamente por propiedad category y por fallback de nombre', () => {
    assert.equal(Category.normalizeKey('raid_passes'), 'pases');
    assert.equal(Category.normalizeKey('incubators'), 'incubadoras');
    assert.equal(Category.normalizeKey('booster'), 'potenciadores');
    assert.equal(Category.normalizeKey('upgrade'), 'mejoras');
    assert.equal(Category.normalizeKey('potion'), 'consumibles');
    assert.equal(Category.normalizeKey('other'), 'otros');

    // Fallbacks por palabras clave
    assert.equal(Category.normalizeKey('Pase de incursión'), 'pases');
    assert.equal(Category.normalizeKey('Super Incubadora'), 'incubadoras');
    assert.equal(Category.normalizeKey('Trozo Estrella Potenciador'), 'potenciadores');
    assert.equal(Category.normalizeKey('Poción Máxima'), 'consumibles');
});

test('domain/breakdown - Genera desglose de valor con totales acumulados por categoría', () => {
    const mockItems = [
        { id: '1', name: 'Pase', category: 'raid_passes', price_eur: 2.00 },
        { id: '2', name: 'Incubadora', category: 'incubators', price_eur: 3.00 }
    ];

    const res = ValuationService.calculate(4.00, { '1': 1, '2': 1 }, mockItems, 'EUR');
    assert.equal(res.categoryTotals.pases, 2.00);
    assert.equal(res.categoryTotals.incubadoras, 3.00);
    assert.equal(res.totalValue, 5.00);
});
