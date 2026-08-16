import { setLanguage, updateDOMTranslations } from '../../i18n/i18n.js';
import { CurrencyController } from './CurrencyController.js';
import { CalculatorController } from './CalculatorController.js';
import { renderItems } from '../components/ItemCardRenderer.js';
import { state } from '../../config/config.js';

export class I18nController {
    static detectLanguage() {
        const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null;
        if (savedLang) return savedLang;

        if (typeof navigator !== 'undefined') {
            const browserLang = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
            if (browserLang.startsWith('es')) {
                return 'es';
            }
            if (browserLang.startsWith('en')) {
                return 'en';
            }
        }
        return 'es';
    }

    static applyLanguage(lang) {
        state.setLanguage(lang);
        setLanguage(lang);
        updateDOMTranslations();

        const langSelect = typeof document !== 'undefined' ? document.getElementById('lang-select') : null;
        if (langSelect && langSelect.value !== lang) {
            langSelect.value = lang;
        }

        CurrencyController.updateCurrencyUI();
        I18nController.reRenderItems();

        if (state.lastResult) {
            CalculatorController.reRenderResults(state.lastResult);
        }
    }

    static init() {
        const langSelect = typeof document !== 'undefined' ? document.getElementById('lang-select') : null;
        const initialLang = I18nController.detectLanguage();
        
        if (langSelect) {
            langSelect.value = initialLang;
        }
        I18nController.applyLanguage(initialLang);
    }

    static reRenderItems() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value.toLowerCase() : '';
        let items = state.storeData || [];

        if (query) {
            items = items.filter(item => {
                const nameEs = (item.name_es || item.name || '').toLowerCase();
                const nameEn = (item.name_en || '').toLowerCase();
                return nameEs.includes(query) || nameEn.includes(query);
            });
        }
        renderItems(items);
    }
}
