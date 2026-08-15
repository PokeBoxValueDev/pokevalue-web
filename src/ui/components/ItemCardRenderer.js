import { CURRENCY_CONFIG, CATEGORY_CONFIG, state } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { Category } from '../../domain/valueObjects/Category.js';
import { IOSDeviceDetector } from '../ios/IOSDeviceDetector.js';

/**
 * Obtiene la traducción formateada de la categoría usando el diccionario actual.
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

const activeCategories = new Set(['all']);

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

export function updateFilterPillsUI() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    const filterPills = document.querySelectorAll('.category-pill');
    filterPills.forEach(pill => {
        const cat = pill.getAttribute('data-category') || 'all';
        if (activeCategories.has(cat)) {
            pill.className = 'category-pill whitespace-nowrap px-3 py-1 rounded-full font-bold transition bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/40 cursor-pointer';
        } else {
            pill.className = 'category-pill whitespace-nowrap px-3 py-1 rounded-full font-medium transition bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer';
        }
    });
}

export function applyFilters() {
    const container = (typeof document !== 'undefined' && typeof document.getElementById === 'function') ? document.getElementById('items-container') : null;
    const searchInput = (typeof document !== 'undefined' && typeof document.getElementById === 'function') ? document.getElementById('search-input') : null;
    if (!container || typeof container.querySelectorAll !== 'function') return;

    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const isAll = activeCategories.has('all');

    container.querySelectorAll('.category-group').forEach(group => {
        const groupCat = group.getAttribute('data-category');
        let hasVisibleCards = false;

        group.querySelectorAll('.item-card').forEach(card => {
            const itemName = (card.getAttribute('data-item-name') || '').toLowerCase();
            const cardCat = card.getAttribute('data-category');

            const matchesCategory = isAll || activeCategories.has(cardCat) || activeCategories.has(groupCat);
            const matchesSearch = !searchTerm || itemName.includes(searchTerm);

            if (matchesCategory && matchesSearch) {
                card.classList.remove('hidden');
                hasVisibleCards = true;
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
}

/**
 * Renderiza la lista de objetos agrupados por categoría.
 */
export function renderItems(items) {
    const container = document.getElementById('items-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-2 text-center" data-i18n="noItemsFound">${t('noItemsFound')}</p>`;
        return;
    }

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { rate: 1, symbol: '€' };
    const isCoins = state.currentCurrency === 'POKECOINS';

    // 1. Agrupar items por categoría
    const grouped = items.reduce((acc, item) => {
        const catKey = Category.normalizeKey(item.category || item.categoria || 'otros');
        if (!acc[catKey]) acc[catKey] = [];
        acc[catKey].push(item);
        return acc;
    }, {});

    // 2. Generar el HTML agrupado por categorías
    container.innerHTML = Object.entries(grouped).map(([catKey, categoryItems]) => {
        const config = CATEGORY_CONFIG[catKey] || { color: 'bg-gray-500', label: catKey };
        const categoryLabel = getCategoryTranslation(catKey);
        const i18nKey = Category.getI18nKey(catKey);

        return `
            <div class="category-group space-y-2" data-category="${catKey}">
                <!-- Cabecera / Badge de la Categoría -->
                <div class="flex items-center gap-2 pt-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                    <span class="w-2.5 h-2.5 rounded-full ${config.color}"></span>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" data-i18n="${i18nKey}">
                        ${categoryLabel}
                    </span>
                </div>

                <!-- Lista de Objetos -->
                <div class="space-y-2.5">
                    ${categoryItems.map(item => {
            let unitPriceStr = '';

            if (typeof item.calculateUnitPrice === 'function') {
                const unitPrice = item.calculateUnitPrice(state.currentCurrency, CURRENCY_CONFIG);
                const priceFormatted = isCoins ? Math.round(unitPrice) : unitPrice.toFixed(2);
                unitPriceStr = `${priceFormatted} <span class="currency-symbol">${curr.symbol}</span> / u.`;
            } else {
                if (isCoins) {
                    const coins = item.unit_price_coins ?? Math.round((item.unit_price_eur || 0) * curr.rate);
                    unitPriceStr = `${coins} <span class="currency-symbol">${curr.symbol}</span> / u.`;
                } else if (state.currentCurrency === 'USD' && item.unit_price_usd) {
                    unitPriceStr = `${item.unit_price_usd.toFixed(2)} <span class="currency-symbol">${curr.symbol}</span> / u.`;
                } else {
                    const price = (item.unit_price_eur || item.price_eur || 0) * curr.rate;
                    unitPriceStr = `${price.toFixed(2)} <span class="currency-symbol">${curr.symbol}</span> / u.`;
                }
            }

            const name = typeof item.getLocalizedName === 'function'
                ? item.getLocalizedName(state.currentLang)
                : ((state.currentLang === 'en' && item.name_en) ? item.name_en : (item.name_es || item.name || 'Objeto'));

            const svgContent = item.svg
                ? item.svg.replace(/class="[^"]*"/, 'class="w-full h-full object-contain filter drop-shadow-sm"').replace(/w-10 h-10/, 'w-full h-full')
                : (item.image ? `<img src="${item.image}" alt="${name}" class="w-full h-full object-contain filter drop-shadow-sm">` : '');

            return `
    <div class="item-card flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3.5 bg-gray-50/80 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700/80 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-2xs hover:shadow-md transition-all duration-200 group" data-card-id="${item.id}" data-category="${catKey}" data-item-name="${name}">
        
        <!-- Icono SVG / Imagen del Item + Información -->
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1.5 sm:pr-2 flex-1">
            <div class="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center rounded-2xl p-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200/80 dark:border-gray-600/80 shadow-xs group-hover:scale-105 transition-transform duration-200">
                ${svgContent}
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-gray-900 dark:text-white leading-tight break-words whitespace-normal">${name}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    ${unitPriceStr}
                </p>
                <!-- Píldoras de Incremento Rápido (+1, +5, +10) -->
                <div class="flex items-center gap-1.5 mt-1.5">
                    <button type="button" class="btn-quick-add text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-200/80 hover:bg-indigo-600 hover:text-white dark:bg-gray-600 dark:hover:bg-indigo-500 text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer touch-manipulation" data-id="${item.id}" data-add="1">+1</button>
                    <button type="button" class="btn-quick-add text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-200/80 hover:bg-indigo-600 hover:text-white dark:bg-gray-600 dark:hover:bg-indigo-500 text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer touch-manipulation" data-id="${item.id}" data-add="5">+5</button>
                    <button type="button" class="btn-quick-add text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-gray-200/80 hover:bg-indigo-600 hover:text-white dark:bg-gray-600 dark:hover:bg-indigo-500 text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer touch-manipulation" data-id="${item.id}" data-add="10">+10</button>
                </div>
            </div>
        </div>

        <!-- Controles de Cantidad (+ / -) con Touch Targets Accesibles -->
        <div class="flex items-center justify-end gap-1 mt-2 sm:mt-0 bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-600 rounded-xl p-1 shadow-xs flex-shrink-0 self-end sm:self-center">
            <button type="button" 
                class="btn-decrement w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                data-id="${item.id}"
                aria-label="Disminuir cantidad de ${name}">-</button>
            
            <input type="number" 
                min="0" 
                value="0" 
                data-id="${item.id}"
                aria-label="Cantidad de ${name}"
                inputmode="numeric"
                pattern="[0-9]*"
                class="item-qty w-9 sm:w-10 text-center text-sm font-extrabold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
            
            <button type="button" 
                class="btn-increment w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                data-id="${item.id}"
                aria-label="Aumentar cantidad de ${name}">+</button>
        </div>
    </div>
`;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');

    function updateCardHighlight(input) {
        if (!input) return;
        const id = input.getAttribute('data-id');
        const card = container.querySelector(`.item-card[data-card-id="${id}"]`);
        const val = parseInt(input.value) || 0;
        if (card) {
            if (val > 0) {
                card.classList.add('bg-indigo-50/90', 'dark:bg-indigo-950/50', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-1', 'ring-indigo-400/30');
                card.classList.remove('bg-gray-50/80', 'dark:bg-gray-700/50');
            } else {
                card.classList.remove('bg-indigo-50/90', 'dark:bg-indigo-950/50', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-1', 'ring-indigo-400/30');
                card.classList.add('bg-gray-50/80', 'dark:bg-gray-700/50');
            }
        }
        // Disparar evento personalizado para actualizar la barra en vivo
        if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
            try {
                const event = (typeof CustomEvent === 'function') ? new CustomEvent('pokevalue:itemsChanged') : { type: 'pokevalue:itemsChanged' };
                document.dispatchEvent(event);
            } catch (_) {}
        }
    }

    // Escuchadores de botones + / - e inputs
    container.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('input', () => updateCardHighlight(input));
    });

    container.querySelectorAll('.btn-decrement').forEach(btn => {
        btn.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(10);
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                if (currentVal > 0) input.value = currentVal - 1;
                updateCardHighlight(input);
            }
        });
    });

    container.querySelectorAll('.btn-increment').forEach(btn => {
        btn.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(10);
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                input.value = currentVal + 1;
                updateCardHighlight(input);
            }
        });
    });

    // Escuchadores de píldoras de incremento rápido (+1, +5, +10)
    container.querySelectorAll('.btn-quick-add').forEach(btn => {
        btn.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(15);
            const id = btn.getAttribute('data-id');
            const toAdd = parseInt(btn.getAttribute('data-add')) || 1;
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                input.value = currentVal + toAdd;
                updateCardHighlight(input);
            }
        });
    });

    // Escuchadores de búsqueda y filtros de categoría
    const searchInput = (typeof document !== 'undefined' && typeof document.getElementById === 'function') ? document.getElementById('search-input') : null;
    if (searchInput && typeof searchInput.addEventListener === 'function') {
        searchInput.addEventListener('input', () => applyFilters());
    }

    const filterPills = (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') ? document.querySelectorAll('.category-pill') : [];
    filterPills.forEach(pill => {
        if (typeof pill.addEventListener === 'function') {
            pill.addEventListener('click', () => {
                IOSDeviceDetector.triggerHapticFeedback(10);
                const cat = pill.getAttribute('data-category') || 'all';
                toggleCategoryFilter(cat);
            });
        }
    });

    // Aplicar filtros iniciales
    applyFilters();
}
