import { APP_VERSION, JSON_URL, FALLBACK_JSON_URL, CURRENCY_CONFIG, state } from './config.js';
import { calculateResult } from './calculator.js';
import { saveCalculation, clearHistory } from './storage.js';
import { renderItems, renderBreakdown, renderHistory, setupModals, updateCurrencyUI, animateValue, triggerConfetti } from './ui.js';
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

    // Función auxiliar de filtrado para reutilizar en Búsqueda, Divisas e Idiomas
    const searchInput = document.getElementById('search-input');
    function getFilteredItems() {
        const query = searchInput?.value.toLowerCase().trim() || '';
        if (!query) return state.storeData;
        return state.storeData.filter(i => {
            const nameEs = (i.name_es || i.name || '').toLowerCase();
            const nameEn = (i.name_en || i.name || '').toLowerCase();
            return nameEs.includes(query) || nameEn.includes(query);
        });
    }

    // 3. Idioma
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = state.currentLang;
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            updateDOMTranslations();

            // Refresca la interfaz de divisas para actualizar placeholders (Ej: / Ex:)
            updateCurrencyUI();

            renderItems(getFilteredItems());
        });
    }
    setLanguage(state.currentLang);
    updateDOMTranslations();

    // 4. Divisa & Actualización Dinámica
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
        currSelect.value = state.currentCurrency;
        currSelect.addEventListener('change', (e) => {
            state.currentCurrency = e.target.value;
            localStorage.setItem('currency', state.currentCurrency);

            // Actualiza traducciones del DOM, labels, placeholders y aviso de USD
            updateDOMTranslations();
            updateCurrencyUI();

            // Re-renderiza los objetos con los precios convertidos
            renderItems(getFilteredItems());
        });
    }

    // Sincronizar UI inicial de la divisa seleccionada
    updateCurrencyUI();

    // 5. Carga JSON con Respaldo (GitHub RAW -> Service Worker Cache -> Local Fallback)
    let data = null;
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        data = await response.json();
    } catch (error) {
        console.warn('Fallo al obtener items.json de la red, intentando cargar fallback local:', error);
        try {
            const fallbackRes = await fetch(FALLBACK_JSON_URL);
            if (!fallbackRes.ok) throw new Error(`HTTP Fallback Error ${fallbackRes.status}`);
            data = await fallbackRes.json();
        } catch (fallbackErr) {
            console.error('Error al cargar datos del respaldo local:', fallbackErr);
        }
    }

    if (data) {
        const list = Array.isArray(data)
            ? data
            : (data.objetos || data.store_items || data.items || data.storeData || []);

        state.storeData = list.map((item, index) => ({
            id: item.id || `item-${index}`,
            name_es: item.name_es || item.name || item.item || 'Objeto',
            name_en: item.name_en || item.name || item.item || 'Item',
            unit_price_eur: item.unit_price_eur ?? item.price_eur ?? item.unit_price ?? 0,
            ...item
        }));

        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl) {
            const updatedDate = data.last_updated || data.updated_at || '';
            lastUpdatedEl.innerHTML = `<span data-i18n="lastUpdated">${t('lastUpdated')}</span>: ${updatedDate}`;
        }

        renderItems(getFilteredItems());
    } else {
        const container = document.getElementById('items-container');
        if (container) {
            container.innerHTML = `<p class="text-xs text-rose-500 py-2 text-center">Error al cargar objetos de la tienda.</p>`;
        }
    }

    // 6. Buscador
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
            const decimals = isCoins ? 0 : 2;

            // Formateadores según la divisa para el texto guardado
            const fmtBoxPrice = isCoins ? Math.round(boxPrice) : boxPrice.toFixed(2);
            const fmtTotalValue = isCoins ? Math.round(res.totalValue) : res.totalValue.toFixed(2);

            const resCard = document.getElementById('result-card');
            const resTitle = document.getElementById('result-title');
            const resDiffLabel = document.getElementById('res-diff-label');
            const resDiffVal = document.getElementById('res-diff-val');
            const resBoxPriceEl = document.getElementById('res-box-price');
            const resRealValueEl = document.getElementById('res-real-value');

            if (viewForm) viewForm.classList.add('hidden');
            if (viewResult) viewResult.classList.remove('hidden');

            // Animación de conteo numérico (Count-Up)
            if (resBoxPriceEl) animateValue(resBoxPriceEl, 0, boxPrice, 700, '', ` ${curr.symbol}`, decimals);
            if (resRealValueEl) animateValue(resRealValueEl, 0, res.totalValue, 850, '', ` ${curr.symbol}`, decimals);

            if (resCard && resTitle && resDiffLabel && resDiffVal) {
                if (res.isProfitable) {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-emerald-600 shadow-lg';
                    resTitle.innerText = `🎉 ${t('titleProfitable') || '¡Renta comprarla!'}`;
                    resDiffLabel.innerText = t('resDiffSave') || 'Ahorras:';
                    animateValue(resDiffVal, 0, Math.abs(res.diff), 900, `+`, ` ${curr.symbol}`, decimals);

                    // Lanzar efecto de confeti si la caja supera o iguala el 30% de ahorro
                    if (res.savingsPercent >= 30) {
                        setTimeout(() => {
                            triggerConfetti();
                        }, 250);
                    }
                } else {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-rose-600 shadow-lg';
                    resTitle.innerText = `⚠️ ${t('titleNotProfitable') || 'No renta comprarla'}`;
                    resDiffLabel.innerText = t('resDiffLose') || 'Pierdes:';
                    animateValue(resDiffVal, 0, Math.abs(res.diff), 900, `-`, ` ${curr.symbol}`, decimals);
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

            saveCalculation({
                boxPrice,
                totalValue: res.totalValue,
                diff: res.diff,
                isProfitable: res.isProfitable,
                currencySymbol: curr.symbol,
                items: res.itemSummary
            });

            renderHistory(restoreFromHistory);
            const historySection = document.getElementById('history-section');
            if (historySection) historySection.classList.remove('hidden');

            state.lastCalculationText = `PokeBoxValue: Precio ${fmtBoxPrice}${curr.symbol} | Valor: ${fmtTotalValue}${curr.symbol}`;
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

    // 9. Volver al inicio al hacer clic en el logo/título
    const siteLogo = document.getElementById('site-logo');
    if (siteLogo) {
        siteLogo.addEventListener('click', () => {
            if (viewResult) viewResult.classList.add('hidden');
            if (viewForm) viewForm.classList.remove('hidden');

            if (priceInput) priceInput.value = '';
            document.querySelectorAll('.item-qty').forEach(input => input.value = '0');

            window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if (getHistory().length > 0) {
        const historySection = document.getElementById('history-section');
        if (historySection) historySection.classList.remove('hidden');
    }

    // 10. Registro de Service Worker (PWA & Offline)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .catch(err => console.error('Error al registrar Service Worker:', err));
        });
    }
});