import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { toggleCategoryFilter, getActiveCategories, getActiveCategoryFilter, applyFilters } from '../../../src/ui/components/ItemCardRenderer.js';

test('ui/category-filters - Permite selección múltiple de categorías y alternancia', () => {
    // 1. Iniciar con "all"
    toggleCategoryFilter('all');
    assert.deepEqual(getActiveCategories(), ['all']);
    assert.equal(getActiveCategoryFilter(), 'all');

    // 2. Seleccionar "pases"
    toggleCategoryFilter('pases');
    assert.deepEqual(getActiveCategories(), ['pases']);

    // 3. Añadir "incubadoras" (Selección múltiple de 2 categorías)
    toggleCategoryFilter('incubadoras');
    const cats = getActiveCategories();
    assert.ok(cats.includes('pases'), 'Debe incluir pases');
    assert.ok(cats.includes('incubadoras'), 'Debe incluir incubadoras');
    assert.equal(cats.includes('all'), false, 'No debe incluir all');

    // 4. Deseleccionar "pases" (Debe quedar solo "incubadoras")
    toggleCategoryFilter('pases');
    assert.deepEqual(getActiveCategories(), ['incubadoras']);

    // 5. Deseleccionar "incubadoras" (Al quedar vacío debe volver a "all")
    toggleCategoryFilter('incubadoras');
    assert.deepEqual(getActiveCategories(), ['all']);
});

test('ui/category-filters - Seleccionar "all" limpia todas las demás categorías activas', () => {
    toggleCategoryFilter('pases');
    toggleCategoryFilter('potenciadores');
    toggleCategoryFilter('mejoras');
    assert.equal(getActiveCategories().length, 3);

    toggleCategoryFilter('all');
    assert.deepEqual(getActiveCategories(), ['all']);
});

test('ui/category-filters - css/styles.css define utilidades .no-scrollbar y .scrollbar-none para ocultar scrollbars', () => {
    const rootDir = process.cwd();
    const cssPath = path.join(rootDir, 'css', 'styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert.ok(cssContent.includes('.no-scrollbar::-webkit-scrollbar'), 'styles.css debe contener regla para webkit scrollbar');
    assert.ok(cssContent.includes('scrollbar-width: none'), 'styles.css debe contener scrollbar-width: none para Firefox');
    assert.ok(cssContent.includes('touch-action: manipulation'), 'styles.css debe contener regla touch-action: manipulation para evitar zoom por doble toque');
});

test('ui/category-filters - setCategoryFilter("all") restablece correctamente el filtro activo', () => {
    toggleCategoryFilter('incubadoras');
    toggleCategoryFilter('mejoras');
    assert.equal(getActiveCategories().length, 2);

    toggleCategoryFilter('all');
    assert.deepEqual(getActiveCategories(), ['all']);
});

test('ui/category-filters - updateFilterPillsUI aplica colores temáticos específicos por categoría al estar activo', () => {
    const mockPills = [
        { category: 'all', className: '', getAttribute: () => 'all' },
        { category: 'pases', className: '', getAttribute: () => 'pases' },
        { category: 'incubadoras', className: '', getAttribute: () => 'incubadoras' }
    ];

    const originalDoc = globalThis.document;
    globalThis.document = {
        querySelectorAll: (selector) => selector === '.category-pill' ? mockPills : []
    };

    try {
        // 1. Activar incubadoras
        toggleCategoryFilter('incubadoras');
        const incubadorasPill = mockPills.find(p => p.category === 'incubadoras');
        const pasesPill = mockPills.find(p => p.category === 'pases');

        assert.ok(incubadorasPill.className.includes('bg-amber-600'), 'Píldora de incubadoras debe tener bg-amber-600 al estar activa');
        assert.ok(!pasesPill.className.includes('bg-amber-600'), 'Píldora de pases no debe tener bg-amber-600');
    } finally {
        toggleCategoryFilter('all');
        globalThis.document = originalDoc;
    }
});

