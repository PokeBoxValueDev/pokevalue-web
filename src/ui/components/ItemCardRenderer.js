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

const CATEGORY_PILL_ACTIVE_CLASSES = {
    all: 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50 font-bold',
    pases: 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50 font-bold',
    incubadoras: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/50 font-bold',
    potenciadores: 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/50 font-bold',
    mejoras: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50 font-bold',
    combates: 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400/50 font-bold',
    consumibles: 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400/50 font-bold',
    otros: 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/50 font-bold'
};

export function updateFilterPillsUI() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    const filterPills = document.querySelectorAll('.category-pill');
    filterPills.forEach(pill => {
        const cat = pill.getAttribute('data-category') || 'all';
        if (activeCategories.has(cat)) {
            const activeStyle = CATEGORY_PILL_ACTIVE_CLASSES[cat] || CATEGORY_PILL_ACTIVE_CLASSES.all;
            pill.className = `category-pill whitespace-nowrap px-3 py-1 rounded-full transition cursor-pointer touch-manipulation ${activeStyle}`;
        } else {
            pill.className = 'category-pill whitespace-nowrap px-3 py-1 rounded-full font-medium transition bg-gray-100 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer touch-manipulation';
        }
    });
}

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

/**
 * Muestra una animación flotante de feedback al interactuar (+5, +10, +1, -1)
 */
export function showFloatingFeedback(targetElement, text, isPositive = true) {
    if (!targetElement || typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    try {
        const rect = targetElement.getBoundingClientRect();
        const badge = document.createElement('span');
        badge.className = `floating-feedback ${isPositive ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`;
        badge.textContent = text;
        badge.style.left = `${rect.left + rect.width / 2}px`;
        badge.style.top = `${rect.top}px`;
        document.body.appendChild(badge);

        setTimeout(() => {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        }, 650);
    } catch (_) {}
}

/**
 * Cambia la densidad de vista entre lista y cuadrícula.
 */
export function setLayoutMode(mode = 'list') {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('items-container');
    const btnList = document.getElementById('btn-layout-list');
    const btnGrid = document.getElementById('btn-layout-grid');

    const activeMode = mode === 'grid' ? 'grid' : 'list';

    if (container) {
        if (activeMode === 'grid') {
            container.classList.add('items-layout-grid');
        } else {
            container.classList.remove('items-layout-grid');
        }
    }

    if (btnList && btnGrid) {
        if (activeMode === 'grid') {
            btnGrid.className = 'layout-toggle-btn p-1.5 rounded-md text-indigo-600 dark:text-white bg-white dark:bg-gray-800 shadow-xs transition';
            btnList.className = 'layout-toggle-btn p-1.5 rounded-md text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition';
        } else {
            btnList.className = 'layout-toggle-btn p-1.5 rounded-md text-indigo-600 dark:text-white bg-white dark:bg-gray-800 shadow-xs transition';
            btnGrid.className = 'layout-toggle-btn p-1.5 rounded-md text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition';
        }
    }

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('pokevalue_view_layout', activeMode);
        }
    } catch (_) {}
}

/**
 * Actualiza la bandeja de chips de objetos seleccionados (1C).
 */
export function updateSelectedTray() {
    if (typeof document === 'undefined') return;
    const tray = document.getElementById('selected-items-tray');
    const chipsList = document.getElementById('selected-chips-list');
    const container = document.getElementById('items-container');
    if (!tray || !chipsList || !container) return;

    const selectedCards = [];
    container.querySelectorAll('.item-card').forEach(card => {
        const input = card.querySelector('.item-qty');
        const qty = input ? (parseInt(input.value) || 0) : 0;
        if (qty > 0) {
            const id = card.getAttribute('data-card-id');
            const name = card.getAttribute('data-item-name') || 'Objeto';
            selectedCards.push({ id, name, qty, card, input });
        }
    });

    if (selectedCards.length === 0) {
        tray.classList.add('hidden');
        chipsList.innerHTML = '';
        return;
    }

    tray.classList.remove('hidden');
    chipsList.innerHTML = selectedCards.map(item => `
        <div class="selected-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800/60 shadow-2xs text-[11px] font-semibold text-gray-900 dark:text-white hover:border-indigo-400 transition cursor-pointer" data-id="${item.id}">
            <span class="px-1 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-extrabold">${item.qty}x</span>
            <span class="truncate max-w-[100px] sm:max-w-[150px]">${item.name}</span>
            <button type="button" class="btn-remove-chip p-0.5 text-gray-400 hover:text-rose-500 rounded transition cursor-pointer touch-manipulation" data-id="${item.id}" aria-label="Eliminar ${item.name}">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    `).join('');

    // Escuchador para borrar chips individuales
    chipsList.querySelectorAll('.btn-remove-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            IOSDeviceDetector.triggerHapticFeedback(10);
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                input.value = 0;
                try {
                    const evt = (typeof CustomEvent === 'function') ? new CustomEvent('input', { bubbles: true }) : { type: 'input' };
                    input.dispatchEvent(evt);
                } catch (_) {}
                const card = container.querySelector(`.item-card[data-card-id="${id}"]`);
                if (card) {
                    card.classList.remove('bg-indigo-50/90', 'dark:bg-indigo-950/50', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-1', 'ring-indigo-400/30');
                    card.classList.add('bg-gray-50/80', 'dark:bg-gray-700/50');
                }
                updateSelectedTray();
                if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
                    try {
                        const event = (typeof CustomEvent === 'function') ? new CustomEvent('pokevalue:itemsChanged') : { type: 'pokevalue:itemsChanged' };
                        document.dispatchEvent(event);
                    } catch (_) {}
                }
            }
        });
    });

    // Escuchador para hacer scroll hasta la tarjeta del objeto
    chipsList.querySelectorAll('.selected-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.getAttribute('data-id');
            const card = container.querySelector(`.item-card[data-card-id="${id}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('ring-4', 'ring-indigo-500/50');
                setTimeout(() => card.classList.remove('ring-4', 'ring-indigo-500/50'), 1000);
            }
        });
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
            <div class="category-group p-2.5 sm:p-3 rounded-2xl border ${config.containerBorder || config.border || 'border-gray-200 dark:border-gray-700'} ${config.containerBg || 'bg-gray-50/40 dark:bg-gray-800/40'} shadow-2xs space-y-2.5 transition-all" data-category="${catKey}">
                <!-- Cabecera / Banner estilizado a todo lo ancho con color de categoría -->
                <div class="w-full flex items-center justify-between px-3 py-1.5 rounded-xl ${config.bg || 'bg-gray-100 dark:bg-gray-800'} border ${config.border || 'border-gray-200/80 dark:border-gray-700/80'} shadow-2xs">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="w-2.5 h-2.5 rounded-full ${config.color} shadow-xs flex-shrink-0"></span>
                        <span class="text-xs font-bold uppercase tracking-wider ${config.text || 'text-gray-700 dark:text-gray-200'} truncate" data-i18n="${i18nKey}">
                            ${categoryLabel}
                        </span>
                    </div>
                    <span class="category-count-badge text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-800/80 ${config.text || 'text-gray-600 dark:text-gray-300'} shadow-2xs flex-shrink-0" data-category="${catKey}" data-total="${categoryItems.length}">
                        0/${categoryItems.length}
                    </span>
                </div>

                <!-- Lista / Grid de Objetos de la Categoría -->
                <div class="category-items-grid flex flex-col gap-2">
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

            const nameEs = item.nameEs || item.name_es || name;
            const nameEn = item.nameEn || item.name_en || name;

            return `
    <div class="item-card flex items-center justify-between p-2.5 sm:p-3 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-750 rounded-xl border border-gray-200/70 dark:border-gray-700/70 shadow-xs hover:shadow-sm transition-all duration-200 group" data-card-id="${item.id}" data-category="${catKey}" data-item-name="${name}" data-name-es="${nameEs}" data-name-en="${nameEn}">
        
        <!-- Icono + Información -->
        <div class="card-info-container flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1.5 flex-1">
            <div class="card-icon-wrapper w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border border-gray-200/80 dark:border-gray-600/80 shadow-xs">
                ${svgContent}
            </div>
            <div class="card-text-wrapper min-w-0 flex-1">
                <p class="card-item-title text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words whitespace-normal">${name}</p>
                <div class="card-quick-actions flex items-center gap-2 mt-0.5">
                    <span class="card-price-label text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">${unitPriceStr}</span>
                </div>
            </div>
        </div>

        <!-- Controles de Cantidad Stepper (+ / -) -->
        <div class="card-actions-container flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-600 rounded-xl p-0.5 sm:p-1 shadow-xs flex-shrink-0 ml-1">
            <div class="stepper-wrapper flex items-center gap-0.5 sm:gap-1">
                <button type="button" 
                    class="btn-decrement w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                    data-id="${item.id}"
                    aria-label="Disminuir cantidad de ${name}">-</button>
                
                <input type="number" 
                    min="0" 
                    value="0" 
                    data-id="${item.id}"
                    aria-label="Cantidad de ${name}"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    class="item-qty w-7 sm:w-8 text-center text-xs sm:text-sm font-extrabold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                
                <button type="button" 
                    class="btn-increment w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                    data-id="${item.id}"
                    aria-label="Aumentar cantidad de ${name}">+</button>
            </div>
        </div>
    </div>
`;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');

    function updateCategoryCountBadges() {
        if (!container || typeof container.querySelectorAll !== 'function') return;
        container.querySelectorAll('.category-group').forEach(group => {
            const badge = group.querySelector('.category-count-badge');
            if (!badge) return;
            const total = parseInt(badge.getAttribute('data-total')) || group.querySelectorAll('.item-card').length;
            let countWithData = 0;
            group.querySelectorAll('.item-card').forEach(card => {
                const input = card.querySelector('.item-qty');
                if (input && (parseInt(input.value) || 0) > 0) {
                    countWithData++;
                }
            });
            badge.textContent = `${countWithData}/${total}`;
        });
    }

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
        updateCategoryCountBadges();
        updateSelectedTray();
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
                if (currentVal > 0) {
                    input.value = currentVal - 1;
                    showFloatingFeedback(btn, '-1', false);
                }
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
                showFloatingFeedback(btn, '+1', true);
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

    // Escuchador de vaciar bandeja de items seleccionados
    const btnClearTray = (typeof document !== 'undefined') ? document.getElementById('btn-clear-tray') : null;
    if (btnClearTray && typeof btnClearTray.addEventListener === 'function') {
        btnClearTray.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(10);
            container.querySelectorAll('.item-qty').forEach(inp => {
                inp.value = 0;
            });
            container.querySelectorAll('.item-card').forEach(card => {
                card.classList.remove('bg-indigo-50/90', 'dark:bg-indigo-950/50', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-1', 'ring-indigo-400/30');
            });
            updateCategoryCountBadges();
            updateSelectedTray();
            if (typeof document !== 'undefined' && typeof document.dispatchEvent === 'function') {
                try {
                    const event = (typeof CustomEvent === 'function') ? new CustomEvent('pokevalue:itemsChanged') : { type: 'pokevalue:itemsChanged' };
                    document.dispatchEvent(event);
                } catch (_) {}
            }
        });
    }

    // Escuchadores de cambio de layout (Lista vs Cuadrícula)
    const btnList = (typeof document !== 'undefined') ? document.getElementById('btn-layout-list') : null;
    const btnGrid = (typeof document !== 'undefined') ? document.getElementById('btn-layout-grid') : null;
    if (btnList && typeof btnList.addEventListener === 'function') {
        btnList.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(10);
            setLayoutMode('list');
        });
    }
    if (btnGrid && typeof btnGrid.addEventListener === 'function') {
        btnGrid.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(10);
            setLayoutMode('grid');
        });
    }

    // Inicializar layout guardado
    let savedLayout = 'list';
    try {
        if (typeof localStorage !== 'undefined') {
            savedLayout = localStorage.getItem('pokevalue_view_layout') || 'list';
        }
    } catch (_) {}
    setLayoutMode(savedLayout);

    // Sincronizar contadores iniciales (0/N), bandeja y aplicar filtros
    updateCategoryCountBadges();
    updateSelectedTray();
    applyFilters();
}
