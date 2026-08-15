import test from 'node:test';
import assert from 'node:assert/strict';
import { ThemeController } from '../../../src/ui/controllers/ThemeController.js';

test('ui/theme - Alterna entre modo claro y oscuro aplicando clases dark en documentElement', () => {
    const docClasses = new Set();
    const lightIconClasses = new Set(['hidden']);
    const darkIconClasses = new Set();

    const lightIcon = {
        classList: {
            add: (c) => lightIconClasses.add(c),
            remove: (c) => lightIconClasses.delete(c),
            contains: (c) => lightIconClasses.has(c)
        }
    };
    const darkIcon = {
        classList: {
            add: (c) => darkIconClasses.add(c),
            remove: (c) => darkIconClasses.delete(c),
            contains: (c) => darkIconClasses.has(c)
        }
    };

    const originalDoc = globalThis.document;
    globalThis.document = {
        documentElement: {
            classList: {
                add: (c) => docClasses.add(c),
                remove: (c) => docClasses.delete(c),
                contains: (c) => docClasses.has(c)
            }
        }
    };

    try {
        ThemeController.applyTheme(true, lightIcon, darkIcon);
        assert.ok(docClasses.has('dark'), 'Debe añadir clase dark');
        assert.equal(lightIconClasses.has('hidden'), false);
        assert.equal(darkIconClasses.has('hidden'), true);

        ThemeController.applyTheme(false, lightIcon, darkIcon);
        assert.ok(!docClasses.has('dark'), 'Debe quitar clase dark');
        assert.equal(lightIconClasses.has('hidden'), true);
        assert.equal(darkIconClasses.has('hidden'), false);
    } finally {
        globalThis.document = originalDoc;
    }
});
