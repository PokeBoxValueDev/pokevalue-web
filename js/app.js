import { APP_VERSION, JSON_URL, CURRENCY_CONFIG, state } from './config.js';
import { calculateResult } from './calculator.js';
import { saveCalculation, clearHistory } from './storage.js';
import { renderItems, renderBreakdown, renderHistory, setupModals, updateCurrencyUI } from './ui.js';
import { setLanguage, updateDOMTranslations, t } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Versión
    const verEl = document.getElementById('app-version');
    if (verEl) verEl.innerText = `v${APP_VERSION}`;

    // 2. Modo Oscuro / Claro
    const themeBtn = document.getElementById('theme-toggle-btn');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');

    function applyTheme(dark) {
        if (dark) {
            document.documentElement.classList.add('dark');
            if (lightIcon) lightIcon.classList.remove('hidden');
            if (darkIcon) darkIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if (lightIcon) lightIcon.classList.add('hidden');
            if (darkIcon) darkIcon.classList.remove('hidden');
        }
    }

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    applyTheme(isDark);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            isDark = !document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            applyTheme(isDark);
        });
    }

    // 3. Idioma
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = state.currentLang;
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            renderItems(getFilteredItems());
        });
    }
    setLanguage(state.currentLang);

    // 4. Divisa & Actualización Dinámica
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
        currSelect.value = state.currentCurrency;
        currSelect.addEventListener('change', (e) => {
            state.currentCurrency = e.target.value;
            localStorage.setItem('currency', state.currentCurrency);
            updateDOMTranslations();
            updateCurrencyUI();
        });
    }

    // Sincronizar UI inicial de divisa (.currency-symbol, placeholder y step)
    updateCurrencyUI();

    // 5. Carga JSON
    try {
        const response = await fetch(JSON_URL);
        const data = await response.json();

        // Mapea usando data.objetos del JSON
        const list = Array.isArray(data)
            ? data
            : (data.objetos || data.store_items || data.items || data.storeData || []);

        state.storeData = list.map((item, index) => ({
            id: item.id || `item-${index}`,
            name: item.name || item.name_es || item.item || 'Objeto',
            unit_price_eur: item.unit_price_eur ?? item.price_eur ?? item.unit_price ?? 0,
            ...item
        }));

        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            const updatedDate = data.last_updated || data.updated_at || '';
            lastUpdatedEl.innerHTML = `<span data-i18n="lastUpdated">${t('lastUpdated')}</span>: ${updatedDate}`;
        }

        renderItems(state.storeData);
    } catch (error) {
        console.error('Error al cargar items:', error);
        const container = document.getElementById('items-container');
        if (container) {
            container.innerHTML = `<p class="text-xs text-rose-500 py-2 text-center">Error al cargar objetos de la tienda.</p>`;
        }
    }

    // 6. Buscador
    const searchInput = document.getElementById('search-input');
    function getFilteredItems() {
        const query = searchInput?.value.toLowerCase().trim() || '';
        if (!query) return state.storeData;
        return state.storeData.filter(i => {
            const name = (i.name || i.name_es || i.item || '').toLowerCase();
            return name.includes(query);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderItems(getFilteredItems());
        });
    }

    // 7. Cálculo
    const btnCalculate = document.getElementById('btn-calculate');
    const btnReset = document.getElementById('btn-reset');
    const viewForm = document.getElementById('view-form');
    const viewResult = document.getElementById('view-result');
    const priceInput = document.getElementById('box-price');
    const priceError = document.getElementById('box-price-error');

    if (priceInput) {
        priceInput.addEventListener('input', () => {
            if (priceInput.value && parseFloat(priceInput.value) > 0) {
                priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
                if (priceError) priceError.classList.add('hidden');
            }
        });
    }

    if (btnCalculate) {
        btnCalculate.addEventListener('click', () => {
            const priceInput = document.getElementById('box-price');
            const priceError = document.getElementById('box-price-error');
            const boxPrice = parseFloat(priceInput.value);

            priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
            if (priceError) priceError.classList.add('hidden');

            if (isNaN(boxPrice) || boxPrice <= 0) {
                priceInput.classList.add('border-rose-500', 'focus:ring-rose-500');

                if (priceError) {
                    priceError.innerText = t('enterValidPrice');
                    priceError.classList.remove('hidden');
                }

                priceInput.focus();
                return;
            }

            const quantities = {};
            document.querySelectorAll('.item-qty').forEach(input => {
                const qty = parseInt(input.value) || 0;
                if (qty > 0) {
                    quantities[input.getAttribute('data-id')] = qty;
                }
            });

            if (Object.keys(quantities).length === 0) {
                alert(t('alertNoItems') || 'Selecciona al menos un objeto.');
                return;
            }

            const res = calculateResult(boxPrice, quantities, state.storeData, state.currentCurrency);
            const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
            const isCoins = state.currentCurrency === 'POKECOINS';

            // Formateadores según la divisa
            const fmtBoxPrice = isCoins ? Math.round(boxPrice) : boxPrice.toFixed(2);
            const fmtTotalValue = isCoins ? Math.round(res.totalValue) : res.totalValue.toFixed(2);
            const fmtDiff = isCoins ? Math.round(Math.abs(res.diff)) : Math.abs(res.diff).toFixed(2);

            const resCard = document.getElementById('result-card');
            const resTitle = document.getElementById('result-title');
            const resDiffLabel = document.getElementById('res-diff-label');
            const resDiffVal = document.getElementById('res-diff-val');

            if (document.getElementById('res-box-price')) document.getElementById('res-box-price').innerText = `${fmtBoxPrice} ${curr.symbol}`;
            if (document.getElementById('res-real-value')) document.getElementById('res-real-value').innerText = `${fmtTotalValue} ${curr.symbol}`;

            if (resCard && resTitle && resDiffLabel && resDiffVal) {
                if (res.isProfitable) {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-emerald-600 shadow-lg';
                    resTitle.innerText = `🎉 ${t('titleProfitable') || '¡Renta comprarla!'}`;
                    resDiffLabel.innerText = t('resDiffSave') || 'Ahorras:';
                    resDiffVal.innerText = `+${fmtDiff} ${curr.symbol}`;
                } else {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-rose-600 shadow-lg';
                    resTitle.innerText = `⚠️ ${t('titleNotProfitable') || 'No renta comprarla'}`;
                    resDiffLabel.innerText = t('resDiffLose') || 'Pierdes:';
                    resDiffVal.innerText = `-${fmtDiff} ${curr.symbol}`;
                }
            }

            renderBreakdown(res.categoryTotals, res.totalValue);

            saveCalculation({
                boxPrice,
                totalValue: res.totalValue,
                diff: res.diff,
                isProfitable: res.isProfitable,
                currencySymbol: curr.symbol,
                items: res.itemSummary
            });

            state.lastCalculationText = `PokeBoxValue: Precio ${fmtBoxPrice}${curr.symbol} | Valor: ${fmtTotalValue}${curr.symbol}`;

            if (viewForm) viewForm.classList.add('hidden');
            if (viewResult) viewResult.classList.remove('hidden');
        });
    }

    // 8. Compartir nativo
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'PokeBoxValue',
                        text: state.lastCalculationText || '¡Calcula el valor de las cajas en PokeBoxValue!',
                        url: window.location.href
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error('Error al compartir:', err);
                    }
                }
            }
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (viewResult) viewResult.classList.add('hidden');
            if (viewForm) viewForm.classList.remove('hidden');
            renderHistory(restoreFromHistory);
        });
    }

    function restoreFromHistory(item) {
        const priceInput = document.getElementById('box-price');
        if (priceInput) priceInput.value = item.boxPrice;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            clearHistory();
            renderHistory(restoreFromHistory);
        });
    }

    setupModals();
    renderHistory(restoreFromHistory);
});