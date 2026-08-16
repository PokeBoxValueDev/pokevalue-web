import test from 'node:test';
import assert from 'node:assert/strict';
import { renderItems, applyFilters, toggleCategoryFilter } from '../../src/ui/components/ItemCardRenderer.js';
import { ItemMapper } from '../../src/infrastructure/mappers/ItemMapper.js';
import { state } from '../../src/config/config.js';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

test('visual/search - Accent-insensitive search finds items by partial query (incur, incu, pokemon)', () => {
    toggleCategoryFilter('all');
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
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
    const searchInput = document.getElementById('search-input');

    // 1. Search 'incur' -> should find 'Pase de incursión remota' and hide 'Incubadora' and 'Huevo de la Suerte'
    searchInput.value = 'incur';
    applyFilters();

    const remotePassCard = container.querySelector('.item-card[data-card-id="pase_incursion_remota"]');
    const incCard = container.querySelector('.item-card[data-card-id="incubadora"]');
    const superIncCard = container.querySelector('.item-card[data-card-id="superincubadora"]');
    const luckyEggCard = container.querySelector('.item-card[data-card-id="huevo_suerte"]');

    assert.ok(remotePassCard, 'Remote raid pass card exists');
    assert.ok(!remotePassCard.classList.contains('hidden'), 'Remote raid pass card must be visible when searching incur');
    assert.ok(incCard.classList.contains('hidden'), 'Incubadora must be hidden when searching incur');
    assert.ok(luckyEggCard.classList.contains('hidden'), 'Lucky egg must be hidden when searching incur');

    // 2. Search 'incu' -> both 'Incubadora', 'Superincubadora' and 'incursión' contain 'incu', but 'Huevo de la suerte' does not
    searchInput.value = 'incu';
    applyFilters();

    assert.ok(!incCard.classList.contains('hidden'), 'Incubadora must be visible when searching incu');
    assert.ok(!superIncCard.classList.contains('hidden'), 'Superincubadora must be visible when searching incu');
    assert.ok(!remotePassCard.classList.contains('hidden'), 'Remote raid pass (incursión) must be visible when searching incu');
    assert.ok(luckyEggCard.classList.contains('hidden'), 'Lucky egg must be hidden when searching incu');

    // 3. Search 'pokemon' without accent -> should match 'Almacenamiento de Pokémon'
    searchInput.value = 'pokemon';
    applyFilters();

    const storageCard = container.querySelector('.item-card[data-card-id="almacenamiento_pokemon"]');
    assert.ok(!storageCard.classList.contains('hidden'), 'Pokemon storage must be visible when searching pokemon');

    // 4. Non-existent query -> should show empty results notice
    searchInput.value = 'xyznonexistent';
    applyFilters();

    const noResultsEl = container.querySelector('#no-search-results');
    assert.ok(noResultsEl, 'No results message must appear');
    assert.ok(!noResultsEl.classList.contains('hidden'), 'No results message must be visible');
});
