import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('visual/dom - index.html contains all critical UI containers and IDs', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const requiredIds = [
        'box-price',
        'items-container',
        'btn-calculate',
        'history-section',
        'history-container',
        'btn-clear-history',
        'view-result',
        'result-card',
        'result-title',
        'res-box-price',
        'res-real-value',
        'res-diff-label',
        'res-diff-val',
        'breakdown-legend',
        'btn-share',
        'btn-reset',
        'lang-select',
        'currency-select',
        'legal-modal',
        'privacy-modal'
    ];

    requiredIds.forEach(id => {
        assert.ok(html.includes(`id="${id}"`), `index.html missing required element ID: "${id}"`);
    });
});

test('visual/dom - index.html elements contain data-i18n attributes for localization', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const requiredI18nKeys = [
        'boxPriceLabel',
        'itemsIncluded',
        'loadingItems',
        'btnCalculate',
        'recentHistory',
        'btnClear',
        'resBoxPrice',
        'resRealValue',
        'breakdownTitle',
        'btnShare',
        'btnReset',
        'footerText',
        'btnLegal',
        'btnPrivacy',
        'legalTitle',
        'privacyTitle'
    ];

    requiredI18nKeys.forEach(key => {
        assert.ok(html.includes(`data-i18n="${key}"`) || html.includes(`data-i18n-placeholder="${key}"`), `index.html missing data-i18n attribute for key: "${key}"`);
    });
});

test('visual/dom - 404.html contains data-i18n localization attributes', () => {
    const htmlPath = path.resolve('404.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('data-i18n="error_title"'));
    assert.ok(html.includes('data-i18n="error_back_btn"'));
});

test('visual/dom - verify Tailwind dark mode classes are present on key containers', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('dark:bg-gray-900'));
    assert.ok(html.includes('dark:text-white'));
    assert.ok(html.includes('dark:bg-gray-800'));
});
