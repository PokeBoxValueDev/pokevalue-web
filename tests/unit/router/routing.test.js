import test from 'node:test';
import assert from 'node:assert/strict';
import { RouterController } from '../../../src/ui/controllers/RouterController.js';

test('router/routing - RouterController.parseUrl analiza rutas principales y alias', () => {
    assert.deepEqual(RouterController.parseUrl('/es'), { lang: 'es', view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/en'), { lang: 'en', view: '', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es/privacy'), { lang: 'es', view: 'privacy', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/en/legal'), { lang: 'en', view: 'legal', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/es/faq'), { lang: 'es', view: 'faq', isRecognized: true });

    // Alias normalizados
    assert.deepEqual(RouterController.parseUrl('/terms'), { lang: null, view: 'legal', isRecognized: true });
    assert.deepEqual(RouterController.parseUrl('/faqs'), { lang: null, view: 'faq', isRecognized: true });

    // Ruta desconocida
    assert.deepEqual(RouterController.parseUrl('/not-found-page'), { lang: null, view: 'not-found-page', isRecognized: false });
});

test('router/routing - RouterController.buildPath construye URLs canónicas limpias', () => {
    assert.equal(RouterController.buildPath('es', ''), '/es');
    assert.equal(RouterController.buildPath('en', ''), '/en');
    assert.equal(RouterController.buildPath('es', 'privacy'), '/es/privacy');
    assert.equal(RouterController.buildPath('en', 'faq'), '/en/faq');
});
