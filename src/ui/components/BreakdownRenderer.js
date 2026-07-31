import { CURRENCY_CONFIG, CATEGORY_CONFIG, state } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { Category } from '../../domain/valueObjects/Category.js';
import { getCategoryTranslation } from './ItemCardRenderer.js';

/**
 * Muestra el desglose por categorías en la tarjeta de resultados.
 */
export function renderBreakdown(categoryTotals, totalValue) {
    const breakdownContainer = document.getElementById('breakdown-legend');
    if (!breakdownContainer) return;

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
    const isCoins = state.currentCurrency === 'POKECOINS';

    let html = '';

    Object.entries(categoryTotals).forEach(([catKey, total]) => {
        if (total > 0) {
            const percentage = totalValue > 0 ? ((total / totalValue) * 100).toFixed(0) : 0;
            const config = CATEGORY_CONFIG[catKey] || { color: 'bg-gray-500', label: catKey };
            const label = getCategoryTranslation(catKey);
            const i18nKey = Category.getI18nKey(catKey);
            const formattedVal = isCoins ? Math.round(total) : total.toFixed(2);

            html += `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-semibold">
                        <span class="text-gray-700 dark:text-gray-300 flex items-center gap-1.5" data-i18n="${i18nKey}">
                            <span class="w-2 h-2 rounded-full ${config.color}"></span>
                            ${label}
                        </span>
                        <span class="text-gray-900 dark:text-white font-bold">${formattedVal} ${curr.symbol} (${percentage}%)</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div class="${config.color} h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
    });

    breakdownContainer.innerHTML = html || `<p class="text-xs text-gray-400 text-center" data-i18n="noItemsSelected">${t('noItemsSelected') || 'Sin desglose disponible'}</p>`;
}
