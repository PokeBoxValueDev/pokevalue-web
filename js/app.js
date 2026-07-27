import { APP_VERSION, JSON_URL, CURRENCY_CONFIG, state } from './config.js';
import { calculateResult } from './calculator.js';
import { saveCalculation, clearHistory } from './storage.js';
import { renderItems, renderBreakdown, renderHistory, setupModals } from './ui.js';
import { setLanguage, updateDOMTranslations, t } from './i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Configurar versión en UI
    const verEl = document.getElementById('app-version');
    if (verEl) verEl.innerText = `v${APP_VERSION}`;

    // --- 1. Modo Oscuro / Claro ---
    const themeBtn = document.getElementById('theme-toggle-btn');

    function applyTheme(isDark) {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.body.classList.remove('dark');
        }

        if (themeBtn) {
            themeBtn.innerHTML = isDark ? '☀️ Light' : '🌙 Dark';
        }
    }

    // Inicializar tema
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

    // --- 2. Idioma ---
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = state.currentLang;
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            renderItems(getFilteredItems());
        });
    }
    setLanguage(state.currentLang);

    // --- 3. Selector de Divisa ---
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
        currSelect.value = state.currentCurrency;
        currSelect.addEventListener('change', (e) => {
            state.currentCurrency = e.target.value;
            localStorage.setItem('currency', state.currentCurrency);
            updateDOMTranslations();
            renderItems(getFilteredItems());
        });
    }

    // --- 4. Carga de Datos JSON ---
    try {
        const response = await fetch(JSON_URL);
        const data = await response.json();

        // Extraer la lista de ítems sin importar la clave raíz usada
        state.storeData = Array.isArray(data) ? data : (data.items || data.storeData || []);

        const lastUpdatedEl = document.getElementById('last-updated');
        if (lastUpdatedEl && data.last_updated) {
            lastUpdatedEl.innerHTML = `<span data-i18n="lastUpdated">${t('lastUpdated')}</span>: ${data.last_updated}`;
        }

        renderItems(state.storeData);
    } catch (error) {
        console.error('Error al cargar items:', error);
        const container = document.getElementById('items-container');
        if (container) {
            container.innerHTML = `<p class="text-xs text-rose-500 py-2 text-center">${t('errorLoading') || 'Error al cargar objetos.'}</p>`;
        }
    }

    // --- 5. Búsqueda y Filtro ---
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

    // --- 6. Cálculo y Resultado ---
    const btnCalculate = document.getElementById('btn-calculate');
    const btnReset = document.getElementById('btn-reset');
    const viewForm = document.getElementById('view-form');
    const viewResult = document.getElementById('view-result');

    if (btnCalculate) {
        btnCalculate.addEventListener('click', () => {
            const priceInput = document.getElementById('box-price');
            const boxPrice = parseFloat(priceInput.value);

            if (isNaN(boxPrice) || boxPrice <= 0) {
                alert(t('alertInvalidPrice') || 'Por favor, introduce un precio válido para la caja.');
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

            // Renderizar resultado
            const resCard = document.getElementById('result-card');
            const resTitle = document.getElementById('result-title');
            const resDiffLabel = document.getElementById('res-diff-label');
            const resDiffVal = document.getElementById('res-diff-val');

            if (document.getElementById('res-box-price')) document.getElementById('res-box-price').innerText = `${boxPrice.toFixed(2)} ${curr.symbol}`;
            if (document.getElementById('res-real-value')) document.getElementById('res-real-value').innerText = `${res.totalValue.toFixed(2)} ${curr.symbol}`;

            if (resCard && resTitle && resDiffLabel && resDiffVal) {
                if (res.isProfitable) {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-emerald-600 shadow-lg';
                    resTitle.innerText = `🎉 ${t('resProfitable') || '¡Renta comprarla!'}`;
                    resDiffLabel.innerText = t('resSavings') || 'Ahorras:';
                    resDiffVal.innerText = `+${res.diff.toFixed(2)} ${curr.symbol}`;
                } else {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-rose-600 shadow-lg';
                    resTitle.innerText = `⚠️ ${t('resNotProfitable') || 'No renta comprarla'}`;
                    resDiffLabel.innerText = t('resLoss') || 'Pierdes:';
                    resDiffVal.innerText = `${res.diff.toFixed(2)} ${curr.symbol}`;
                }
            }

            // Desglose
            renderBreakdown(res.categoryTotals, res.totalValue);

            // Guardar Historial
            saveCalculation({
                boxPrice,
                totalValue: res.totalValue,
                diff: res.diff,
                isProfitable: res.isProfitable,
                currencySymbol: curr.symbol,
                items: res.itemSummary
            });

            state.lastCalculationText = `Caja PokeboxValue: Precio ${boxPrice.toFixed(2)}${curr.symbol} | Valor: ${res.totalValue.toFixed(2)}${curr.symbol} (${res.isProfitable ? 'Ahorras' : 'Pierdes'} ${Math.abs(res.diff).toFixed(2)}${curr.symbol})`;

            // Cambiar vista
            if (viewForm) viewForm.classList.add('hidden');
            if (viewResult) viewResult.classList.remove('hidden');
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

    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'PokeBoxValue',
                        text: state.lastCalculationText,
                        url: window.location.href
                    });
                } catch (e) {
                    console.log('Compartir cancelado');
                }
            } else {
                await navigator.clipboard.writeText(state.lastCalculationText);
                alert(t('alertCopied') || '¡Resultado copiado al portapapeles!');
            }
        });
    }

    setupModals();
    renderHistory(restoreFromHistory);
});