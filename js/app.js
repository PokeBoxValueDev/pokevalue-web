// js/app.js
import { APP_VERSION, JSON_URL, CATEGORY_CONFIG, state } from './config.js';

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('app-version').innerText = `v${APP_VERSION}`;
    initDarkMode();
    fetchStoreData();
    bindEvents();
});

function bindEvents() {
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleDarkMode);
    document.getElementById('search-input').addEventListener('input', filterItems);
    document.getElementById('btn-calculate').addEventListener('click', calculate);
    document.getElementById('btn-share').addEventListener('click', shareResult);
    document.getElementById('btn-reset').addEventListener('click', resetCalculator);
    document.getElementById('btn-clear-history').addEventListener('click', clearHistory);
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

// --- DATOS Y API ---
async function fetchStoreData() {
    try {
        const response = await fetch(JSON_URL);
        const data = await response.json();
        state.storeData = data.objetos;
        document.getElementById('last-updated').innerText = `Actualizado: ${data.last_updated}`;
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
            const div = document.createElement('div');
            div.className = `flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg ${config.border}`;
            div.innerHTML = `
                <div class="space-y-0.5">
                    <p class="font-medium text-sm text-gray-800 dark:text-gray-100">${item.name}</p>
                    <p class="text-xs text-gray-400">${item.unit_price_eur.toFixed(2)} €/ud</p>
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

    // Event listeners para los botones + y -
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

// --- CÁLCULOS Y VISTAS ---
function calculate() {
    const boxPriceInput = document.getElementById('box-price');
    const boxPrice = parseFloat(boxPriceInput.value);

    if (isNaN(boxPrice) || boxPrice <= 0) {
        alert("Por favor, introduce un precio válido para la caja.");
        return;
    }

    let totalValue = 0;
    document.querySelectorAll('.item-qty').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const itemId = input.getAttribute('data-id');
        const item = state.storeData.find(i => i.id === itemId);
        if (item && qty > 0) totalValue += item.unit_price_eur * qty;
    });

    const diff = totalValue - boxPrice;
    const isProfitable = diff > 0;

    const resCard = document.getElementById('result-card');
    resCard.className = `p-6 rounded-xl text-center space-y-4 text-white ${isProfitable ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-rose-500 dark:bg-rose-600'}`;

    document.getElementById('result-title').innerText = isProfitable ? "¡OFERTA RENTABLE! 🎉" : "NO VALE LA PENA ❌";
    document.getElementById('res-box-price').innerText = boxPrice.toFixed(2) + " €";
    document.getElementById('res-real-value').innerText = totalValue.toFixed(2) + " €";
    document.getElementById('res-diff-label').innerText = isProfitable ? "Ahorras:" : "Pierdes:";
    document.getElementById('res-diff-val').innerText = Math.abs(diff).toFixed(2) + " €";

    const actionText = isProfitable ? `¡Ahorras ${Math.abs(diff).toFixed(2)} €!` : `Pierdes ${Math.abs(diff).toFixed(2)} €`;
    state.lastCalculationText = `Caja de ${boxPrice.toFixed(2)} €: ${actionText} (Valor real: ${totalValue.toFixed(2)} €). ¡Pruébala en PokeValue Web!`;

    saveToHistory({ boxPrice, totalValue, isProfitable, diff, date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });

    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-result').classList.remove('hidden');
}

function shareResult() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(state.lastCalculationText);
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

// --- LOCALSTORAGE & HISTORIAL ---
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
    container.innerHTML = history.map(item => `
        <div class="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
            <span class="text-gray-600 dark:text-gray-300">${item.date} - Caja: <strong>${item.boxPrice.toFixed(2)}€</strong></span>
            <span class="${item.isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'} font-bold">
                ${item.isProfitable ? '+' : ''}${(item.diff).toFixed(2)}€
            </span>
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem('pokevalue_history');
    renderHistory();
}