import { CATEGORY_CONFIG } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { Category } from '../../domain/valueObjects/Category.js';

export const activeCategories = new Set(['all']);

export const CATEGORY_PILL_ACTIVE_CLASSES = {
    all: 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40 font-bold',
    pases: 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/40 font-bold',
    incubadoras: 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400/40 font-bold',
    potenciadores: 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-400/40 font-bold',
    mejoras: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40 font-bold',
    combates: 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400/40 font-bold',
    consumibles: 'bg-cyan-600 text-white shadow-xs ring-2 ring-cyan-400/40 font-bold',
    otros: 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-400/40 font-bold'
};

/**
 * Obtiene la traducción formateada de la categoría usando el diccionario actual.
 * @param {string} catKey
 * @returns {string}
 */
export function getCategoryTranslation(catKey) {
    if (!catKey) return '';
    const i18nKey = Category.getI18nKey(catKey);
    const translated = t(i18nKey);

    if (translated && translated !== i18nKey) {
        return translated;
    }

    const normKey = Category.normalizeKey(catKey);
    return CATEGORY_CONFIG[normKey]?.label || catKey.toUpperCase();
}

/**
 * Alterna el estado de un filtro de categoría.
 * @param {string} category
 */
export function toggleCategoryFilter(category) {
    if (category === 'all') {
        activeCategories.clear();
        activeCategories.add('all');
    } else {
        activeCategories.delete('all');
        if (activeCategories.has(category)) {
            activeCategories.delete(category);
            if (activeCategories.size === 0) {
                activeCategories.add('all');
            }
        } else {
            activeCategories.add(category);
        }
    }
    updateFilterPillsUI();
    applyFilters();
}

export function setCategoryFilter(category) {
    toggleCategoryFilter(category);
}

export function getActiveCategories() {
    return Array.from(activeCategories);
}

export function getActiveCategoryFilter() {
    return activeCategories.has('all') ? 'all' : Array.from(activeCategories).join(',');
}

/**
 * Actualiza visualmente los estilos de las píldoras de filtrado.
 */
export function updateFilterPillsUI() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    const filterPills = document.querySelectorAll('.category-pill');
    filterPills.forEach(pill => {
        const cat = pill.getAttribute('data-category') || 'all';
        if (activeCategories.has(cat)) {
            const activeStyle = CATEGORY_PILL_ACTIVE_CLASSES[cat] || CATEGORY_PILL_ACTIVE_CLASSES.all;
            pill.className = `category-pill whitespace-nowrap px-3.5 py-1.5 rounded-full transition cursor-pointer touch-manipulation ${activeStyle}`;
        } else {
            pill.className = 'category-pill whitespace-nowrap px-3.5 py-1.5 rounded-full font-semibold transition bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer touch-manipulation';
        }
    });
}

/**
 * Aplica los filtros de texto y categorías a las tarjetas de objetos.
 */
export function applyFilters() {
    const container = (typeof document !== 'undefined' && typeof document.getElementById === 'function') ? document.getElementById('items-container') : null;
    const searchInput = (typeof document !== 'undefined' && typeof document.getElementById === 'function') ? document.getElementById('search-input') : null;
    if (!container || typeof container.querySelectorAll !== 'function') return;

    const rawSearch = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const searchTerm = rawSearch
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const isAll = activeCategories.has('all');
    let totalVisibleCards = 0;

    container.querySelectorAll('.category-group').forEach(group => {
        const groupCat = group.getAttribute('data-category');
        let hasVisibleCards = false;

        group.querySelectorAll('.item-card').forEach(card => {
            const rawItemName = (card.getAttribute('data-item-name') || '').toLowerCase();
            const nameEs = (card.getAttribute('data-name-es') || '').toLowerCase();
            const nameEn = (card.getAttribute('data-name-en') || '').toLowerCase();
            const cleanSearchTarget = `${rawItemName} ${nameEs} ${nameEn}`
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            const matchesCategory = isAll || activeCategories.has(groupCat);
            const matchesSearch = !searchTerm || cleanSearchTarget.includes(searchTerm);

            if (matchesCategory && matchesSearch) {
                card.classList.remove('hidden');
                hasVisibleCards = true;
                totalVisibleCards++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (hasVisibleCards) {
            group.classList.remove('hidden');
        } else {
            group.classList.add('hidden');
        }
    });

    let noResultsEl = (typeof container.querySelector === 'function') ? container.querySelector('#no-search-results') : null;
    if (totalVisibleCards === 0) {
        if (!noResultsEl && typeof document !== 'undefined' && typeof document.createElement === 'function') {
            noResultsEl = document.createElement('p');
            noResultsEl.id = 'no-search-results';
            noResultsEl.className = 'text-xs text-gray-400 py-4 text-center col-span-full';
            noResultsEl.setAttribute('data-i18n', 'noItemsFound');
            noResultsEl.textContent = t('noItemsFound') || 'No se encontraron objetos.';
            if (typeof container.appendChild === 'function') {
                container.appendChild(noResultsEl);
            }
        } else if (noResultsEl) {
            noResultsEl.classList.remove('hidden');
        }
    } else if (noResultsEl) {
        noResultsEl.classList.add('hidden');
    }
}
