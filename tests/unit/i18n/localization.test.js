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
    const originalNavigator = globalThis.navigator;
    const originalStorage = globalThis.localStorage;

    globalThis.localStorage = { getItem: () => null, setItem: () => {} };

    // Español
    globalThis.navigator = { language: 'es-ES', languages: ['es-ES', 'es'] };
    assert.equal(I18nController.detectLanguage(), 'es');

    // Inglés
    globalThis.navigator = { language: 'en-US', languages: ['en-US', 'en'] };
    assert.equal(I18nController.detectLanguage(), 'en');

    // Idioma no soportado (fallback a es)
    globalThis.navigator = { language: 'fr-FR', languages: ['fr-FR', 'fr'] };
    assert.equal(I18nController.detectLanguage(), 'es');

    globalThis.navigator = originalNavigator;
    globalThis.localStorage = originalStorage;
});
