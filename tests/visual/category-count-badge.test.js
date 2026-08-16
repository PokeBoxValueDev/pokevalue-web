import test from 'node:test';
import assert from 'node:assert/strict';
import { renderItems } from '../../src/ui/components/ItemCardRenderer.js';
import { state } from '../../src/config/config.js';
import { JSDOM } from 'jsdom';

test('visual/category-badge - Category count badge shows 0/N initially and updates dynamically when items have data', () => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <div id="items-container"></div>
            <input id="search-input" value="" />
        </body>
        </html>
    `);

    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.CustomEvent = dom.window.CustomEvent;

    const mockItems = [
        { id: 'raid_remote', name_es: 'Pase Remoto', category: 'pases', unit_price_eur: 1.95 },
        { id: 'raid_premium', name_es: 'Pase Prémium', category: 'pases', unit_price_eur: 1.00 },
        { id: 'incubator_super', name_es: 'Súper Incubadora', category: 'incubadoras', unit_price_eur: 2.00 }
    ];

    state.setStoreData(mockItems);
    renderItems(mockItems);

    const container = document.getElementById('items-container');
    const pasesGroup = container.querySelector('.category-group[data-category="pases"]');
    const pasesBadge = pasesGroup.querySelector('.category-count-badge');

    const incubadorasGroup = container.querySelector('.category-group[data-category="incubadoras"]');
    const incubadorasBadge = incubadorasGroup.querySelector('.category-count-badge');

    // 1. Initial State: 0/2 for pases, 0/1 for incubadoras
    assert.equal(pasesBadge.textContent.trim(), '0/2', 'Pases category badge must start at 0/2');
    assert.equal(incubadorasBadge.textContent.trim(), '0/1', 'Incubadoras category badge must start at 0/1');

    // 2. Increment first pass (+1)
    const remoteInput = pasesGroup.querySelector('input[data-id="raid_remote"]');
    remoteInput.value = '1';
    remoteInput.dispatchEvent(new dom.window.Event('input'));

    assert.equal(pasesBadge.textContent.trim(), '1/2', 'Pases badge must update to 1/2 when 1 item has quantity > 0');
    assert.equal(incubadorasBadge.textContent.trim(), '0/1', 'Incubadoras badge must remain 0/1');

    // 3. Increment second pass (+3)
    const premiumInput = pasesGroup.querySelector('input[data-id="raid_premium"]');
    premiumInput.value = '3';
    premiumInput.dispatchEvent(new dom.window.Event('input'));

    assert.equal(pasesBadge.textContent.trim(), '2/2', 'Pases badge must update to 2/2 when both items have quantity > 0');

    // 4. Increment incubadora (+1)
    const incubatorInput = incubadorasGroup.querySelector('input[data-id="incubator_super"]');
    incubatorInput.value = '1';
    incubatorInput.dispatchEvent(new dom.window.Event('input'));

    assert.equal(incubadorasBadge.textContent.trim(), '1/1', 'Incubadoras badge must update to 1/1');

    // 5. Decrement one pass back to 0
    remoteInput.value = '0';
    remoteInput.dispatchEvent(new dom.window.Event('input'));

    assert.equal(pasesBadge.textContent.trim(), '1/2', 'Pases badge must drop back to 1/2 when an item is set to 0');
});
