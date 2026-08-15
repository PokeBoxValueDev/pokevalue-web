import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ItemMapper } from '../../src/infrastructure/mappers/ItemMapper.js';
import { Item } from '../../src/domain/models/Item.js';

test('contract/items - local items-fallback.json adheres to expected contract structure', () => {
    const jsonPath = path.resolve('src/assets/items-fallback.json');
    const content = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(content);

    assert.ok(data && typeof data === 'object', 'Fallback JSON must be a valid object');
    assert.ok(data.last_updated, 'Fallback JSON must contain last_updated field');

    const itemsList = data.objetos || data.items || data.store_items;
    assert.ok(Array.isArray(itemsList) && itemsList.length > 0, 'Fallback JSON must contain a non-empty list of items');

    itemsList.forEach((dto, index) => {
        assert.ok(dto.id, `Item DTO at index ${index} must have an "id"`);
        assert.ok(dto.name_es || dto.name, `Item DTO at index ${index} must have a name ("name_es" or "name")`);
        assert.ok(dto.unit_price_eur !== undefined || dto.price_eur !== undefined, `Item DTO at index ${index} must have EUR unit price`);
    });
});

test('contract/items - ItemMapper decouples domain from external JSON schema variations', () => {
    // Variation 1: Standard objects array
    const schema1 = {
        last_updated: '2026-07-30',
        objetos: [
            { id: 'remota', name_es: 'Pase Remoto', name_en: 'Remote Pass', category: 'pases', unit_price_eur: 1.65, unit_price_coins: 180 }
        ]
    };

    // Variation 2: Alternative field names (store_items, price_eur, nombre)
    const schema2 = {
        updated_at: '2026-07-30',
        store_items: [
            { id: 'remota_alt', name: 'Pase Alt', category: 'raid', price_eur: 2.00, price_usd: 2.15 }
        ]
    };

    // Variation 3: Plain array of objects
    const schema3 = [
        { id: 'incubator', name_es: 'Incubadora', category: 'incubadoras', unit_price_eur: 1.10 }
    ];

    const domainList1 = ItemMapper.toDomainList(schema1);
    const domainList2 = ItemMapper.toDomainList(schema2);
    const domainList3 = ItemMapper.toDomainList(schema3);

    assert.equal(domainList1.length, 1);
    assert.ok(domainList1[0] instanceof Item);
    assert.equal(domainList1[0].id, 'remota');
    assert.equal(domainList1[0].unitPriceEur, 1.65);
    assert.equal(domainList1[0].unitPriceCoins, 180);

    assert.equal(domainList2.length, 1);
    assert.ok(domainList2[0] instanceof Item);
    assert.equal(domainList2[0].id, 'remota_alt');
    assert.equal(domainList2[0].category, 'pases'); // Category normalized from 'raid' to 'pases'
    assert.equal(domainList2[0].unitPriceEur, 2.00);
    assert.equal(domainList2[0].unitPriceUsd, 2.15);

    assert.equal(domainList3.length, 1);
    assert.ok(domainList3[0] instanceof Item);
    assert.equal(domainList3[0].id, 'incubator');
    assert.equal(domainList3[0].category, 'incubadoras');
});

test('contract/items - ItemMapper handles corrupt or missing data gracefully', () => {
    assert.deepEqual(ItemMapper.toDomainList(null), []);
    assert.deepEqual(ItemMapper.toDomainList(undefined), []);
    assert.deepEqual(ItemMapper.toDomainList({}), []);

    const invalidItem = ItemMapper.toDomain(null, 5);
    assert.equal(invalidItem.id, 'item-5');
    assert.equal(invalidItem.nameEs, 'Objeto');
    assert.equal(invalidItem.unitPriceEur, 0);
});

test('security - ItemMapper.sanitizeSvg strips script tags and event handlers to prevent XSS', () => {
    const maliciousSvg = '<svg onload="alert(1)"><script>alert("xss")</script><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(2)</script></body></foreignObject><animate onbegin="alert(3)"/><circle cx="10" cy="10" r="5" onclick="bad()"/><a href="javascript:alert(4)"/><a xlink:href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=="/></svg>';
    const cleanSvg = ItemMapper.sanitizeSvg(maliciousSvg);

    assert.equal(cleanSvg.includes('<script>'), false);
    assert.equal(cleanSvg.includes('foreignObject'), false);
    assert.equal(cleanSvg.includes('onload='), false);
    assert.equal(cleanSvg.includes('onclick='), false);
    assert.equal(cleanSvg.includes('onbegin='), false);
    assert.equal(cleanSvg.includes('javascript:'), false);
    assert.equal(cleanSvg.includes('data:text/html'), false);
    assert.ok(cleanSvg.includes('<circle cx="10" cy="10" r="5" />') || cleanSvg.includes('<circle'));
});

test('security - ItemMapper.escapeHtml neutralizes dangerous HTML characters in item fields', () => {
    const input = '<img src=x onerror="alert(1)"> & "hello" \'world\'';
    const escaped = ItemMapper.escapeHtml(input);

    assert.equal(escaped.includes('<img'), false);
    assert.equal(escaped.includes('&lt;img'), true);
    assert.equal(escaped.includes('&quot;hello&quot;'), true);
    assert.equal(escaped.includes('&#039;world&#039;'), true);

    const maliciousDto = {
        id: '<script>alert(1)</script>',
        name_es: '<b onmouseover="bad()">Pase Peligroso</b>',
        name_en: '<marquee>Attack</marquee>'
    };
    const domainItem = ItemMapper.toDomain(maliciousDto);

    assert.equal(domainItem.id.includes('<script>'), false);
    assert.equal(domainItem.nameEs.includes('<b'), false);
    assert.equal(domainItem.nameEn.includes('<marquee'), false);
});

