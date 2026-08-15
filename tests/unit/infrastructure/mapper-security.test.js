import test from 'node:test';
import assert from 'node:assert/strict';
import { ItemMapper } from '../../../src/infrastructure/mappers/ItemMapper.js';

test('infrastructure/security - ItemMapper sanitiza SVGs eliminando scripts y manejadores onload', () => {
    const maliciousSvg = '<svg viewBox="0 0 100 100"><script>alert("XSS")</script><circle onload="alert(1)" cx="50" cy="50" r="40"/></svg>';
    const sanitized = ItemMapper.sanitizeSvg(maliciousSvg);

    assert.ok(!sanitized.includes('<script>'), 'Debe eliminar etiquetas script');
    assert.ok(!sanitized.includes('onload='), 'Debe eliminar manejadores de eventos en línea');
    assert.ok(sanitized.includes('<circle'), 'Debe preservar elementos SVG legítimos');
});

test('infrastructure/security - ItemMapper escapa caracteres peligrosos en nombres y campos de texto', () => {
    const dangerousInput = '<img src=x onerror="alert(1)"> Test Item & Co "Special"';
    const escaped = ItemMapper.escapeHtml(dangerousInput);

    assert.ok(!escaped.includes('<img'), 'Debe escapar < y >');
    assert.ok(escaped.includes('&amp;'), 'Debe escapar &');
    assert.ok(escaped.includes('&quot;'), 'Debe escapar comillas dobles');
});

test('infrastructure/mapper - ItemMapper normaliza esquemas externos corruptos o con campos faltantes', () => {
    const corruptItem = { id: '99', name: 'Objeto Test' };
    const mapped = ItemMapper.toDomain(corruptItem);

    assert.equal(mapped.id, '99');
    assert.equal(typeof mapped.nameEs, 'string');
    assert.equal(typeof mapped.unitPriceEur, 'number');
    assert.equal(typeof mapped.category, 'string');
});
