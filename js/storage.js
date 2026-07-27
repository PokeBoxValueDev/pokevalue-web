// js/storage.js
import { state, CURRENCY_CONFIG } from './config.js';

// --- MODO OSCURO ---
export function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    document.getElementById('dark-mode-icon').innerText = isDark ? '☀️ Light' : '🌙 Dark';
}

export function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('dark-mode-icon').innerText = isDark ? '☀️ Light' : '🌙 Dark';
}

// --- DIVISA ---
export function initCurrency() {
    const select = document.getElementById('currency-select');
    if (select) select.value = state.currentCurrency;
    updateCurrencyUI();
}

export function updateCurrencyUI() {
    const currency = CURRENCY_CONFIG[state.currentCurrency];
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.innerText = currency.symbol;
    });
}

// --- HISTORIAL ---
export function saveToHistory(entry) {
    let history = JSON.parse(localStorage.getItem('pokevalue_history') || '[]');
    history.unshift(entry);
    if (history.length > 5) history.pop();
    localStorage.setItem('pokevalue_history', JSON.stringify(history));
}

export function getHistory() {
    return JSON.parse(localStorage.getItem('pokevalue_history') || '[]');
}

export function clearHistoryStorage() {
    localStorage.removeItem('pokevalue_history');
}