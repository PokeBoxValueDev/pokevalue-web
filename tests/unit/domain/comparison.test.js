import test from 'node:test';
import assert from 'node:assert/strict';
import { ComparisonService } from '../../../src/domain/services/ComparisonService.js';

const mockItems = [
    { id: '1', name: 'Pase Remoto', name_es: 'Pase Remoto', name_en: 'Remote Pass', category: 'raid_passes', price_eur: 1.95, price_usd: 1.99, price_coins: 195 },
    { id: '2', name: 'Super Incubadora', name_es: 'Super Incubadora', name_en: 'Super Incubator', category: 'incubators', price_eur: 2.00, price_usd: 2.00, price_coins: 200 }
];

test('domain/comparison - Determina que Caja A es ganadora cuando tiene mayor porcentaje de ahorro', () => {
    // Caja A: 3 pases (5.85) por 3.00 -> 95% ahorro
    const boxA = { price: 3.00, quantities: { '1': 3 } };
    // Caja B: 1 pase (1.95) por 1.50 -> 30% ahorro
    const boxB = { price: 1.50, quantities: { '1': 1 } };

    const comp = ComparisonService.compare(boxA, boxB, mockItems, 'EUR', 'es');
    assert.equal(comp.winner, 'A');
    assert.ok(comp.diffPercent > 0);
    assert.equal(comp.resultA.isProfitable, true);
});

test('domain/comparison - Determina que Caja B es ganadora cuando Caja A no es rentable', () => {
    // Caja A: 1 incubadora (2.00) por 2.50 -> No rentable
    const boxA = { price: 2.50, quantities: { '2': 1 } };
    // Caja B: 2 incubadoras (4.00) por 3.00 -> Rentable (33.3% ahorro)
    const boxB = { price: 3.00, quantities: { '2': 2 } };

    const comp = ComparisonService.compare(boxA, boxB, mockItems, 'EUR', 'es');
    assert.equal(comp.winner, 'B');
    assert.equal(comp.resultA.isProfitable, false);
    assert.equal(comp.resultB.isProfitable, true);
});

test('domain/comparison - Determina EQUAL cuando ambas cajas ofrecen idéntico ahorro', () => {
    const boxA = { price: 2.00, quantities: { '2': 2 } };
    const boxB = { price: 2.00, quantities: { '2': 2 } };

    const comp = ComparisonService.compare(boxA, boxB, mockItems, 'EUR', 'es');
    assert.equal(comp.winner, 'EQUAL');
    assert.equal(comp.diffPercent, 0);
});
