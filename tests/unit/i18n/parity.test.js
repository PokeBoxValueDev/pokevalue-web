import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../../../src/i18n/i18n.js';

test('i18n/parity - Paridad estricta 1:1 entre diccionarios de español (es) e inglés (en)', () => {
    const esKeys = Object.keys(translations.es || {}).sort();
    const enKeys = Object.keys(translations.en || {}).sort();

    assert.ok(esKeys.length > 0, 'Diccionario de español no debe estar vacío');
    assert.ok(enKeys.length > 0, 'Diccionario de inglés no debe estar vacío');

    const missingInEn = esKeys.filter(k => !enKeys.includes(k));
    const missingInEs = enKeys.filter(k => !esKeys.includes(k));

    assert.deepEqual(missingInEn, [], `Claves presentes en español pero faltantes en inglés: ${missingInEn.join(', ')}`);
    assert.deepEqual(missingInEs, [], `Claves presentes en inglés pero faltantes en español: ${missingInEs.join(', ')}`);
});

test('i18n/parity - Ninguna clave de traducción debe tener un valor vacío o indefinido', () => {
    ['es', 'en'].forEach(lang => {
        const dict = translations[lang];
        Object.entries(dict).forEach(([key, val]) => {
            assert.ok(typeof val === 'string' && val.trim().length > 0, `Clave "${key}" en idioma "${lang}" no debe estar vacía`);
        });
    });
});
