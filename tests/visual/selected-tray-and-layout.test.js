import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { ItemMapper } from '../../src/infrastructure/mappers/ItemMapper.js';
import { renderItems, setLayoutMode, updateSelectedTray, showFloatingFeedback } from '../../src/ui/components/ItemCardRenderer.js';
import { state } from '../../src/config/config.js';

describe('visual/selected-tray-and-layout - Selected Items Tray and Layout Density', () => {
    it('selected tray appears when items are selected and removes on clear', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="selected-items-tray" class="hidden">
                    <button id="btn-clear-tray" type="button">Vaciar</button>
                    <div id="selected-chips-list"></div>
                </div>
                <div id="layout-toggle-group">
                    <button id="btn-layout-list" data-layout="list"></button>
                    <button id="btn-layout-grid" data-layout="grid"></button>
                </div>
                <input type="text" id="search-input" value="">
                <div id="items-container"></div>
            </body>
            </html>
        `);

        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); }
        };

        const rawData = JSON.parse(fs.readFileSync(path.resolve('src/assets/items-fallback.json'), 'utf8'));
        const domainItems = ItemMapper.toDomainList(rawData);
        state.setStoreData(domainItems);

        renderItems(domainItems);

        const tray = document.getElementById('selected-items-tray');
        const chipsList = document.getElementById('selected-chips-list');

        // Initial state: 0 items selected -> Tray is hidden
        assert.ok(tray.classList.contains('hidden'), 'Tray must be hidden initially');
        assert.equal(chipsList.children.length, 0, 'No chips should be rendered');

        // Add 2 Remote Raid Passes
        const rrpInput = document.querySelector('input[data-id="pase_incursion_remota"]');
        assert.ok(rrpInput, 'Remote Raid Pass input must exist');
        rrpInput.value = 2;
        rrpInput.dispatchEvent(new dom.window.Event('input'));

        // Tray should now be visible with 1 chip
        assert.ok(!tray.classList.contains('hidden'), 'Tray must become visible when item quantity > 0');
        assert.equal(chipsList.children.length, 1, '1 chip must be rendered');
        assert.ok(chipsList.textContent.includes('2x'), 'Chip must display 2x quantity');
        assert.ok(chipsList.children[0].innerHTML.includes('bg-indigo-500'), 'Pass chip must have pases category color');

        // Add 3 Incubators
        const incInput = document.querySelector('input[data-id="incubadora"]');
        assert.ok(incInput, 'Incubator input must exist');
        incInput.value = 3;
        incInput.dispatchEvent(new dom.window.Event('input'));

        assert.equal(chipsList.children.length, 2, '2 chips must now be rendered');
        assert.ok(chipsList.children[1].innerHTML.includes('bg-amber-500'), 'Incubator chip must have incubadoras category color');

        // Remove incubator using chip remove button
        const removeIncBtn = chipsList.querySelector('.btn-remove-chip[data-id="incubadora"]');
        assert.ok(removeIncBtn, 'Remove button for incubator chip must exist');
        removeIncBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        assert.equal(parseInt(incInput.value), 0, 'Incubator quantity should be 0 after chip removal');
        assert.equal(chipsList.children.length, 1, 'Only 1 chip remains');

        // Clear all items with btn-clear-tray
        const clearBtn = document.getElementById('btn-clear-tray');
        clearBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        assert.equal(parseInt(rrpInput.value), 0, 'Remote raid pass quantity must be reset to 0');
        assert.ok(tray.classList.contains('hidden'), 'Tray must hide when cleared');
    });

    it('toggles layout density between list and grid and persists in localStorage', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="layout-toggle-group">
                    <button id="btn-layout-list" data-layout="list"></button>
                    <button id="btn-layout-grid" data-layout="grid"></button>
                </div>
                <div id="items-container"></div>
            </body>
            </html>
        `);

        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); }
        };

        const container = document.getElementById('items-container');

        // Switch to grid layout
        setLayoutMode('grid');
        assert.ok(container.classList.contains('items-layout-grid'), 'Container must have items-layout-grid class');
        assert.equal(global.localStorage.getItem('pokevalue_view_layout'), 'grid', 'Must persist grid in localStorage');

        // Switch to list layout
        setLayoutMode('list');
        assert.ok(!container.classList.contains('items-layout-grid'), 'Container must not have items-layout-grid class');
        assert.equal(global.localStorage.getItem('pokevalue_view_layout'), 'list', 'Must persist list in localStorage');
    });

    it('defaults to grid layout on mobile viewport (<640px) when no preference is stored', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="layout-toggle-group">
                    <button id="btn-layout-list" data-layout="list"></button>
                    <button id="btn-layout-grid" data-layout="grid"></button>
                </div>
                <input type="text" id="search-input" value="">
                <div id="items-container"></div>
            </body>
            </html>
        `, { pretendToBeVisual: true });

        dom.window.innerWidth = 375;
        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); }
        };

        const rawData = JSON.parse(fs.readFileSync(path.resolve('src/assets/items-fallback.json'), 'utf8'));
        const domainItems = ItemMapper.toDomainList(rawData);
        state.setStoreData(domainItems);

        renderItems(domainItems);

        const container = document.getElementById('items-container');
        assert.ok(container.classList.contains('items-layout-grid'), 'Mobile viewport must default to items-layout-grid');
    });

    it('handles touch swipe right to increment (+1) and swipe left to decrement (-1)', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="selected-items-tray" class="hidden">
                    <button id="btn-clear-tray" type="button">Vaciar</button>
                    <div id="selected-chips-list"></div>
                </div>
                <div id="items-container"></div>
            </body>
            </html>
        `);

        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); }
        };

        const rawData = JSON.parse(fs.readFileSync(path.resolve('src/assets/items-fallback.json'), 'utf8'));
        const domainItems = ItemMapper.toDomainList(rawData);
        state.setStoreData(domainItems);

        renderItems(domainItems);

        const card = document.querySelector('.item-card[data-card-id="pase_incursion_remota"]');
        const input = card.querySelector('.item-qty');
        assert.equal(input.value, '0');

        // 1. Simular Swipe Right (+50px)
        const touchStartEvt = new dom.window.CustomEvent('touchstart');
        touchStartEvt.touches = [{ clientX: 100, clientY: 100 }];
        card.dispatchEvent(touchStartEvt);

        const touchMoveEvt = new dom.window.CustomEvent('touchmove');
        touchMoveEvt.touches = [{ clientX: 160, clientY: 102 }];
        card.dispatchEvent(touchMoveEvt);

        const touchEndEvt = new dom.window.CustomEvent('touchend');
        card.dispatchEvent(touchEndEvt);

        assert.equal(input.value, '1', 'Swipe right must increment quantity to 1');

        // 2. Simular Swipe Left (-50px)
        const touchStartEvt2 = new dom.window.CustomEvent('touchstart');
        touchStartEvt2.touches = [{ clientX: 200, clientY: 100 }];
        card.dispatchEvent(touchStartEvt2);

        const touchMoveEvt2 = new dom.window.CustomEvent('touchmove');
        touchMoveEvt2.touches = [{ clientX: 140, clientY: 102 }];
        card.dispatchEvent(touchMoveEvt2);

        const touchEndEvt2 = new dom.window.CustomEvent('touchend');
        card.dispatchEvent(touchEndEvt2);

        assert.equal(input.value, '0', 'Swipe left must decrement quantity back to 0');
    });
});
