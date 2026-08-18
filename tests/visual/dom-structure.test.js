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
        'btn-share-story',
        'btn-share-sticker',
        'btn-share-card',
        'btn-reset',
        'lang-select',
        'currency-select',
        'view-container',
        'btn-faq',
        'btn-legal',
        'btn-privacy',
        'kofi-widget-container',
        'category-filter-pills',
        'live-sticky-bar',
        'live-grade-badge',
        'btn-live-view-result',
        'btn-install-pwa',
        'ios-install-banner',
        'btn-close-ios-banner',
        'save-box-feedback'
    ];

    requiredIds.forEach(id => {
        assert.ok(html.includes(`id="${id}"`), `index.html missing required element ID: "${id}"`);
    });
});

test('visual/dom - index.html and modular views contain data-i18n attributes for localization', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const viewsDir = path.resolve('src/components/views');
    const legalHtml = fs.readFileSync(path.join(viewsDir, 'legal.html'), 'utf8');
    const privacyHtml = fs.readFileSync(path.join(viewsDir, 'privacy.html'), 'utf8');
    const faqHtml = fs.readFileSync(path.join(viewsDir, 'faq.html'), 'utf8');

    const allHtml = `${html}\n${legalHtml}\n${privacyHtml}\n${faqHtml}`;

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
        'btnShareText',
        'btnShareStory',
        'btnShareCard',
        'btnReset',
        'footerText',
        'btnFaq',
        'btnLegal',
        'btnPrivacy',
        'legalTitle',
        'privacyTitle',
        'privacyBody3',
        'seoTitle',
        'seoDesc1',
        'seoDesc2',
        'faqTitle',
        'faqQ1',
        'faqA1',
        'tableRefTitle',
        'colItem',
        'colCoins',
        'colEur'
    ];

    requiredI18nKeys.forEach(key => {
        assert.ok(allHtml.includes(`data-i18n="${key}"`) || allHtml.includes(`data-i18n-placeholder="${key}"`), `missing data-i18n attribute for key: "${key}"`);
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
    assert.ok(html.includes('https://fundingchoicesmessages.google.com'), 'CSP must allow Google Funding Choices CMP');
    assert.ok(html.includes('https://*.googleadservices.com'), 'CSP must allow Google Ad Services');

    // Safe Ko-fi button check
    assert.ok(html.includes('https://ko-fi.com/E1U623YPMD'), 'Ko-fi donation link must point to project account');
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

    const viewsDir = path.resolve('src/components/views');
    const legalHtml = fs.readFileSync(path.join(viewsDir, 'legal.html'), 'utf8');
    const privacyHtml = fs.readFileSync(path.join(viewsDir, 'privacy.html'), 'utf8');

    assert.ok(html.includes('dark:bg-gray-900'));
    assert.ok(html.includes('dark:text-white'));
    assert.ok(html.includes('dark:bg-gray-800'));

    // ARIA & Focus Accessibility
    assert.ok(html.includes('aria-label="Seleccionar idioma"'));
    assert.ok(html.includes('aria-label="Seleccionar divisa"'));
    assert.ok(html.includes('aria-label="Buscar objetos"'));
    assert.ok(html.includes('tabindex="-1"'));
    assert.ok(legalHtml.includes('id="view-legal"'));
    assert.ok(privacyHtml.includes('id="view-privacy"'));
});

test('visual/dom - index.html contains canonical and hreflang SEO tags and 404.html contains SPA redirect', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('rel="canonical"'), 'index.html must contain rel="canonical"');
    assert.ok(html.includes('hreflang="es"'), 'index.html must contain hreflang="es"');
    assert.ok(html.includes('hreflang="en"'), 'index.html must contain hreflang="en"');
    assert.ok(html.includes('hreflang="x-default"'), 'index.html must contain hreflang="x-default"');

    const notFoundPath = path.resolve('404.html');
    const notFoundHtml = fs.readFileSync(notFoundPath, 'utf8');
    assert.ok(notFoundHtml.includes('SPA Redirect for Static Hosts'), '404.html must contain SPA redirect script');
});

test('visual/dom - Google AdSense, Consent Mode and GA4 configuration are preserved in HTML heads', () => {
    const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const notFoundHtml = fs.readFileSync(path.resolve('404.html'), 'utf8');

    // Google AdSense
    assert.ok(indexHtml.includes('ca-pub-7043156975807845'), 'index.html must include Google AdSense ca-pub ID');
    assert.ok(notFoundHtml.includes('ca-pub-7043156975807845'), '404.html must include Google AdSense ca-pub ID');

    // Google Tag Manager / GA4 & Consent Mode v2
    assert.ok(indexHtml.includes('G-ES8GHFDWRP'), 'index.html must include GA4 tracking ID');
    assert.ok(indexHtml.includes("gtag('consent', 'default'"), 'index.html must include Google Consent Mode v2');
});

test('visual/dom - css/styles.css hides native number input spinners for clean UX', () => {
    const cssPath = path.resolve('css/styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    assert.ok(css.includes('-webkit-outer-spin-button'), 'styles.css must style -webkit-outer-spin-button');
    assert.ok(css.includes('-webkit-inner-spin-button'), 'styles.css must style -webkit-inner-spin-button');
    assert.ok(css.includes('-moz-appearance: textfield'), 'styles.css must set -moz-appearance: textfield');
});



