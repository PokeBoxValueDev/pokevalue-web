import test from 'node:test';
import assert from 'node:assert/strict';
import { renderItems, toggleCategoryFilter } from '../../src/ui/components/ItemCardRenderer.js';
import { ItemMapper } from '../../src/infrastructure/mappers/ItemMapper.js';
import { state } from '../../src/config/config.js';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

test('visual/category-filter - Consumibles filter and all category pills filter items correctly without empty results', () => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <div id="category-filter-pills">
                <button type="button" class="category-pill" data-category="all">Todos</button>
                <button type="button" class="category-pill" data-category="pases">Pases</button>
                <button type="button" class="category-pill" data-category="incubadoras">Incubadoras</button>
                <button type="button" class="category-pill" data-category="potenciadores">Potenciadores</button>
                <button type="button" class="category-pill" data-category="mejoras">Mejoras</button>
                <button type="button" class="category-pill" data-category="combates">Combates</button>
                <button type="button" class="category-pill" data-category="consumibles">Consumibles</button>
                <button type="button" class="category-pill" data-category="otros">Otros</button>
            </div>
            <input id="search-input" value="" />
            <div id="items-container"></div>
        </body>
        </html>
    `);

    globalThis.document = dom.window.document;
    globalThis.window = dom.window;
    globalThis.CustomEvent = dom.window.CustomEvent;

    const rawData = JSON.parse(fs.readFileSync(path.resolve('src/assets/items-fallback.json'), 'utf8'));
    const domainItems = ItemMapper.toDomainList(rawData);

    state.setStoreData(domainItems);
    renderItems(domainItems);

    const container = document.getElementById('items-container');

    // 1. Verify consumibles group exists
    const consumiblesGroup = container.querySelector('.category-group[data-category="consumibles"]');
    assert.ok(consumiblesGroup, 'Category group for consumibles must exist in DOM');

    const consumableCards = consumiblesGroup.querySelectorAll('.item-card');
    assert.equal(consumableCards.length, 4, 'Must have 4 consumable items (Max Revive, Max Potion, Silver Pinap, Golden Razz)');

    // 2. Select 'consumibles' filter
    toggleCategoryFilter('consumibles');

    // Consumibles group must be visible, others hidden
    assert.ok(!consumiblesGroup.classList.contains('hidden'), 'Consumibles group must NOT be hidden');
    consumableCards.forEach(card => {
        assert.ok(!card.classList.contains('hidden'), `Item card ${card.getAttribute('data-item-name')} must be visible`);
    });

    const pasesGroup = container.querySelector('.category-group[data-category="pases"]');
    assert.ok(pasesGroup.classList.contains('hidden'), 'Pases group must be hidden when consumibles is active');

    // 3. Deselect consumibles and select 'combates' filter
    toggleCategoryFilter('consumibles'); // toggles off consumibles
    toggleCategoryFilter('combates'); // toggles on combates
    const combatesGroup = container.querySelector('.category-group[data-category="combates"]');
    assert.ok(combatesGroup, 'Combates group must exist');
    assert.ok(!combatesGroup.classList.contains('hidden'), 'Combates group must be visible when combates filter is active');
    assert.ok(consumiblesGroup.classList.contains('hidden'), 'Consumibles group must be hidden when only combates is active');

    // 4. Switch back to 'all'
    toggleCategoryFilter('all');
    assert.ok(!consumiblesGroup.classList.contains('hidden'), 'Consumibles group must be visible when all is active');
    assert.ok(!combatesGroup.classList.contains('hidden'), 'Combates group must be visible when all is active');
    assert.ok(!pasesGroup.classList.contains('hidden'), 'Pases group must be visible when all is active');
});
