import { CURRENCY_CONFIG, state } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { I18nController } from './I18nController.js';

export class CurrencyController {
    static detectCurrency() {
        const savedCurr = localStorage.getItem('currency');
        if (savedCurr) return savedCurr;

        if (typeof navigator !== 'undefined') {
            const navLang = (navigator.language || '').toLowerCase();
            let timeZone = '';
            try {
                timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            } catch (_) {}

            if (navLang === 'en-us' || navLang === 'es-us' || timeZone.startsWith('America/New_York') || timeZone.startsWith('America/Los_Angeles') || timeZone.startsWith('America/Chicago') || timeZone.startsWith('America/Denver') || timeZone.startsWith('America/Phoenix')) {
                return 'USD';
            }
        }

        return 'EUR';
    }

    static init() {
        const currSelect = document.getElementById('currency-select');
        const initialCurrency = CurrencyController.detectCurrency();
        
        if (currSelect) {
            currSelect.value = initialCurrency;
            state.currentCurrency = initialCurrency;
            
            currSelect.addEventListener('change', () => {
                const selectedCurr = currSelect.value;
                state.currentCurrency = selectedCurr;
                localStorage.setItem('currency', selectedCurr);
                CurrencyController.updateCurrencyUI();
                I18nController.reRenderItems();
            });
        }
        
        CurrencyController.updateCurrencyUI();
    }

    static updateCurrencyUI() {
        if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
        const currKey = state.currentCurrency || 'EUR';
        const curr = CURRENCY_CONFIG[currKey] || CURRENCY_CONFIG['EUR'];
        const isUSD = currKey === 'USD';
        const isCoins = currKey === 'POKECOINS';
        const prefix = t('boxPricePlaceholderPrefix') || 'Ej:';

        // 1. Mostrar/Ocultar aviso para USD
        const usdDisclaimer = typeof document.getElementById === 'function' ? document.getElementById('usd-disclaimer') : null;
        if (usdDisclaimer) {
            if (isUSD) {
                usdDisclaimer.innerText = t('disclaimerUSD') || '* Los precios se convierten en base a una tasa fija estimada respecto al Euro.';
                usdDisclaimer.classList.remove('hidden');
            } else {
                usdDisclaimer.classList.add('hidden');
            }
        }

        // 2. Actualizar símbolos de divisa sueltos
        document.querySelectorAll('.currency-symbol').forEach(el => {
            el.textContent = curr.symbol;
        });

        // 3. Actualizar etiquetas de la divisa (.currency-label-full)
        document.querySelectorAll('.currency-label-full').forEach(el => {
            el.textContent = `${currKey} ${curr.symbol}`;
        });

        // 4. Actualizar placeholder dinámico con 1.99 y el prefijo traducido
        const boxPriceInput = document.getElementById('box-price');
        if (boxPriceInput) {
            boxPriceInput.placeholder = isCoins ? `${prefix} 550` : `${prefix} 1.99`;
            boxPriceInput.step = isCoins ? '1' : '0.01';
        }
    }
}
