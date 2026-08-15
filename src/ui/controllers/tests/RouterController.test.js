import test from 'node:test';
import assert from 'node:assert/strict';
import { RouterController } from '../RouterController.js';
import { state } from '../../../config/config.js';

function createMockElement(id) {
    const classList = new Set(['hidden']);
    const attrs = new Map();
    return {
        id,
        innerHTML: '',
        classList: {
            add: (c) => classList.add(c),
            remove: (c) => classList.delete(c),
            contains: (c) => classList.has(c)
        },
        setAttribute: (k, v) => attrs.set(k, String(v)),
        getAttribute: (k) => attrs.get(k) || null
    };
}

test('RouterController.parseUrl parses routes, localized paths and aliases correctly', () => {
    assert.deepEqual(RouterController.parseUrl('/es'), { lang: 'es', view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/en/privacy'), { lang: 'en', view: 'privacy', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/terms'), { lang: null, view: 'legal', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es/faq'), { lang: 'es', view: 'faq', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/'), { lang: null, view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/unknown-route'), { lang: null, view: 'unknown-route', isRecognized: false });
});

test('RouterController.buildPath constructs clean canonical paths', () => {
    assert.equal(RouterController.buildPath('es', ''), '/es');
    assert.equal(RouterController.buildPath('en', ''), '/en');
    assert.equal(RouterController.buildPath('es', 'privacy'), '/es/privacy');
    assert.equal(RouterController.buildPath('en', 'legal'), '/en/legal');
});

test('RouterController.syncModalsWithView toggles view-container visibility correctly', () => {
    const viewContainer = createMockElement('view-container');
    const viewForm = createMockElement('view-form');
    const viewResult = createMockElement('view-result');

    const originalDoc = globalThis.document;
    const originalWin = globalThis.window;
    globalThis.document = {
        getElementById: (id) => {
            if (id === 'view-container') return viewContainer;
            if (id === 'view-form') return viewForm;
            if (id === 'view-result') return viewResult;
            return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null
    };
    globalThis.window = {
        scrollTo: () => {}
    };

    try {
        // Vista privacy
        RouterController.syncModalsWithView('privacy');
        assert.equal(viewContainer.classList.contains('hidden'), false);
        assert.ok(viewContainer.innerHTML.includes('id="view-privacy"'));

        // Vista terms
        RouterController.syncModalsWithView('terms');
        assert.equal(viewContainer.classList.contains('hidden'), false);
        assert.ok(viewContainer.innerHTML.includes('id="view-legal"'));

        // Vista base (sin modal)
        RouterController.syncModalsWithView('');
        assert.equal(viewContainer.classList.contains('hidden'), true);
        assert.equal(viewContainer.innerHTML, '');
    } finally {
        globalThis.document = originalDoc;
        globalThis.window = originalWin;
    }
});

test('RouterController.updateSeoLinks updates canonical, og:url and html lang tags', () => {
    const canonicalLink = createMockElement('link');
    const ogMeta = createMockElement('meta');
    const htmlElement = createMockElement('html');

    const originalDoc = globalThis.document;
    globalThis.document = {
        querySelector: (selector) => {
            if (selector === 'link[rel="canonical"]') return canonicalLink;
            if (selector === 'meta[property="og:url"]') return ogMeta;
            return null;
        },
        head: { appendChild: () => { } },
        documentElement: htmlElement
    };

    try {
        RouterController.updateSeoLinks('en', 'privacy');
        assert.equal(canonicalLink.getAttribute('href'), 'https://pokeboxvalue.com/en/privacy');
        assert.equal(ogMeta.getAttribute('content'), 'https://pokeboxvalue.com/en/privacy');
        assert.equal(htmlElement.getAttribute('lang'), 'en');

        RouterController.updateSeoLinks('es');
        assert.equal(canonicalLink.getAttribute('href'), 'https://pokeboxvalue.com/es');
        assert.equal(ogMeta.getAttribute('content'), 'https://pokeboxvalue.com/es');
        assert.equal(htmlElement.getAttribute('lang'), 'es');
    } finally {
        globalThis.document = originalDoc;
    }
});

test('RouterController.handleCurrentRoute syncs route, history and state seamlessly', () => {
    const historyCalls = [];
    const viewContainer = createMockElement('view-container');
    const viewForm = createMockElement('view-form');
    const viewResult = createMockElement('view-result');

    const originalWin = globalThis.window;
    const originalDoc = globalThis.document;
    const originalStorage = globalThis.localStorage;

    const mockStorage = new Map();
    globalThis.localStorage = {
        getItem: (k) => mockStorage.get(k) || null,
        setItem: (k, v) => mockStorage.set(k, String(v))
    };

    globalThis.window = {
        location: { pathname: '/en/privacy', search: '', hash: '' },
        history: {
            replaceState: (state, title, url) => historyCalls.push({ type: 'replace', url }),
            pushState: (state, title, url) => historyCalls.push({ type: 'push', url })
        },
        scrollTo: () => {}
    };

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'view-container') return viewContainer;
            if (id === 'view-form') return viewForm;
            if (id === 'view-result') return viewResult;
            return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        head: { appendChild: () => { } },
        documentElement: createMockElement('html')
    };

    try {
        RouterController.handleCurrentRoute({ isInitial: true });
        assert.equal(state.currentLang, 'en');
        assert.equal(viewContainer.classList.contains('hidden'), false);
        assert.ok(viewContainer.innerHTML.includes('id="view-privacy"'));
    } finally {
        globalThis.window = originalWin;
        globalThis.document = originalDoc;
        globalThis.localStorage = originalStorage;
    }
});
