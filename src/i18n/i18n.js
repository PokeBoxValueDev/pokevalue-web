import es from './locales/es.js';
import en from './locales/en.js';
import { state } from '../config/config.js';

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
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    const lang = state.currentLang || 'es';

    // 1. Traducir elementos con atributo data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && translation !== key) {
            el.innerHTML = translation;
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

    // 3. Traducir dinámicamente el widget de Ko-fi si está presente
    const kofiTextElement = typeof document.querySelector === 'function' ? document.querySelector('.kofitext') : null;
    if (kofiTextElement) {
        // Reemplazar solo el texto para no borrar el icono de la taza (<img>)
        Array.from(kofiTextElement.childNodes).forEach(node => {
            if (node.nodeType === 3 && node.nodeValue.trim().length > 0) {
                node.nodeValue = ` ${t('coffeeBtn')}`;
            }
        });
    }

    // 4. Actualizar dinámicamente metatags de SEO y redes sociales
    const titleTranslation = t('metaTitle');
    if (titleTranslation) {
        document.title = titleTranslation;
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', titleTranslation);
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) twitterTitle.setAttribute('content', titleTranslation);
    }

    const descTranslation = t('metaDescription');
    if (descTranslation) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', descTranslation);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', descTranslation);

        const twitterDesc = document.querySelector('meta[name="twitter:description"]');
        if (twitterDesc) twitterDesc.setAttribute('content', descTranslation);
    }
}
