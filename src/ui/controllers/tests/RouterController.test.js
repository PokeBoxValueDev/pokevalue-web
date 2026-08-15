import test from 'node:test';
import assert from 'node:assert/strict';
import { RouterController } from '../RouterController.js';
import { state } from '../../../config/config.js';
import { setLanguage } from '../../../i18n/i18n.js';

function createMockModal(id) {
    const classList = new Set(['hidden']);
    return {
        id,
        classList: {
            add: (c) => classList.add(c),
            remove: (c) => classList.delete(c),
            contains: (c) => classList.has(c)
        }
    };
}

function createMockElement(tagName) {
    const attributes = new Map();
    return {
        tagName,
        setAttribute: (k, v) => attributes.set(k, v),
        getAttribute: (k) => attributes.get(k) || null
    };
}

test('RouterController.parseUrl parses routes, localized paths and aliases correctly', () => {
    assert.deepEqual(RouterController.parseUrl('/'), { lang: null, view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/index.html'), { lang: null, view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es'), { lang: 'es', view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/en'), { lang: 'en', view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es/'), { lang: 'es', view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/privacy'), { lang: null, view: 'privacy', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es/privacy'), { lang: 'es', view: 'privacy', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/en/terms'), { lang: 'en', view: 'legal', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es/legal'), { lang: 'es', view: 'legal', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/unknown-route'), { lang: null, view: 'unknown-route', isRecognized: false });
});

test('RouterController.buildPath constructs clean canonical paths', () => {
    state.currentLang = 'es';
    assert.equal(RouterController.buildPath('es'), '/es');
    assert.equal(RouterController.buildPath('en'), '/en');
    assert.equal(RouterController.buildPath('es', 'privacy'), '/es/privacy');
    assert.equal(RouterController.buildPath('en', 'legal'), '/en/legal');
});

test('RouterController.syncModalsWithView toggles modal visibility correctly', () => {
    const legalModal = createMockModal('legal-modal');
    const privacyModal = createMockModal('privacy-modal');

    const originalDoc = globalThis.document;
    globalThis.document = {
        getElementById: (id) => {
            if (id === 'legal-modal') return legalModal;
            if (id === 'privacy-modal') return privacyModal;
            return null;
        }
    };

    try {
        // Vista privacy
        RouterController.syncModalsWithView('privacy');
        assert.equal(privacyModal.classList.contains('hidden'), false);
        assert.equal(legalModal.classList.contains('hidden'), true);

        // Vista terms
        RouterController.syncModalsWithView('terms');
        assert.equal(legalModal.classList.contains('hidden'), false);
        assert.equal(privacyModal.classList.contains('hidden'), true);

        // Vista base (sin modal)
        RouterController.syncModalsWithView('');
        assert.equal(privacyModal.classList.contains('hidden'), true);
        assert.equal(legalModal.classList.contains('hidden'), true);
    } finally {
        globalThis.document = originalDoc;
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
    const legalModal = createMockModal('legal-modal');
    const privacyModal = createMockModal('privacy-modal');

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
        }
    };

    globalThis.document = {
        getElementById: (id) => {
            if (id === 'legal-modal') return legalModal;
            if (id === 'privacy-modal') return privacyModal;
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
        assert.equal(privacyModal.classList.contains('hidden'), false);
    } finally {
        globalThis.window = originalWin;
        globalThis.document = originalDoc;
        globalThis.localStorage = originalStorage;
    }
});
