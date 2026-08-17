import { HistoryRepository } from '../../infrastructure/repositories/HistoryRepository.js';
import { t } from '../../i18n/i18n.js';

/**
 * Historial de cálculos previos.
 */
export function renderHistory(onRestore) {
    const historySection = document.getElementById('history-section');
    const container = document.getElementById('history-container');
    const history = HistoryRepository.getHistory();

    if (!container) return;

    if (history.length === 0) {
        if (historySection) historySection.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    if (historySection) historySection.classList.remove('hidden');

    container.innerHTML = history.map((item) => {
        const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Formatear decimales según la divisa del registro
        const isCoins = item.currencySymbol === '🟡' || item.currencySymbol === 'coins';
        const formattedBoxPrice = isCoins ? Math.round(item.boxPrice) : Number(item.boxPrice).toFixed(2);
        const formattedTotalValue = isCoins ? Math.round(item.totalValue) : Number(item.totalValue).toFixed(2);

        const statusColor = item.isProfitable
            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            : 'text-rose-500 bg-rose-50 dark:bg-rose-950/30';

        const badgeKey = item.isProfitable ? 'badgeProfitable' : 'badgeNotProfitable';
        const badgeText = t(badgeKey) || (item.isProfitable ? 'Rentable' : 'No rentable');

        const customNameHtml = item.boxName ? `
            <div class="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white">
                <svg class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                <span class="truncate max-w-[160px] sm:max-w-[240px]">${item.boxName}</span>
            </div>
        ` : '';

        return `
            <div class="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
                    ${customNameHtml}
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold ${statusColor} px-2 py-0.5 rounded-full" data-i18n="${badgeKey}">
                            ${badgeText}
                        </span>
                        <span class="text-[10px] text-gray-400">${dateStr}</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300">
                        <span data-i18n="resBoxPrice">${t('resBoxPrice')}</span> <b>${formattedBoxPrice}${item.currencySymbol}</b> | 
                        <span data-i18n="resRealValue">${t('resRealValue')}</span> <b>${formattedTotalValue}${item.currencySymbol}</b>
                    </p>
                </div>
                <button 
                    type="button" 
                    class="btn-restore text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    data-index="${history.indexOf(item)}"
                    data-i18n="btnRestore">
                    ${t('btnRestore')}
                </button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-restore').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            if (onRestore) onRestore(history[index]);
        });
    });
}
