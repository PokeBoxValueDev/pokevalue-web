// js/app.js
import { APP_VERSION, JSON_URL, CATEGORY_CONFIG, CURRENCY_CONFIG, state } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-version').innerText = `v${APP_VERSION}`;
    initDarkMode();
    initCurrency();
    fetchStoreData();
    bindEvents();
    setupModals();
});

function bindEvents() {
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleDarkMode);
    document.getElementById('search-input').addEventListener('input', filterItems);
    document.getElementById('btn-calculate').addEventListener('click', calculate);
    document.getElementById('btn-share').addEventListener('click', shareResult);
    document.getElementById('btn-reset').addEventListener('click', resetCalculator);
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);

    document.getElementById('currency-select').addEventListener('change', (e) => {
        state.currentCurrency = e.target.value;
        localStorage.setItem('currency', state.currentCurrency);
        updateCurrencyUI();
        renderItems(state.storeData);
    });
}

// --- MODO OSCURO ---
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById('dark-mode-icon').innerText = '☀️ Light';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('dark-mode-icon').innerText = '🌙 Dark';
    }
}

function toggleDarkMode() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('dark-mode-icon').innerText = '🌙 Dark';
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('dark-mode-icon').innerText = '☀️ Light';
    }
}

// --- MANEJO DE DIVISAS ---
function initCurrency() {
    const select = document.getElementById('currency-select');
    if (select) select.value = state.currentCurrency;
    updateCurrencyUI();
}

function updateCurrencyUI() {
    const currency = CURRENCY_CONFIG[state.currentCurrency];
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.innerText = currency.symbol;
    });
}

// --- DATOS Y API ---
async function fetchStoreData() {
    try {
        const response = await fetch(JSON_URL);
        const data = await response.json();
        state.storeData = data.objetos;
        document.getElementById('last-updated').innerText = `Data: ${data.last_updated}`;
        renderItems(state.storeData);
        renderHistory();
    } catch (error) {
        document.getElementById('items-container').innerHTML = `<p class="text-red-500 text-sm">Error al cargar datos.</p>`;
    }
}

function getCategoryKey(item) {
    const name = item.name.toLowerCase();
    if (name.includes('pase') || name.includes('raid')) return 'pases';
    if (name.includes('incubadora')) return 'incubadoras';
    if (name.includes('poción') || name.includes('pocion') || name.includes('revivir')) return 'consumibles';
    return 'otros';
}

function renderItems(items) {
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

function filterItems() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = state.storeData.filter(i => i.name.toLowerCase().includes(query));
    renderItems(filtered);
}

// --- CÁLCULOS Y DESGLOSE ---
function calculate() {
    const boxPriceInput = document.getElementById('box-price');
    const boxPrice = parseFloat(boxPriceInput.value);

    if (isNaN(boxPrice) || boxPrice <= 0) {
        alert("Por favor, introduce un precio válido para la caja.");
        return;
    }

    const curr = CURRENCY_CONFIG[state.currentCurrency];
    let totalValue = 0;
    const selectedItems = [];
    const itemQuantitiesMap = {};
    const categoryTotals = { pases: 0, incubadoras: 0, consumibles: 0, otros: 0 };

    document.querySelectorAll('.item-qty').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const itemId = input.getAttribute('data-id');
        const item = state.storeData.find(i => i.id === itemId);

        if (item && qty > 0) {
            const itemVal = (item.unit_price_eur * curr.rate) * qty;
            totalValue += itemVal;

            const cat = getCategoryKey(item);
            categoryTotals[cat] += itemVal;

            selectedItems.push(`${qty}x ${item.name}`);
            itemQuantitiesMap[itemId] = qty;
        }
    });

    const diff = totalValue - boxPrice;
    const isProfitable = diff > 0;

    const resCard = document.getElementById('result-card');
    resCard.className = `p-6 rounded-xl text-center space-y-4 text-white ${isProfitable ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-rose-500 dark:bg-rose-600'}`;

    document.getElementById('result-title').innerText = isProfitable ? "¡OFERTA RENTABLE! 🎉" : "NO VALE LA PENA ❌";
    document.getElementById('res-box-price').innerText = `${boxPrice.toFixed(2)} ${curr.symbol}`;
    document.getElementById('res-real-value').innerText = `${totalValue.toFixed(2)} ${curr.symbol}`;
    document.getElementById('res-diff-label').innerText = isProfitable ? "Ahorras:" : "Pierdes:";
    document.getElementById('res-diff-val').innerText = `${Math.abs(diff).toFixed(2)} ${curr.symbol}`;

    renderBreakdown(categoryTotals, totalValue);

    const actionText = isProfitable ? `¡Ahorras ${Math.abs(diff).toFixed(2)} ${curr.symbol}!` : `Pierdes ${Math.abs(diff).toFixed(2)} ${curr.symbol}`;
    state.lastCalculationText = `Caja de ${boxPrice.toFixed(2)} ${curr.symbol}: ${actionText} (Valor real: ${totalValue.toFixed(2)} ${curr.symbol}). Calcúlalo tú también en: ${window.location.href}`;

    saveToHistory({
        boxPrice,
        totalValue,
        isProfitable,
        diff,
        currencySymbol: curr.symbol,
        items: selectedItems,
        itemQuantitiesMap,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (window.gtag) {
        gtag('event', 'calculate_box', {
            'box_price': boxPrice,
            'total_value': totalValue,
            'currency': state.currentCurrency,
            'is_profitable': isProfitable
        });
    }

    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-result').classList.remove('hidden');
}

function renderBreakdown(categoryTotals, totalValue) {
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

// --- WEB SHARE API NATIVA ---
async function shareResult() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'PokeBoxValue - Cálculo de Caja',
                text: state.lastCalculationText,
                url: window.location.href
            });
        } catch (err) {
            // Usuario cancela la acción
        }
    } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(state.lastCalculationText);
        alert("¡Resultado copiado al portapapeles!");
    } else {
        alert(state.lastCalculationText);
    }
}

function resetCalculator() {
    document.getElementById('box-price').value = '';
    document.querySelectorAll('.item-qty').forEach(input => input.value = 0);
    document.getElementById('search-input').value = '';
    renderItems(state.storeData);

    document.getElementById('view-result').classList.add('hidden');
    document.getElementById('view-form').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- LOCALSTORAGE & RESTAURACIÓN ---
function saveToHistory(entry) {
    let history = JSON.parse(localStorage.getItem('pokevalue_history') || '[]');
    history.unshift(entry);
    if (history.length > 5) history.pop();
    localStorage.setItem('pokevalue_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('pokevalue_history') || '[]');
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

        card.addEventListener('click', () => restoreCalculation(item));
        container.appendChild(card);
    });
}

function restoreCalculation(historyItem) {
    resetCalculator();

    document.getElementById('box-price').value = historyItem.boxPrice;

    if (historyItem.itemQuantitiesMap) {
        Object.entries(historyItem.itemQuantitiesMap).forEach(([itemId, qty]) => {
            const input = document.getElementById(`qty-${itemId}`);
            if (input) input.value = qty;
        });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearHistory() {
    localStorage.removeItem('pokevalue_history');
    renderHistory();
}

// --- MANEJO DE MODALES ---
function setupModals() {
    const legalModal = document.getElementById('legal-modal');
    const privacyModal = document.getElementById('privacy-modal');

    const closeModal = (modal) => modal?.classList.add('hidden');

    document.getElementById('btn-legal')?.addEventListener('click', () => legalModal?.classList.remove('hidden'));
    document.getElementById('btn-privacy')?.addEventListener('click', () => privacyModal?.classList.remove('hidden'));

    [legalModal, privacyModal].forEach(modal => {
        if (!modal) return;

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.tagName === 'BUTTON') {
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(legalModal);
            closeModal(privacyModal);
        }
    });
}