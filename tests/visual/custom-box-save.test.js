import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { ItemMapper } from '../../src/infrastructure/mappers/ItemMapper.js';
import { CalculatorController } from '../../src/ui/controllers/CalculatorController.js';
import { HistoryRepository } from '../../src/infrastructure/repositories/HistoryRepository.js';
import { renderHistory } from '../../src/ui/components/HistoryRenderer.js';
import { renderItems } from '../../src/ui/components/ItemCardRenderer.js';
import { state } from '../../src/config/config.js';

describe('visual/custom-box-save - Custom Box Name and Saved Calculations', () => {
    it('saves calculation with custom name and restores into calculator', () => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <section id="view-form">
                    <input type="number" id="box-price" value="">
                    <p id="box-price-error" class="hidden"></p>
                    <div id="selected-items-tray" class="hidden">
                        <button id="btn-clear-tray" type="button"></button>
                        <div id="selected-chips-list"></div>
                    </div>
                    <input type="text" id="search-input" value="">
                    <div id="items-container"></div>
                </section>
                <section id="view-result" class="hidden">
                    <input type="text" id="custom-box-name-input" value="">
                    <button id="btn-save-custom-box" type="button">
                        <span id="btn-save-box-label">Guardar Caja</span>
                    </button>
                </section>
                <section id="history-section" class="hidden">
                    <div id="history-container"></div>
                </section>
                <div id="live-sticky-bar"></div>
                <span id="live-total-val"></span>
                <span id="live-diff-tag"></span>
                <span id="live-grade-badge"></span>
            </body>
            </html>
        `);

        global.window = dom.window;
        global.document = dom.window.document;
        global.localStorage = {
            _data: {},
            getItem(key) { return this._data[key] || null; },
            setItem(key, val) { this._data[key] = String(val); },
            removeItem(key) { delete this._data[key]; }
        };

        const rawData = JSON.parse(fs.readFileSync(path.resolve('src/assets/items-fallback.json'), 'utf8'));
        const domainItems = ItemMapper.toDomainList(rawData);
        state.setStoreData(domainItems);
        renderItems(domainItems);

        // 1. Initial calculation save
        HistoryRepository.saveCalculation({
            boxPrice: 500,
            totalValue: 750,
            diff: 250,
            isProfitable: true,
            currencySymbol: '€',
            items: ['2x Remote Raid Pass'],
            quantities: { pase_incursion_remota: 2 }
        });

        // 2. Custom name input & save
        const boxNameInput = document.getElementById('custom-box-name-input');
        boxNameInput.value = 'Caja Especial Incursiones';

        const history = HistoryRepository.getHistory();
        assert.equal(history.length, 1);
        history[0].boxName = boxNameInput.value.trim();
        history[0].isSaved = true;
        HistoryRepository.saveHistory(history);

        // 3. Render history and verify custom box name appears
        renderHistory(CalculatorController.restoreFromHistory);

        const historyContainer = document.getElementById('history-container');
        assert.ok(historyContainer.textContent.includes('Caja Especial Incursiones'), 'Custom box name must appear in history');

        // 4. Restore from history
        CalculatorController.restoreFromHistory(history[0]);

        const priceInput = document.getElementById('box-price');
        assert.equal(priceInput.value, '500', 'Box price must be restored to 500');

        const rrpInput = document.querySelector('input[data-id="pase_incursion_remota"]');
        assert.equal(parseInt(rrpInput.value), 2, 'Item quantities must be restored to 2');

        assert.equal(boxNameInput.value, 'Caja Especial Incursiones', 'Custom box name input must be populated on restore');
    });
});
