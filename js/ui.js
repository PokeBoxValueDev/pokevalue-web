// js/ui.js
import { CATEGORY_CONFIG, CURRENCY_CONFIG, state } from './config.js';
import { getCategoryKey } from './calculator.js';
import { getHistory, clearHistoryStorage } from './storage.js';

export function renderItems(items) {
    const container = document.getElementById('items-container');
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-2 text-center">No se encontraron objetos.</p>`;
        return;
    }

    const grouped = { pases: [], incubadoras: [], consumibles: [], otros: [] };
    items.forEach(item => grouped[getCategoryKey(item)].push(item));

    const curr = CURRENCY_CONFIG[state.currentCurrency];

    Object.keys(CATEGORY_CONFIG).forEach(catKey => {
        const itemList = grouped[catKey];
        if (itemList.length === 0) return;

        const config = CATEGORY_CONFIG[catKey];
        const section = document.createElement('div');
        section.className = 'space-y-2';

        const header = document.createElement('div');
        header.className = `px-2 py-1 rounded text-xs font-bold tracking-wide uppercase ${config.bg} ${config.text}`;
        header.innerText = config.title;
        section.appendChild(header);

        itemList.forEach(item => {
            const convertedUnitPrice = item.unit_price_eur * curr.rate;
            const div = document.createElement('div');
            div.className = `flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${config.border}`;
            div.innerHTML = `
                <div class="space-y-0.5">
                    <p class="font-medium text-sm text-gray-800 dark:text-gray-100">${item.name}</p>
                    <p class="text-xs text-gray-400">${convertedUnitPrice.toFixed(2)} ${curr.symbol}/ud</p>
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" data-action="decrement" data-id="${item.id}" class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md font-bold text-base transition-colors">-</button>
                    <input type="number" min="0" value="0" data-id="${item.id}" id="qty-${item.id}" class="item-qty w-12 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md text-center text-sm font-semibold focus:ring-1 focus:ring-indigo-500">
                    <button type="button" data-action="increment" data-id="${item.id}" class="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-md font-bold text-base transition-colors">+</button>
                </div>
            `;
            section.appendChild(div);
        });

        container.appendChild(section);
    });

    container.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.getAttribute('data-action');
            const id = e.currentTarget.getAttribute('data-id');
            const input = document.getElementById(`qty-${id}`);
            if (!input) return;

            let currentValue = parseInt(input.value) || 0;
            if (action === 'increment') {
                input.value = currentValue + 1;
            } else if (action === 'decrement' && currentValue > 0) {
                input.value = currentValue - 1;
            }
        });
    });
}

export function renderBreakdown(categoryTotals, totalValue) {
    const bar = document.getElementById('breakdown-bar');
    const legend = document.getElementById('breakdown-legend');
    bar.innerHTML = '';
    legend.innerHTML = '';

    if (totalValue === 0) return;

    const colors = {
        pases: 'bg-indigo-500',
        incubadoras: 'bg-amber-500',
        consumibles: 'bg-emerald-500',
        otros: 'bg-sky-500'
    };

    Object.keys(categoryTotals).forEach(cat => {
        const val = categoryTotals[cat];
        if (val <= 0) return;

        const pct = Math.round((val / totalValue) * 100);
        const title = CATEGORY_CONFIG[cat]?.title || cat;

        const seg = document.createElement('div');
        seg.className = `${colors[cat]} h-full transition-all duration-500`;
        seg.style.width = `${pct}%`;
        seg.title = `${title}: ${pct}%`;
        bar.appendChild(seg);

        const legItem = document.createElement('div');
        legItem.className = 'flex items-center gap-1.5 text-gray-600 dark:text-gray-300';
        legItem.innerHTML = `
            <span class="w-2.5 h-2.5 rounded-full ${colors[cat]}"></span>
            <span>${title}: <strong>${pct}%</strong></span>
        `;
        legend.appendChild(legItem);
    });
}

export function renderHistory(restoreCallback) {
    const history = getHistory();
    const container = document.getElementById('history-container');
    const section = document.getElementById('history-section');

    if (history.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = '';

    history.forEach((item) => {
        const itemsText = item.items && item.items.length > 0 ? ` (${item.items.join(', ')})` : '';
        const symbol = item.currencySymbol || '€';

        const card = document.createElement('div');
        card.className = 'flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-pointer transition-colors group';
        card.setAttribute('title', 'Haz clic para restaurar este cálculo');

        card.innerHTML = `
            <div class="flex-1 pr-2">
                <span class="text-gray-600 dark:text-gray-300 text-xs">
                    ${item.date} - Caja: <strong>${item.boxPrice.toFixed(2)}${symbol}</strong>
                    <span class="text-gray-400 text-[11px]">${itemsText}</span>
                </span>
            </div>
            <div class="flex items-center gap-2">
                <span class="${item.isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'} font-bold text-xs">
                    ${item.isProfitable ? '+' : ''}${(item.diff).toFixed(2)}${symbol}
                </span>
                <span class="text-xs text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">↩</span>
            </div>
        `;

        card.addEventListener('click', () => restoreCallback(item));
        container.appendChild(card);
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