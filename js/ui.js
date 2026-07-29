import { CURRENCY_CONFIG, CATEGORY_CONFIG, state } from './config.js';
import { getHistory } from './storage.js';
import { t } from './i18n.js';

/**
 * Renderiza la lista de objetos agrupados por categoría.
 */
export function renderItems(items) {
    const container = document.getElementById('items-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-2 text-center" data-i18n="noItemsFound">No se encontraron objetos.</p>`;
        return;
    }

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { rate: 1, symbol: '€' };
    const isCoins = state.currentCurrency === 'POKECOINS';

    // 1. Agrupar items por categoría
    const grouped = items.reduce((acc, item) => {
        const catKey = (item.category || item.categoria || 'otros').toLowerCase();
        if (!acc[catKey]) acc[catKey] = [];
        acc[catKey].push(item);
        return acc;
    }, {});

    // 2. Generar el HTML agrupado por categorías
    container.innerHTML = Object.entries(grouped).map(([catKey, categoryItems]) => {
        const config = CATEGORY_CONFIG[catKey] || { color: 'bg-gray-500', label: catKey };
        const categoryLabel = t(catKey) || config.label || catKey.toUpperCase();

        return `
            <div class="space-y-2">
                <!-- Cabecera / Badge de la Categoría -->
                <div class="flex items-center gap-2 pt-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                    <span class="w-2.5 h-2.5 rounded-full ${config.color}"></span>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        ${categoryLabel}
                    </span>
                </div>

                <!-- Lista de Objetos -->
                <div class="space-y-2">
                    ${categoryItems.map(item => {
            let unitPriceStr = '';

            if (isCoins) {
                const coins = item.unit_price_coins ?? Math.round((item.unit_price_eur || 0) * curr.rate);
                unitPriceStr = `${coins} <span class="currency-symbol">${curr.symbol}</span> / u.`;
            } else if (state.currentCurrency === 'USD' && item.unit_price_usd) {
                unitPriceStr = `${item.unit_price_usd.toFixed(2)} <span class="currency-symbol">${curr.symbol}</span> / u.`;
            } else {
                const price = (item.unit_price_eur || item.price_eur || 0) * curr.rate;
                unitPriceStr = `${price.toFixed(2)} <span class="currency-symbol">${curr.symbol}</span> / u.`;
            }

            // Selección de nombre dinámico según idioma activo
            const name = (state.currentLang === 'en' && item.name_en)
                ? item.name_en
                : (item.name_es || item.name || item.item || 'Objeto');

            return `
                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div class="flex-1 pr-2">
                                    <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${name}</p>
                                    <p class="text-[10px] text-gray-400 dark:text-gray-400">
                                        ${unitPriceStr}
                                    </p>
                                </div>
                                <div class="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-1">
                                    <button type="button" 
                                        class="btn-decrement w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition active:scale-95" 
                                        data-id="${item.id}">-</button>
                                    
                                    <input type="number" 
                                        min="0" 
                                        value="0" 
                                        data-id="${item.id}" 
                                        class="item-qty w-10 text-center text-xs font-bold bg-transparent text-gray-800 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                                    
                                    <button type="button" 
                                        class="btn-increment w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition active:scale-95" 
                                        data-id="${item.id}">+</button>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Escuchadores de botones + / -
    container.querySelectorAll('.btn-decrement').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                if (currentVal > 0) input.value = currentVal - 1;
            }
        });
    });

    container.querySelectorAll('.btn-increment').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                input.value = currentVal + 1;
            }
        });
    });
}

/**
 * Actualiza etiquetas globales de divisa, placeholders y steps en el DOM.
 */
export function updateCurrencyUI() {
    const currKey = state.currentCurrency || 'EUR';
    const curr = CURRENCY_CONFIG[currKey] || CURRENCY_CONFIG.EUR;
    const isCoins = currKey === 'POKECOINS';

    // 1. Actualizar símbolos simples (€, $, 🟡)
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = curr.symbol;
    });

    // 2. Actualizar la etiqueta completa del precio (ej: "EUR €", "USD $", "POKECOINS 🟡")
    document.querySelectorAll('.currency-label-full').forEach(el => {
        el.textContent = `${currKey} ${curr.symbol}`;
    });

    // 3. Ajustar placeholder y step del input de precio de caja
    const boxPriceInput = document.getElementById('box-price');
    if (boxPriceInput) {
        boxPriceInput.placeholder = isCoins ? 'Ej: 550' : 'Ej: 8.99';
        boxPriceInput.step = isCoins ? '1' : '0.01';
    }
}

/**
 * Muestra el desglose por categorías en la tarjeta de resultados.
 */
export function renderBreakdown(categoryTotals, totalValue) {
    const breakdownContainer = document.getElementById('result-breakdown');
    if (!breakdownContainer) return;

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
    const isCoins = state.currentCurrency === 'POKECOINS';

    let html = '';

    Object.entries(categoryTotals).forEach(([catKey, total]) => {
        if (total > 0) {
            const percentage = totalValue > 0 ? ((total / totalValue) * 100).toFixed(0) : 0;
            const config = CATEGORY_CONFIG[catKey] || { color: 'bg-gray-500', label: catKey };
            const label = t(catKey) || config.label || catKey.toUpperCase();
            const formattedVal = isCoins ? Math.round(total) : total.toFixed(2);

            html += `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-semibold">
                        <span class="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
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

    breakdownContainer.innerHTML = html || `<p class="text-xs text-gray-400 text-center">${t('noItemsSelected') || 'Sin deslose disponible'}</p>`;
}

/**
 * Historial de cálculos previos.
 */
export function renderHistory(onRestore) {
    const container = document.getElementById('history-list');
    if (!container) return;

    const history = getHistory();

    if (history.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 text-center py-4" data-i18n="emptyHistory">No hay cálculos guardados aún.</p>`;
        return;
    }

    container.innerHTML = history.map((item) => {
        const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusColor = item.isProfitable ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-rose-500 bg-rose-50 dark:bg-rose-950/30';
        const badgeText = item.isProfitable ? (t('badgeProfitable') || 'Rentable') : (t('badgeNotProfitable') || 'No rentable');

        return `
            <div class="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold ${statusColor} px-2 py-0.5 rounded-full">${badgeText}</span>
                        <span class="text-[10px] text-gray-400">${dateStr}</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300">
                        Precio: <b>${item.boxPrice}${item.currencySymbol}</b> | Valor: <b>${item.totalValue.toFixed(2)}${item.currencySymbol}</b>
                    </p>
                </div>
                <button 
                    type="button" 
                    class="btn-restore text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    data-price="${item.boxPrice}">
                    ${t('btnRestore') || 'Cargar'}
                </button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-restore').forEach(btn => {
        btn.addEventListener('click', () => {
            const price = btn.getAttribute('data-price');
            if (onRestore) onRestore({ boxPrice: price });
        });
    });
}

/**
 * Configuración de modales de la interfaz.
 */
export function setupModals() {
    const modalHistory = document.getElementById('modal-history');
    const btnOpenHistory = document.getElementById('btn-open-history');
    const btnCloseHistory = document.getElementById('btn-close-history');

    if (btnOpenHistory && modalHistory) {
        btnOpenHistory.addEventListener('click', () => modalHistory.classList.remove('hidden'));
    }

    if (btnCloseHistory && modalHistory) {
        btnCloseHistory.addEventListener('click', () => modalHistory.classList.add('hidden'));
    }

    if (modalHistory) {
        modalHistory.addEventListener('click', (e) => {
            if (e.target === modalHistory) modalHistory.classList.add('hidden');
        });
    }
}