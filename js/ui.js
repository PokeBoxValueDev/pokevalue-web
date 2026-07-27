import { CATEGORY_CONFIG, CURRENCY_CONFIG, state } from './config.js';
import { getHistory } from './storage.js';
import { t } from './i18n.js';

export function renderItems(items) {
    const container = document.getElementById('items-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-2 text-center">No se encontraron objetos.</p>`;
        return;
    }

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { rate: 1, symbol: '€' };

    container.innerHTML = items.map(item => {
        const unitPrice = (item.unit_price_usd && state.currentCurrency === 'USD')
            ? item.unit_price_usd
            : (item.unit_price_eur || item.price_eur || 0) * curr.rate;

        const name = item.name || item.name_es || item.item || 'Objeto';

        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div class="flex-1 pr-2">
                    <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${name}</p>
                    <p class="text-[10px] text-gray-400 dark:text-gray-400">
                        ${unitPrice.toFixed(2)} ${curr.symbol} / u.
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <input type="number" 
                        min="0" 
                        value="0" 
                        data-id="${item.id}" 
                        class="item-qty w-16 px-2 py-1 text-center text-xs font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                </div>
            </div>
        `;
    }).join('');
}

export function renderBreakdown(categoryTotals, totalValue) {
    const bar = document.getElementById('breakdown-bar');
    const legend = document.getElementById('breakdown-legend');
    if (!bar || !legend) return;

    bar.innerHTML = '';
    legend.innerHTML = '';

    if (totalValue <= 0) return;

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };

    Object.keys(categoryTotals).forEach(cat => {
        const val = categoryTotals[cat];
        if (val > 0) {
            const pct = ((val / totalValue) * 100).toFixed(1);
            const config = CATEGORY_CONFIG[cat] || { color: 'bg-gray-500', label: cat };

            const segment = document.createElement('div');
            segment.className = `${config.color} h-full transition-all duration-300`;
            segment.style.width = `${pct}%`;
            bar.appendChild(segment);

            const legendItem = document.createElement('div');
            legendItem.className = 'flex items-center gap-1.5';
            legendItem.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full ${config.color}"></span>
                <span class="text-gray-600 dark:text-gray-300 font-medium">${t(cat) || config.label}:</span>
                <span class="font-bold text-gray-800 dark:text-gray-100">${val.toFixed(2)} ${curr.symbol} (${pct}%)</span>
            `;
            legend.appendChild(legendItem);
        }
    });
}

export function renderHistory(onSelectHistory) {
    const historyContainer = document.getElementById('history-container');
    const historySection = document.getElementById('history-section');
    if (!historyContainer || !historySection) return;

    const history = getHistory();

    if (history.length === 0) {
        historySection.classList.add('hidden');
        return;
    }

    historySection.classList.remove('hidden');
    historyContainer.innerHTML = history.map((h, i) => `
        <div data-index="${i}" class="history-item p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition flex justify-between items-center">
            <div>
                <span class="font-bold ${h.isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}">
                    ${h.boxPrice.toFixed(2)}${h.currencySymbol}
                </span>
                <span class="text-gray-400 mx-1">•</span>
                <span class="text-gray-600 dark:text-gray-300">${h.items ? h.items.join(', ') : ''}</span>
            </div>
            <span class="text-[10px] text-gray-400">${new Date(h.timestamp).toLocaleDateString()}</span>
        </div>
    `).join('');

    document.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = parseInt(el.getAttribute('data-index'));
            if (history[idx] && onSelectHistory) {
                onSelectHistory(history[idx]);
            }
        });
    });
}

export function setupModals() {
    const legalModal = document.getElementById('legal-modal');
    const privacyModal = document.getElementById('privacy-modal');

    const closeModal = (modal) => modal?.classList.add('hidden');

    document.getElementById('btn-legal')?.addEventListener('click', () => legalModal?.classList.remove('hidden'));
    document.getElementById('btn-privacy')?.addEventListener('click', () => privacyModal?.classList.remove('hidden'));

    [legalModal, privacyModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.tagName === 'BUTTON') closeModal(modal);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(legalModal);
            closeModal(privacyModal);
        }
    });
}