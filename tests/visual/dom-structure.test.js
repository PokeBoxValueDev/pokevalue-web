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
        'btn-reset-qty',
        'history-section',
        'history-container',
        'btn-clear-history',
        'view-result',
        'result-card',
        'res-grade-badge',
        'result-title',
        'res-box-price',
        'res-real-value',
        'res-diff-label',
        'res-diff-val',
        'key-metrics-section',
        'key-metrics-container',
        'breakdown-legend',
        'btn-share',
        'btn-share-card',
        'btn-reset',
        'lang-select',
        'currency-select',
        'legal-modal',
        'privacy-modal',
        'kofi-widget-container'
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
        'btnResetQty',
        'loadingItems',
        'btnCalculate',
        'recentHistory',
        'btnClear',
        'resBoxPrice',
        'resRealValue',
        'keyMetricsTitle',
        'breakdownTitle',
        'btnShare',
        'btnShareCard',
        'btnReset',
        'footerText',
        'btnLegal',
        'btnPrivacy',
        'legalTitle',
        'privacyTitle',
        'privacyBody3',
        'seoTitle',
        'seoDesc1',
        'seoDesc2'
    ];

    requiredI18nKeys.forEach(key => {
        assert.ok(html.includes(`data-i18n="${key}"`) || html.includes(`data-i18n-placeholder="${key}"`), `index.html missing data-i18n attribute for key: "${key}"`);
    });
});

test('visual/dom - Content Security Policy (CSP) header includes required domains for GA4 region1 and Ko-fi widget safety', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('Content-Security-Policy'), 'index.html must specify Content-Security-Policy meta header');
    assert.ok(html.includes('https://storage.ko-fi.com'), 'CSP must allow Ko-fi storage CDN');
    assert.ok(html.includes('https://ko-fi.com'), 'CSP must allow Ko-fi domain');
    assert.ok(html.includes('https://region1.google-analytics.com'), 'CSP connect-src must allow region1.google-analytics.com');
    assert.ok(html.includes('https://*.google-analytics.com'), 'CSP connect-src must allow *.google-analytics.com');

    // Safe Ko-fi widget script evaluation
    assert.ok(html.includes("typeof kofiwidget2 !== 'undefined'"), 'Ko-fi widget script must guard against ReferenceError if script is blocked');
});

test('visual/dom - 404.html contains data-i18n localization attributes', () => {
    const htmlPath = path.resolve('404.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('data-i18n="error_title"'));
    assert.ok(html.includes('data-i18n="error_back_btn"'));
});

test('visual/dom - verify Tailwind dark mode classes and ARIA accessibility attributes are present', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('dark:bg-gray-900'));
    assert.ok(html.includes('dark:text-white'));
    assert.ok(html.includes('dark:bg-gray-800'));

    // ARIA & Focus Accessibility
    assert.ok(html.includes('aria-label="Seleccionar idioma"'));
    assert.ok(html.includes('aria-label="Seleccionar divisa"'));
    assert.ok(html.includes('aria-label="Buscar objetos"'));
    assert.ok(html.includes('tabindex="-1"'));
});
