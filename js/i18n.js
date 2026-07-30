import es from './locales/es.js';
import en from './locales/en.js';
import { state } from './config.js';

export const translations = { es, en };

export function t(key) {
    const lang = state.currentLang || 'es';
    return translations[lang]?.[key] || translations['es']?.[key] || key;
}

export function setLanguage(lang) {
    if (translations[lang]) {
        state.currentLang = lang;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lang', lang);
        }
    }
}

export function updateDOMTranslations() {
    const lang = state.currentLang || 'es';

    // 1. Traducir elementos con atributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && translation !== key) {
            el.innerText = translation;
        }
    });

    // 2. Traducir placeholders con atributo data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation && translation !== key) {
            el.placeholder = translation;
        }
    });
}