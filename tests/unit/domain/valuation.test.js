import test from 'node:test';
import assert from 'node:assert/strict';
import { ValuationService } from '../../../src/domain/services/ValuationService.js';

const mockItems = [
    { id: '1', name: 'Pase de incursión remota', name_es: 'Pase de incursión remota', name_en: 'Remote Raid Pass', category: 'raid_passes', price_eur: 1.95, price_usd: 1.99, price_coins: 195 },
    { id: '2', name: 'Super Incubadora', name_es: 'Super Incubadora', name_en: 'Super Incubator', category: 'incubators', price_eur: 2.00, price_usd: 2.00, price_coins: 200 },
    { id: '3', name: 'Trozo Estrella', name_es: 'Trozo Estrella', name_en: 'Star Piece', category: 'boosts', price_eur: 0.80, price_usd: 0.80, price_coins: 80 }
];

test('domain/valuation - Calcula oferta rentable y Grado S (ahorro >= 40%) en EUR', () => {
    // 5 pases (5 * 1.95 = 9.75) por 5.00 EUR -> Ahorro 4.75 EUR (48.7% -> Grado S)
    const result = ValuationService.calculate(5.00, { '1': 5 }, mockItems, 'EUR');
    
    assert.equal(result.isProfitable, true);
    assert.equal(result.totalValue, 9.75);
    assert.ok(Math.abs(result.diff - 4.75) < 0.001);
    assert.equal(result.grade, 'S');
    assert.ok(result.savingsPercent >= 40);
    assert.equal(result.itemSummary.length, 1);
});

test('domain/valuation - Calcula Grado A (20% - 39% de ahorro) en USD', () => {
    // 2 Super Incubadoras (2 * 2.00 = 4.00) por 3.20 USD -> Ahorro 0.80 USD (25% -> Grado A)
    const result = ValuationService.calculate(3.20, { '2': 2 }, mockItems, 'USD');
    
    assert.equal(result.isProfitable, true);
    assert.equal(result.totalValue, 4.00);
    assert.ok(Math.abs(result.diff - 0.80) < 0.001);
    assert.equal(result.grade, 'A');
});

test('domain/valuation - Calcula Grado B (5% - 19% de ahorro) en POKECOINS', () => {
    // 1 Super Incubadora (200) + 1 Trozo Estrella (80) = 280 monedas por 250 monedas -> Ahorro 30 (12% -> Grado B)
    const result = ValuationService.calculate(250, { '2': 1, '3': 1 }, mockItems, 'POKECOINS');
    
    assert.equal(result.isProfitable, true);
    assert.equal(result.totalValue, 280);
    assert.equal(result.diff, 30);
    assert.equal(result.grade, 'B');
});

test('domain/valuation - Calcula Grado F para ofertas no rentables o con ahorro < 5%', () => {
    // 1 Trozo Estrella (0.80) por 1.50 EUR -> Pérdida de 0.70 EUR (Grado F)
    const result = ValuationService.calculate(1.50, { '3': 1 }, mockItems, 'EUR');
    
    assert.equal(result.isProfitable, false);
    assert.equal(result.totalValue, 0.80);
    assert.ok(Math.abs(result.diff - (-0.70)) < 0.001);
    assert.equal(result.grade, 'F');
});

test('domain/valuation - Casos límite (precio 0 o cantidades vacías)', () => {
    // Sin objetos seleccionados
    const emptyResult = ValuationService.calculate(10.00, {}, mockItems, 'EUR');
    assert.equal(emptyResult.totalValue, 0);
    assert.equal(emptyResult.isProfitable, false);
    assert.equal(emptyResult.grade, 'F');

    // Cantidades gigantes (9999)
    const massiveResult = ValuationService.calculate(1000, { '1': 9999 }, mockItems, 'EUR');
    assert.ok(massiveResult.totalValue > 10000);
    assert.equal(massiveResult.isProfitable, true);
});

test('domain/valuation - Extrae métricas clave (KVI: Coste Efectivo por objeto importante)', () => {
    // 5 pases de incursión por 5.00 EUR -> Coste efectivo = 1.00 EUR/unidad (precio habitual 1.95)
    const result = ValuationService.calculate(5.00, { '1': 5 }, mockItems, 'EUR');
    
    assert.ok(result.keyMetrics && result.keyMetrics.length > 0);
    const metric = result.keyMetrics[0];
    assert.equal(metric.count, 5);
    assert.ok(Math.abs(metric.effectiveUnitPrice - 1.00) < 0.001);
    assert.equal(metric.standardUnitPrice, 1.95);
});
