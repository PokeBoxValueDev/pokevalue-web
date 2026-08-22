import { CURRENCY_CONFIG, CATEGORY_CONFIG, state } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { Category } from '../../domain/valueObjects/Category.js';
import { bindClick, dispatchCustomEvent } from '../utils/DomUtils.js';
import {
    getCategoryTranslation,
    toggleCategoryFilter,
    setCategoryFilter,
    getActiveCategories,
    getActiveCategoryFilter,
    updateFilterPillsUI,
    applyFilters
} from './CategoryFilterManager.js';
import { updateSelectedTray, showFloatingFeedback } from './SelectedTrayRenderer.js';

// Re-exportar para compatibilidad total con consumidores existentes y tests
export {
    getCategoryTranslation,
    toggleCategoryFilter,
    setCategoryFilter,
    getActiveCategories,
    getActiveCategoryFilter,
    updateFilterPillsUI,
    applyFilters,
    updateSelectedTray,
    showFloatingFeedback
};

/**
 * Aplica el modo de visualización: 'list' (Lista) o 'grid' (Cuadrícula).
 * @param {'list'|'grid'} mode
 */
export function setLayoutMode(mode) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('items-container');
    const btnList = document.getElementById('btn-layout-list');
    const btnGrid = document.getElementById('btn-layout-grid');
    const isMobile = typeof window !== 'undefined' && (window.innerWidth < 640 || (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 639px)').matches));

    const activeMode = (mode === 'grid' || (isMobile && mode !== 'list')) ? 'grid' : 'list';

    if (container) {
        container.classList.remove('items-layout-list', 'items-layout-grid', 'layout-list', 'layout-grid');
        container.classList.add(`items-layout-${activeMode}`, `layout-mode-${activeMode}`);

        container.querySelectorAll('.category-items-grid').forEach(grid => {
            if (activeMode === 'grid') {
                grid.className = 'category-items-grid grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2 sm:gap-2.5';
            } else {
                grid.className = 'category-items-grid flex flex-col gap-2';
            }
        });

        container.querySelectorAll('.item-card').forEach(card => {
            const infoContainer = card.querySelector('.card-info-container');
            const iconWrapper = card.querySelector('.card-icon-wrapper');
            const textWrapper = card.querySelector('.card-text-wrapper');
            const itemTitle = card.querySelector('.card-item-title');
            const priceLabel = card.querySelector('.card-price-label');
            const actionsContainer = card.querySelector('.card-actions-container');
            const quickActions = card.querySelector('.card-quick-actions');

            if (activeMode === 'grid') {
                card.className = 'item-card flex flex-col items-stretch justify-between p-2 sm:p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs hover:shadow-xs transition-all duration-200 group text-center min-h-[140px]';
                if (infoContainer) infoContainer.className = 'card-info-container flex flex-col items-center gap-1.5 w-full min-w-0 pr-0 flex-1 justify-start';
                if (iconWrapper) iconWrapper.className = 'card-icon-wrapper w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/80 dark:border-gray-600/80 shadow-2xs mx-auto';
                if (textWrapper) textWrapper.className = 'card-text-wrapper min-w-0 w-full flex flex-col items-center justify-center';
                if (itemTitle) itemTitle.className = 'card-item-title text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 min-h-[2.2em] flex items-center justify-center';
                if (quickActions) quickActions.className = 'card-quick-actions flex items-center justify-center gap-1 mt-0.5';
                if (priceLabel) priceLabel.className = 'card-price-label text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap';
                if (actionsContainer) actionsContainer.className = 'card-actions-container flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-600 rounded-xl p-0.5 shadow-2xs w-full max-w-[120px] mx-auto mt-1.5 flex-shrink-0';
            } else {
                card.className = 'item-card flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs hover:shadow-xs transition-all duration-200 group text-left min-h-0';
                if (infoContainer) infoContainer.className = 'card-info-container flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1.5 flex-1';
                if (iconWrapper) iconWrapper.className = 'card-icon-wrapper w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/80 dark:border-gray-600/80 shadow-2xs';
                if (textWrapper) textWrapper.className = 'card-text-wrapper min-w-0 flex-1';
                if (itemTitle) itemTitle.className = 'card-item-title text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words whitespace-normal';
                if (quickActions) quickActions.className = 'card-quick-actions flex items-center gap-2 mt-0.5';
                if (priceLabel) priceLabel.className = 'card-price-label text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap';
                if (actionsContainer) actionsContainer.className = 'card-actions-container flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-600 rounded-xl p-0.5 sm:p-1 shadow-2xs flex-shrink-0 ml-1';
            }
        });
    }

    if (btnList && btnGrid) {
        if (activeMode === 'list') {
            btnList.className = 'layout-toggle-btn p-1.5 rounded-md text-indigo-600 dark:text-white bg-white dark:bg-gray-800 shadow-xs transition';
            btnGrid.className = 'layout-toggle-btn p-1.5 rounded-md text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition';
        } else {
            btnGrid.className = 'layout-toggle-btn p-1.5 rounded-md text-indigo-600 dark:text-white bg-white dark:bg-gray-800 shadow-xs transition';
            btnList.className = 'layout-toggle-btn p-1.5 rounded-md text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition';
        }
    }

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('pokevalue_view_layout', activeMode);
        }
    } catch (_) {}
}

/**
 * Renderiza el catálogo de objetos de la tienda agrupados por categorías en el DOM.
 * @param {Array} items - Lista de objetos de la tienda
 */
export function renderItems(items = []) {
    const container = typeof document !== 'undefined' ? document.getElementById('items-container') : null;
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div id="items-loading-skeleton" class="animate-pulse space-y-3 py-2 col-span-full">
                <span class="sr-only" data-i18n="loadingItems">${t('loadingItems')}</span>
                <div class="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
                    <div class="flex items-center gap-3">
                        <div class="w-14 h-14 bg-gray-200 dark:bg-gray-600 rounded-2xl"></div>
                        <div class="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                    <div class="h-8 w-24 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                </div>
            </div>
        `;
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
                            : ((state.currentLang === 'en' && item.name_en) ? item.name_en : (item.name_es || item.name || t('defaultItem') || 'Objeto'));

                        const svgContent = item.svg
                            ? item.svg.replace(/class="[^"]*"/, 'class="w-full h-full object-contain filter drop-shadow-sm block mx-auto"').replace(/w-10 h-10/, 'w-full h-full')
                            : (item.image ? `<img src="${item.image}" alt="${name}" class="w-full h-full object-contain filter drop-shadow-sm block mx-auto">` : '');

                        const nameEs = item.nameEs || item.name_es || name;
                        const nameEn = item.nameEn || item.name_en || name;

                        return `
    <div class="item-card flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-xl border border-gray-200/80 dark:border-gray-700/80 shadow-2xs hover:shadow-xs transition-all duration-200 group" data-card-id="${item.id}" data-category="${catKey}" data-item-name="${name}" data-name-es="${nameEs}" data-name-en="${nameEn}">
        <div class="card-info-container flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1.5 flex-1">
            <div class="card-icon-wrapper w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200/80 dark:border-gray-600/80 shadow-2xs">
                ${svgContent}
            </div>
            <div class="card-text-wrapper min-w-0 flex-1">
                <p class="card-item-title text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight break-words whitespace-normal">${name}</p>
                <div class="card-quick-actions flex items-center gap-2 mt-0.5">
                    <span class="card-price-label text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">${unitPriceStr}</span>
                </div>
            </div>
        </div>

        <div class="card-actions-container flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-600 rounded-xl p-0.5 sm:p-1 shadow-xs flex-shrink-0 ml-1">
            <div class="stepper-wrapper flex items-center gap-0.5 sm:gap-1">
                <button type="button" 
                    class="btn-decrement w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                    data-id="${item.id}"
                    aria-label="${t('decrementQty') || 'Disminuir cantidad de'} ${name}">-</button>
                
                <input type="number" 
                    min="0" 
                    value="0" 
                    data-id="${item.id}"
                    aria-label="${t('quantityOf') || 'Cantidad de'} ${name}"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    class="item-qty w-7 sm:w-8 text-center text-xs sm:text-sm font-extrabold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                
                <button type="button" 
                    class="btn-increment w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm sm:text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                    data-id="${item.id}"
                    aria-label="${t('incrementQty') || 'Aumentar cantidad de'} ${name}">+</button>
            </div>
        </div>
    </div>`;
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
                card.classList.add('bg-indigo-50/90', 'dark:bg-indigo-950/60', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-2', 'ring-indigo-400/30', 'is-selected');
                card.classList.remove('bg-white/90', 'dark:bg-gray-800/90');
            } else {
                card.classList.remove('bg-indigo-50/90', 'dark:bg-indigo-950/60', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-2', 'ring-indigo-400/30', 'is-selected');
                card.classList.add('bg-white/90', 'dark:bg-gray-800/90');
            }
        }
        updateCategoryCountBadges();
        updateSelectedTray();
        dispatchCustomEvent('pokevalue:itemsChanged');
    }

    // Escuchadores de inputs y steppers
    container.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('input', () => updateCardHighlight(input));
    });

    container.querySelectorAll('.btn-decrement').forEach(btn => {
        bindClick(btn, () => {
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
        }, { haptic: 10 });
    });

    container.querySelectorAll('.btn-increment').forEach(btn => {
        bindClick(btn, () => {
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                input.value = currentVal + 1;
                showFloatingFeedback(btn, '+1', true);
                updateCardHighlight(input);
            }
        }, { haptic: 10 });
    });

    // Escuchadores de búsqueda y píldoras de filtrado
    if (typeof document !== 'undefined') {
        const searchInput = typeof document.getElementById === 'function' ? document.getElementById('search-input') : null;
        if (searchInput && typeof searchInput.addEventListener === 'function') {
            searchInput.addEventListener('input', () => applyFilters());
        }

        if (typeof document.querySelectorAll === 'function') {
            document.querySelectorAll('.category-pill').forEach(pill => {
                bindClick(pill, () => {
                    const cat = pill.getAttribute('data-category') || 'all';
                    toggleCategoryFilter(cat);
                }, { haptic: 10 });
            });
        }
    }

    // Escuchador de vaciado de bandeja
    bindClick('btn-clear-tray', () => {
        container.querySelectorAll('.item-qty').forEach(inp => {
            inp.value = 0;
        });
        container.querySelectorAll('.item-card').forEach(card => {
            card.classList.remove('bg-indigo-50/90', 'dark:bg-indigo-950/50', 'border-indigo-400', 'dark:border-indigo-500', 'shadow-md', 'ring-1', 'ring-indigo-400/30');
        });
        updateCategoryCountBadges();
        updateSelectedTray();
        dispatchCustomEvent('pokevalue:itemsChanged');
    }, { haptic: 10 });

    // Escuchadores de cambio de layout
    bindClick('btn-layout-list', () => setLayoutMode('list'), { haptic: 10 });
    bindClick('btn-layout-grid', () => setLayoutMode('grid'), { haptic: 10 });

    // Inicializar layout guardado o por defecto según dispositivo
    let initialLayout = 'list';
    try {
        if (typeof localStorage !== 'undefined') {
            const stored = localStorage.getItem('pokevalue_view_layout');
            if (stored) {
                initialLayout = stored;
            } else {
                const isMobile = (typeof window !== 'undefined' && (window.innerWidth < 640 || (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 639px)').matches)));
                initialLayout = isMobile ? 'grid' : 'list';
            }
        }
    } catch (_) {}
    setLayoutMode(initialLayout);

    // Sincronizar contadores, bandeja y filtros
    updateCategoryCountBadges();
    updateSelectedTray();
    applyFilters();
}
