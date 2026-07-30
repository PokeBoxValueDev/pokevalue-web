import { CURRENCY_CONFIG, CATEGORY_CONFIG, state } from '../../config/config.js';
import { t } from '../../../js/i18n.js';
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
            <div class="space-y-2">
                <!-- Cabecera / Badge de la Categoría -->
                <div class="flex items-center gap-2 pt-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                    <span class="w-2.5 h-2.5 rounded-full ${config.color}"></span>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" data-i18n="${i18nKey}">
                        ${categoryLabel}
                    </span>
                </div>

                <!-- Lista de Objetos -->
                <div class="space-y-2">
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

            return `
    <div class="item-card flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200" data-card-id="${item.id}">
        
        <!-- Icono SVG / Imagen del Item + Información -->
        <div class="flex items-center gap-3 flex-1 pr-2">
            <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
                ${item.svg ? item.svg : (item.image ? `<img src="${item.image}" alt="${name}" class="w-full h-full object-contain">` : '')}
            </div>
            <div>
                <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${name}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">
                    ${unitPriceStr}
                </p>
            </div>
        </div>

        <!-- Controles de Cantidad (+ / -) con Touch Targets Accesibles (>= 40px) -->
        <div class="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-1 shadow-sm">
            <button type="button" 
                class="btn-decrement w-10 h-10 flex items-center justify-center text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
                data-id="${item.id}"
                aria-label="Disminuir cantidad de ${name}">-</button>
            
            <input type="number" 
                min="0" 
                value="0" 
                data-id="${item.id}"
                aria-label="Cantidad de ${name}"
                inputmode="numeric"
                pattern="[0-9]*"
                class="item-qty w-10 text-center text-sm font-extrabold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
            
            <button type="button" 
                class="btn-increment w-10 h-10 flex items-center justify-center text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95 touch-manipulation" 
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
                card.className = 'item-card flex items-center justify-between p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-400 dark:border-indigo-600 shadow-sm transition-all duration-200';
            } else {
                card.className = 'item-card flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200';
            }
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
}
