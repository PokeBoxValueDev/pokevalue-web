// js/app.js
import { APP_VERSION, JSON_URL, state } from './config.js';
import { initDarkMode, toggleDarkMode, initCurrency, updateCurrencyUI, saveToHistory, clearHistoryStorage } from './storage.js';
import { performCalculation } from './calculator.js';
import { renderItems, renderBreakdown, renderHistory, setupModals } from './ui.js';

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
    document.getElementById('btn-clear-history').addEventListener('click', () => {
        clearHistoryStorage();
        renderHistory(restoreCalculation);
    });

    document.getElementById('currency-select').addEventListener('change', (e) => {
        state.currentCurrency = e.target.value;
        localStorage.setItem('currency', state.currentCurrency);
        updateCurrencyUI();
        renderItems(state.storeData);
    });
}

async function fetchStoreData() {
    try {
        const response = await fetch(JSON_URL);
        const data = await response.json();
        state.storeData = data.objetos;
        document.getElementById('last-updated').innerText = `Data: ${data.last_updated}`;
        renderItems(state.storeData);
        renderHistory(restoreCalculation);
    } catch (error) {
        document.getElementById('items-container').innerHTML = `<p class="text-red-500 text-sm">Error al cargar datos.</p>`;
    }
}

function filterItems() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const filtered = state.storeData.filter(i => i.name.toLowerCase().includes(query));
    renderItems(filtered);
}

function calculate() {
    const boxPriceInput = document.getElementById('box-price');
    const boxPrice = parseFloat(boxPriceInput.value);

    if (isNaN(boxPrice) || boxPrice <= 0) {
        alert("Por favor, introduce un precio válido para la caja.");
        return;
    }

    const res = performCalculation(boxPrice);

    const resCard = document.getElementById('result-card');
    resCard.className = `p-6 rounded-xl text-center space-y-4 text-white ${res.isProfitable ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-rose-500 dark:bg-rose-600'}`;

    document.getElementById('result-title').innerText = res.isProfitable ? "¡OFERTA RENTABLE! 🎉" : "NO VALE LA PENA ❌";
    document.getElementById('res-box-price').innerText = `${res.boxPrice.toFixed(2)} ${res.curr.symbol}`;
    document.getElementById('res-real-value').innerText = `${res.totalValue.toFixed(2)} ${res.curr.symbol}`;
    document.getElementById('res-diff-label').innerText = res.isProfitable ? "Ahorras:" : "Pierdes:";
    document.getElementById('res-diff-val').innerText = `${Math.abs(res.diff).toFixed(2)} ${res.curr.symbol}`;

    renderBreakdown(res.categoryTotals, res.totalValue);

    const actionText = res.isProfitable ? `¡Ahorras ${Math.abs(res.diff).toFixed(2)} ${res.curr.symbol}!` : `Pierdes ${Math.abs(res.diff).toFixed(2)} ${res.curr.symbol}`;
    state.lastCalculationText = `Caja de ${res.boxPrice.toFixed(2)} ${res.curr.symbol}: ${actionText} (Valor real: ${res.totalValue.toFixed(2)} ${res.curr.symbol}). Calcúlalo tú también en: ${window.location.href}`;

    saveToHistory({
        boxPrice: res.boxPrice,
        totalValue: res.totalValue,
        isProfitable: res.isProfitable,
        diff: res.diff,
        currencySymbol: res.curr.symbol,
        items: res.selectedItems,
        itemQuantitiesMap: res.itemQuantitiesMap,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    renderHistory(restoreCalculation);

    if (window.gtag) {
        gtag('event', 'calculate_box', {
            'box_price': res.boxPrice,
            'total_value': res.totalValue,
            'currency': state.currentCurrency,
            'is_profitable': res.isProfitable
        });
    }

    document.getElementById('view-form').classList.add('hidden');
    document.getElementById('view-result').classList.remove('hidden');
}

async function shareResult() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'PokeBoxValue - Cálculo de Caja',
                text: state.lastCalculationText,
                url: window.location.href
            });
        } catch (err) {}
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