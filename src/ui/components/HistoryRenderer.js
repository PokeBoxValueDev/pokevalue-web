import { getHistory } from '../../../js/storage.js';
import { t } from '../../../js/i18n.js';

/**
 * Historial de cálculos previos.
 */
export function renderHistory(onRestore) {
    const historySection = document.getElementById('history-section');
    const container = document.getElementById('history-container');
    const history = getHistory();

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

        return `
            <div class="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
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
