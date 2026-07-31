import { setLanguage, updateDOMTranslations } from '../../i18n/i18n.js';
import { CurrencyController } from './CurrencyController.js';
import { CalculatorController } from './CalculatorController.js';
import { renderItems } from '../components/ItemCardRenderer.js';
import { state } from '../../config/config.js';

export class I18nController {
    static init() {
        const langSelect = document.getElementById('lang-select');
        const initialLang = localStorage.getItem('lang') || 'es';
        
        if (langSelect) {
            langSelect.value = initialLang;
            setLanguage(initialLang);
            updateDOMTranslations();
            
            langSelect.addEventListener('change', () => {
                setLanguage(langSelect.value);
                updateDOMTranslations();
                CurrencyController.updateCurrencyUI();
                
                // Re-render items to update translations
                const filteredItems = state.storeData || []; // Simplification, getFilteredItems was in app.js
                // We actually need the original filter logic. If there's a search input, we filter by it.
                // Let's implement a static method to re-render items based on search state.
                I18nController.reRenderItems();
                
                if (state.lastResult) {
                    CalculatorController.reRenderResults(state.lastResult);
                }
            });
        }
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
