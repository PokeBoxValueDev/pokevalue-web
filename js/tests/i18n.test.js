import test from 'node:test';
import assert from 'node:assert/strict';
import { t, setLanguage, updateDOMTranslations } from '../i18n.js';
import { state } from '../config.js';
import es from '../locales/es.js';
import en from '../locales/en.js';

test('i18n - key parity between Spanish and English dictionaries', () => {
    const esKeys = Object.keys(es).sort();
    const enKeys = Object.keys(en).sort();

    const missingInEn = esKeys.filter(k => !(k in en));
    const missingInEs = enKeys.filter(k => !(k in es));

    assert.deepEqual(missingInEn, [], `Keys present in es.js but missing in en.js: ${missingInEn.join(', ')}`);
    assert.deepEqual(missingInEs, [], `Keys present in en.js but missing in es.js: ${missingInEs.join(', ')}`);
});

test('i18n - t() returns correct translation for Spanish and English', () => {
    setLanguage('es');
    assert.equal(t('btnCalculate'), 'Calcular Rentabilidad');
    assert.equal(t('badgeProfitable'), 'Rentable');

    setLanguage('en');
    assert.equal(t('btnCalculate'), 'Calculate Value');
    assert.equal(t('badgeProfitable'), 'Profitable');

    setLanguage('es'); // Restaurar idioma por defecto
});

test('i18n - t() fallback behavior for missing key or unknown language', () => {
    setLanguage('es');
    assert.equal(t('non_existent_key_123'), 'non_existent_key_123');

    state.currentLang = 'fr'; // Unsupported language
    assert.equal(t('btnCalculate'), 'Calcular Rentabilidad'); // Fallback to Spanish

    setLanguage('es'); // Restaurar idioma por defecto
});

test('i18n - updateDOMTranslations updates elements with data-i18n and data-i18n-placeholder', () => {
    setLanguage('es');

    const mockElements = [
        { getAttribute: (attr) => attr === 'data-i18n' ? 'badgeProfitable' : null, innerText: '' },
        { getAttribute: (attr) => attr === 'data-i18n' ? 'btnRestore' : null, innerText: '' }
    ];

    const mockPlaceholders = [
        { getAttribute: (attr) => attr === 'data-i18n-placeholder' ? 'searchPlaceholder' : null, placeholder: '' }
    ];

    globalThis.document = {
        querySelectorAll: (selector) => {
            if (selector === '[data-i18n]') return mockElements;
            if (selector === '[data-i18n-placeholder]') return mockPlaceholders;
            return [];
        }
    };

    updateDOMTranslations();

    assert.equal(mockElements[0].innerText, 'Rentable');
    assert.equal(mockElements[1].innerText, 'Restaurar');
    assert.equal(mockPlaceholders[0].placeholder, '🔍 Buscar objeto...');

    setLanguage('es'); // Restaurar estado
});
