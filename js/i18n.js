import { state } from './config.js';
import es from './locales/es.js';
import en from './locales/en.js';

const translations = { es, en };

export function t(key) {
    return translations[state.currentLang]?.[key] || key;
}

export function setLanguage(lang) {
    state.currentLang = lang;
    localStorage.setItem('lang', lang);
    updateDOMTranslations();
}

export function updateDOMTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerText = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Visibilidad del disclaimer USD
    const usdNotice = document.getElementById('usd-disclaimer');
    if (usdNotice) {
        usdNotice.classList.toggle('hidden', state.currentCurrency !== 'USD');
    }

    // Actualiza los símbolos de divisa en la plantilla
    const currSymbol = state.currentCurrency === 'USD' ? '$' : '€';
    document.querySelectorAll('.currency-symbol').forEach(el => el.innerText = currSymbol);
}