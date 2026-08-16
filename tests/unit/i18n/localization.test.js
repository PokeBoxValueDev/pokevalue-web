import test from 'node:test';
import assert from 'node:assert/strict';
import { t, setLanguage } from '../../../src/i18n/i18n.js';
import { state } from '../../../src/config/config.js';
import { I18nController } from '../../../src/ui/controllers/I18nController.js';

test('i18n/localization - t() traduce claves y maneja fallbacks', () => {
    setLanguage('es');
    assert.equal(state.currentLang, 'es');
    assert.equal(t('btnCalculate'), 'Calcular Rentabilidad');

    setLanguage('en');
    assert.equal(state.currentLang, 'en');
    assert.equal(t('btnCalculate'), 'Calculate Value');

    // Clave inexistente devuelve la misma clave
    assert.equal(t('nonExistentKey'), 'nonExistentKey');
});

test('i18n/localization - I18nController detecta idioma del navegador automáticamente', () => {
    const originalLanguage = globalThis.navigator?.language;
    const originalLanguages = globalThis.navigator?.languages;
    const originalStorage = globalThis.localStorage;

    globalThis.localStorage = { getItem: () => null, setItem: () => {} };

    // Español
    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: 'es-ES', configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: ['es-ES', 'es'], configurable: true });
    } catch {}
    assert.equal(I18nController.detectLanguage(), 'es');

    // Inglés
    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: 'en-US', configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: ['en-US', 'en'], configurable: true });
    } catch {}
    assert.equal(I18nController.detectLanguage(), 'en');

    // Idioma no soportado (fallback a es)
    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: 'fr-FR', configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: ['fr-FR', 'fr'], configurable: true });
    } catch {}
    assert.equal(I18nController.detectLanguage(), 'es');

    try {
        Object.defineProperty(globalThis.navigator, 'language', { value: originalLanguage, configurable: true });
        Object.defineProperty(globalThis.navigator, 'languages', { value: originalLanguages, configurable: true });
    } catch {}
    globalThis.localStorage = originalStorage;
});
