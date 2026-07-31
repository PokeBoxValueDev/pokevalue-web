import { CURRENCY_CONFIG, state } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { I18nController } from './I18nController.js';

export class CurrencyController {
    static init() {
        const currSelect = document.getElementById('currency-select');
        const initialCurrency = localStorage.getItem('currency') || 'EUR';
        
        if (currSelect) {
            currSelect.value = initialCurrency;
            state.currentCurrency = initialCurrency;
            
            currSelect.addEventListener('change', () => {
                state.currentCurrency = currSelect.value;
                localStorage.setItem('currency', currSelect.value);
                CurrencyController.updateCurrencyUI();
                I18nController.reRenderItems();
            });
        }
        
        CurrencyController.updateCurrencyUI();
    }

    static updateCurrencyUI() {
        const currKey = state.currentCurrency || 'EUR';
        const curr = CURRENCY_CONFIG[currKey] || CURRENCY_CONFIG.EUR;
        const isCoins = currKey === 'POKECOINS';
        const isUSD = currKey === 'USD';
        const isEn = state.currentLang === 'en';

        // Prefijo según el idioma seleccionado
        const prefix = isEn ? 'Ex:' : 'Ej:';

        // 1. Mostrar/Ocultar aviso para USD
        const usdDisclaimer = document.getElementById('usd-disclaimer');
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
