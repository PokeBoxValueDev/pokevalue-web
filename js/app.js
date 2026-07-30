import { APP_VERSION, CURRENCY_CONFIG, state } from './config.js';
import { calculateResult } from './calculator.js';
import { saveCalculation, clearHistory, getHistory } from './storage.js';
import { renderItems, renderBreakdown, renderHistory, setupModals, updateCurrencyUI, animateValue, triggerConfetti, renderGradeBadge, renderKeyMetrics, generateSocialCardCanvas } from './ui.js';
import { setLanguage, updateDOMTranslations, t } from './i18n.js';
import { ItemsRepository } from '../src/infrastructure/repositories/ItemsRepository.js';
import { IOSDeviceDetector } from '../src/ui/ios/IOSDeviceDetector.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Detección automática de iOS (Aplica clase .is-ios si es iPhone, iPad o iPod)
    IOSDeviceDetector.applyIOSClassIfNeeded();

    // 1. Versión (Siempre visible en footer en escritorios y navegadores web)
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

    // 3. Selección de Idioma
    const langSelect = document.getElementById('lang-select');
    const initialLang = localStorage.getItem('lang') || 'es';
    if (langSelect) {
        langSelect.value = initialLang;
        setLanguage(initialLang);
        langSelect.addEventListener('change', () => {
            setLanguage(langSelect.value);
            updateDOMTranslations();
            updateCurrencyUI();
            renderItems(getFilteredItems());
            if (state.lastResult) {
                renderGradeBadge(state.lastResult.grade);
                renderKeyMetrics(state.lastResult.keyMetrics);
            }
        });
    }

    // 4. Selección de Divisa
    const currSelect = document.getElementById('currency-select');
    const initialCurrency = localStorage.getItem('currency') || 'EUR';
    if (currSelect) {
        currSelect.value = initialCurrency;
        state.currentCurrency = initialCurrency;
        currSelect.addEventListener('change', () => {
            state.currentCurrency = currSelect.value;
            localStorage.setItem('currency', currSelect.value);
            updateCurrencyUI();
            renderItems(getFilteredItems());
        });
    }

    updateCurrencyUI();

    // 5. Cargar datos con Repositorio (Red -> Cache -> Fallback -> Mapeo a Dominio)
    const itemsContainer = document.getElementById('items-container');
    const searchInput = document.getElementById('search-input');

    try {
        const repo = new ItemsRepository();
        const { items, lastUpdated } = await repo.getItems();

        if (items && items.length > 0) {
            state.storeData = items;

            const lastUpdatedEl = document.getElementById('last-updated');
            if (lastUpdatedEl) {
                lastUpdatedEl.innerHTML = `<span data-i18n="lastUpdated">${t('lastUpdated')}</span>: ${lastUpdated || '--/--/----'}`;
            }

            renderItems(getFilteredItems());
        } else {
            throw new Error('No items returned');
        }
    } catch (err) {
        console.error("Error al cargar los objetos:", err);
        if (itemsContainer) itemsContainer.innerHTML = '<p class="text-xs text-rose-500 py-2 text-center">Error al cargar datos de la tienda.</p>';
    }

    function getFilteredItems() {
        if (!state.storeData) return [];
        const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
        if (!query) return state.storeData;
        return state.storeData.filter(item => {
            const name = (item.getLocalizedName
                ? item.getLocalizedName(state.currentLang)
                : ((state.currentLang === 'en' && item.name_en) ? item.name_en : (item.name_es || item.name || ''))
            ).toLowerCase();
            return name.includes(query);
        });
    }

    // 6. Buscador & Botón de Limpiar Selección
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderItems(getFilteredItems());
        });
    }

    const btnResetQty = document.getElementById('btn-reset-qty');
    if (btnResetQty) {
        btnResetQty.addEventListener('click', () => {
            document.querySelectorAll('.item-qty').forEach(input => input.value = '0');
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
            state.lastResult = res;
            state.lastBoxPrice = boxPrice;
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

            // Mover el foco accesible al título del resultado
            if (resTitle) resTitle.focus();

            // Animación de conteo numérico (Count-Up)
            if (resBoxPriceEl) animateValue(resBoxPriceEl, 0, boxPrice, 700, '', ` ${curr.symbol}`, decimals);
            if (resRealValueEl) animateValue(resRealValueEl, 0, res.totalValue, 850, '', ` ${curr.symbol}`, decimals);

            if (resCard && resTitle && resDiffLabel && resDiffVal) {
                if (res.isProfitable) {
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-emerald-600 shadow-lg relative';
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
                    resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-rose-600 shadow-lg relative';
                    resTitle.innerText = `⚠️ ${t('titleNotProfitable') || 'No renta comprarla'}`;
                    resDiffLabel.innerText = t('resDiffLose') || 'Pierdes:';
                    animateValue(resDiffVal, 0, Math.abs(res.diff), 900, `-`, ` ${curr.symbol}`, decimals);
                }
            }

            renderGradeBadge(res.grade);
            renderKeyMetrics(res.keyMetrics);
            renderBreakdown(res.categoryTotals, res.totalValue);

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

            state.lastCalculationText = `PokeBoxValue: Precio ${fmtBoxPrice}${curr.symbol} | Valor: ${fmtTotalValue}${curr.symbol} (${t('grade' + res.grade) || res.grade})`;
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (viewResult) viewResult.classList.add('hidden');
            if (viewForm) viewForm.classList.remove('hidden');

            const priceInput = document.getElementById('box-price');
            if (priceInput) {
                priceInput.value = '';
                priceInput.focus();
            }
        });
    }

    // 8. Botón Compartir Texto
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            const shareText = state.lastCalculationText || 'PokeBoxValue - Calculadora de Cajas de Pokémon GO';
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: t('shareTitle') || 'PokeBoxValue',
                        text: shareText,
                        url: window.location.href
                    });
                    return;
                } catch (e) {
                    console.log('Web share error:', e);
                }
            }

            try {
                await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
                alert(t('copiedToClipboard') || '¡Resultado copiado al portapapeles!');
            } catch (e) {
                alert(shareText);
            }
        });
    }

    // 9. Botón Compartir Tarjeta PNG (Social Card Generator)
    const btnShareCard = document.getElementById('btn-share-card');
    if (btnShareCard) {
        btnShareCard.addEventListener('click', async () => {
            if (!state.lastResult) return;
            const res = state.lastResult;
            const boxPrice = state.lastBoxPrice || res.boxPrice;
            const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
            const isCoins = state.currentCurrency === 'POKECOINS';

            const blob = await generateSocialCardCanvas({
                boxPrice: isCoins ? Math.round(boxPrice) : boxPrice.toFixed(2),
                totalValue: isCoins ? Math.round(res.totalValue) : res.totalValue.toFixed(2),
                diff: isCoins ? Math.round(res.diff) : res.diff.toFixed(2),
                isProfitable: res.isProfitable,
                grade: res.grade,
                currencySymbol: curr.symbol
            });

            if (blob && navigator.share && window.File) {
                try {
                    const file = new File([blob], 'pokeboxvalue-card.png', { type: 'image/png' });
                    await navigator.share({
                        title: t('shareTitle') || 'PokeBoxValue Card',
                        text: t('shareText') || 'Mira la rentabilidad de esta caja en PokeBoxValue:',
                        files: [file]
                    });
                    return;
                } catch (err) {
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

    // 10. Registro de Service Worker con auto-actualización inmediata (PWA & Offline)
    if ('serviceWorker' in navigator) {
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });

        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    reg.update();
                })
                .catch(err => console.error('Error al registrar Service Worker:', err));
        });
    }
});