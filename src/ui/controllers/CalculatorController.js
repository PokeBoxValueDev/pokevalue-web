import { state, CURRENCY_CONFIG } from '../../config/config.js';
import { ValuationService } from '../../domain/services/ValuationService.js';
import { t } from '../../i18n/i18n.js';
import { animateValue, triggerConfetti } from '../utils/AnimationUtils.js';
import { renderGradeBadge, renderKeyMetrics } from '../components/ValuationBadgesRenderer.js';
import { renderBreakdown } from '../components/BreakdownRenderer.js';
import { renderHistory } from '../components/HistoryRenderer.js';
import { HistoryRepository } from '../../infrastructure/repositories/HistoryRepository.js';
import { generateSocialCardCanvas } from '../components/SocialCardGenerator.js';
import { setCategoryFilter } from '../components/ItemCardRenderer.js';
import { renderView } from '../components/ViewManager.js';
import { IOSDeviceDetector } from '../ios/IOSDeviceDetector.js';
import { bindAsyncButton, bindClick, getElement } from '../utils/DomUtils.js';
import { ShareService } from '../utils/ShareService.js';

export class CalculatorController {
    static _valuationService = ValuationService;
    static _historyRepository = HistoryRepository;
    static _deferredPrompt = null;

    /**
     * Inicializa el controlador permitiendo inyectar dependencias
     * @param {{ valuationService?: typeof ValuationService, historyRepository?: typeof HistoryRepository }} [dependencies]
     */
    static init({ valuationService = ValuationService, historyRepository = HistoryRepository } = {}) {
        CalculatorController._valuationService = valuationService;
        CalculatorController._historyRepository = historyRepository;

        if (typeof document === 'undefined') return;

        const priceInput = getElement('box-price');
        const priceError = getElement('price-error');
        const customBoxNameInput = getElement('custom-box-name-input');
        const btnInstallPwa = getElement('btn-install-pwa');

        // Escuchar cambios de precio en tiempo real
        if (priceInput) {
            priceInput.addEventListener('input', () => {
                const boxPrice = parseFloat(priceInput.value);
                if (!isNaN(boxPrice) && boxPrice > 0) {
                    priceInput.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500', 'focus:ring-rose-500');
                    if (priceError) priceError.classList.add('hidden');
                }
                CalculatorController.updateLiveSummary();
            });
        }

        // Sincronización reactiva ante cambios en cantidades de objetos
        if (typeof document.addEventListener === 'function') {
            document.addEventListener('pokevalue:itemsChanged', () => {
                CalculatorController.updateLiveSummary();
            });
        }

        // Vinculación de acciones principales mediante utilidades genéricas
        const calculateAction = () => CalculatorController.handleCalculate(priceInput, priceError);
        bindClick('btn-live-view-result', calculateAction);
        bindClick('btn-calculate', calculateAction);
        bindClick('btn-reset', () => CalculatorController.resetForm());

        bindClick('btn-reset-qty', () => {
            const searchInput = getElement('search-input');
            if (searchInput) {
                searchInput.value = '';
                try {
                    const evt = (typeof CustomEvent === 'function') ? new CustomEvent('input', { bubbles: true }) : { type: 'input' };
                    searchInput.dispatchEvent(evt);
                } catch (_) {}
            }
            setCategoryFilter('all');
        });

        bindClick('btn-clear-history', () => {
            CalculatorController._historyRepository.clearHistory();
            renderHistory(CalculatorController.restoreFromHistory);
        });

        bindClick('site-logo', () => {
            CalculatorController.switchView(false);
            CalculatorController.resetForm();
            renderView('');
            if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') {
                const currentLang = state.currentLang || 'es';
                window.history.pushState(null, '', `/${currentLang}`);
            }
        }, { preventDefault: true });

        // Botones de Compartir (Texto, Story 9:16, Sticker 1:1, Tarjeta 16:9) con protección de concurrencia
        bindAsyncButton('btn-share', () => CalculatorController.handleTextShare());
        bindAsyncButton('btn-share-story', () => CalculatorController.handleCardShare('story'));
        bindAsyncButton('btn-share-sticker', () => CalculatorController.handleCardShare('sticker'));
        bindAsyncButton('btn-share-card', () => CalculatorController.handleCardShare('post'));

        // Guardar Caja Personalizada
        const saveCustomBoxHandler = () => {
            IOSDeviceDetector.triggerHapticFeedback(15);
            const customName = (customBoxNameInput ? customBoxNameInput.value : '').trim();
            const history = CalculatorController._historyRepository.getHistory();
            if (history && history.length > 0) {
                const finalName = customName || t('defaultBoxName') || 'Caja Personalizada';
                history[0].boxName = finalName;
                history[0].isSaved = true;
                CalculatorController._historyRepository.saveHistory(history);
                renderHistory(CalculatorController.restoreFromHistory);

                const feedbackEl = getElement('save-box-feedback');
                const feedbackText = getElement('save-box-feedback-text');
                if (feedbackEl && feedbackText) {
                    feedbackText.textContent = `${t('boxSavedConfirm') || '¡Caja guardada como'} «${finalName}» ${t('inHistory') || 'en el historial!'}`;
                    feedbackEl.classList.remove('hidden');
                }

                const btnLabel = getElement('btn-save-box-label');
                const btnSaveBox = getElement('btn-save-custom-box');
                if (btnLabel && btnSaveBox) {
                    btnLabel.textContent = t('btnBoxSaved') || '¡Guardada!';
                    btnSaveBox.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
                    btnSaveBox.classList.add('bg-emerald-700');
                    setTimeout(() => {
                        btnLabel.textContent = t('btnSaveBox') || 'Guardar Caja';
                        btnSaveBox.classList.remove('bg-emerald-700');
                        btnSaveBox.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
                    }, 2200);
                }
            }
        };

        bindClick('btn-save-custom-box', saveCustomBoxHandler);

        if (customBoxNameInput) {
            customBoxNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    saveCustomBoxHandler();
                }
            });
        }

        // PWA Install prompt
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                CalculatorController._deferredPrompt = e;
                if (btnInstallPwa) {
                    btnInstallPwa.classList.remove('hidden');
                }
            });

            if (btnInstallPwa) {
                btnInstallPwa.addEventListener('click', async () => {
                    if (CalculatorController._deferredPrompt) {
                        CalculatorController._deferredPrompt.prompt();
                        const choiceResult = await CalculatorController._deferredPrompt.userChoice;
                        if (choiceResult && choiceResult.outcome === 'accepted') {
                            btnInstallPwa.classList.add('hidden');
                        }
                        CalculatorController._deferredPrompt = null;
                    }
                });
            }
        }

        renderHistory(CalculatorController.restoreFromHistory);
    }

    static updateLiveSummary() {
        const stickyBar = getElement('live-sticky-bar');
        const liveTotalVal = getElement('live-total-val');
        const liveDiffTag = getElement('live-diff-tag');
        const liveGradeBadge = getElement('live-grade-badge');
        const priceInput = getElement('box-price');

        if (!stickyBar || !liveTotalVal || !liveDiffTag || !liveGradeBadge || !priceInput) return;

        const boxPrice = parseFloat(priceInput.value) || 0;
        const quantities = {};
        document.querySelectorAll('.item-qty').forEach(input => {
            const qty = parseInt(input.value) || 0;
            if (qty > 0) {
                quantities[input.getAttribute('data-id')] = qty;
            }
        });

        const hasItems = Object.keys(quantities).length > 0;

        if (boxPrice > 0 && hasItems) {
            const res = CalculatorController._valuationService.calculate(
                boxPrice,
                quantities,
                state.storeData,
                state.currentCurrency,
                state.currentLang
            );

            const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
            const isCoins = state.currentCurrency === 'POKECOINS';
            const formattedTotal = isCoins ? `${Math.round(res.totalValue)} ${curr.symbol}` : `${res.totalValue.toFixed(2)} ${curr.symbol}`;
            const diffSign = res.diff >= 0 ? '+' : '-';
            const formattedDiff = isCoins ? `${diffSign}${Math.round(Math.abs(res.diff))} ${curr.symbol}` : `${diffSign}${Math.abs(res.diff).toFixed(2)} ${curr.symbol}`;

            liveTotalVal.innerText = formattedTotal;
            liveDiffTag.innerText = `(${formattedDiff})`;

            if (res.isProfitable) {
                liveDiffTag.className = 'ml-1 font-bold text-emerald-600 dark:text-emerald-400';
                liveGradeBadge.className = res.grade === 'S' 
                    ? 'px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-sm'
                    : 'px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-500 text-white shadow-sm';
            } else {
                liveDiffTag.className = 'ml-1 font-bold text-rose-600 dark:text-rose-400';
                liveGradeBadge.className = 'px-2 py-0.5 rounded-lg text-xs font-black bg-rose-500 text-white shadow-sm';
            }

            const badgeKey = res.grade === 'S' 
                ? 'badgeExcellent' 
                : (res.grade === 'A' ? 'badgeGood' : (res.grade === 'B' ? 'badgeFair' : 'badgePoor'));
            liveGradeBadge.innerText = t(badgeKey) || res.grade;

            stickyBar.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
        } else {
            stickyBar.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
        }
    }

    static switchView(viewName) {
        const viewForm = getElement('view-form');
        const viewResult = getElement('view-result');
        const stickyBar = getElement('live-sticky-bar');

        if (viewName === 'form') {
            if (viewResult) {
                viewResult.classList.add('hidden');
                if (viewResult.style) viewResult.style.display = 'none';
            }
            if (viewForm) {
                viewForm.classList.remove('hidden');
                if (viewForm.style) viewForm.style.display = '';
            }
            const btnCalculate = getElement('btn-calculate');
            if (btnCalculate) btnCalculate.focus();
            CalculatorController.updateLiveSummary();
        } else if (viewName === 'result') {
            if (viewForm) {
                viewForm.classList.add('hidden');
                if (viewForm.style) viewForm.style.display = 'none';
            }
            if (viewResult) {
                viewResult.classList.remove('hidden');
                if (viewResult.style) viewResult.style.display = '';
            }
            if (stickyBar) stickyBar.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
            const resTitle = getElement('result-title');
            if (resTitle) resTitle.focus();
        }

        if (typeof window !== 'undefined' && window.scrollTo) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    static resetForm() {
        const priceInput = getElement('box-price');
        const priceError = getElement('price-error');
        if (priceInput) {
            priceInput.value = '';
            priceInput.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500', 'focus:ring-rose-500');
        }
        if (priceError) priceError.classList.add('hidden');

        document.querySelectorAll('.item-qty').forEach(input => {
            input.value = 0;
            if (typeof input.dispatchEvent === 'function') {
                input.dispatchEvent(new Event('input'));
            }
        });

        const searchInput = getElement('search-input');
        if (searchInput) searchInput.value = '';
        setCategoryFilter('all');

        CalculatorController.updateLiveSummary();
        CalculatorController.switchView('form');
        renderHistory(CalculatorController.restoreFromHistory);
    }

    static async handleTextShare() {
        await ShareService.shareTextSummary();
    }

    static async handleCardShare(format = 'post') {
        if (!state.lastResult || !state.lastBoxPrice) return;

        const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
        let blob = null;
        try {
            blob = await generateSocialCardCanvas({
                boxPrice: state.lastBoxPrice,
                totalValue: state.lastResult.totalValue,
                diff: state.lastResult.diff,
                isProfitable: state.lastResult.isProfitable,
                grade: state.lastResult.grade,
                currencySymbol: curr.symbol,
                items: state.lastResult.itemSummary || [],
                format
            });
        } catch (canvasErr) {
            console.error("Error al generar canvas de la tarjeta:", canvasErr);
            return;
        }

        if (!blob) return;

        const filename = format === 'story' ? 'pokeboxvalue-story-9x16.png' : 'pokeboxvalue-tarjeta.png';
        await ShareService.shareImageBlob(blob, filename);
    }

    static handleCalculate(priceInput, priceError) {
        const input = priceInput || getElement('box-price');
        const errorEl = priceError || getElement('price-error');
        if (!input) return;

        const boxPrice = parseFloat(input.value);

        input.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500', 'focus:ring-rose-500');
        if (errorEl) errorEl.classList.add('hidden');

        if (isNaN(boxPrice) || boxPrice <= 0) {
            input.classList.add('border-rose-500', 'ring-2', 'ring-rose-500');
            if (errorEl) {
                errorEl.innerText = t('enterValidPrice');
                errorEl.classList.remove('hidden');
            }
            if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        const quantities = {};
        document.querySelectorAll('.item-qty').forEach(qtyInput => {
            const qty = parseInt(qtyInput.value) || 0;
            if (qty > 0) {
                quantities[qtyInput.getAttribute('data-id')] = qty;
            }
        });

        if (Object.keys(quantities).length === 0) {
            alert(t('alertNoItems') || 'Selecciona al menos un objeto.');
            return;
        }

        const res = CalculatorController._valuationService.calculate(boxPrice, quantities, state.storeData, state.currentCurrency, state.currentLang);
        state.setCalculationResult(res, boxPrice);
        
        CalculatorController.renderResults(boxPrice, res, quantities);
    }

    static renderResults(boxPrice, res, quantities) {
        const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
        const isCoins = state.currentCurrency === 'POKECOINS';
        const decimals = isCoins ? 0 : 2;

        CalculatorController.switchView('result');

        const resCard = getElement('result-card');
        const resTitle = getElement('result-title');
        const resDiffLabel = getElement('res-diff-label');
        const resDiffVal = getElement('res-diff-val');
        const resBoxPriceEl = getElement('res-box-price');
        const resRealValueEl = getElement('res-real-value');

        if (resBoxPriceEl) animateValue(resBoxPriceEl, 0, boxPrice, 700, '', ` ${curr.symbol}`, decimals);
        if (resRealValueEl) animateValue(resRealValueEl, 0, res.totalValue, 850, '', ` ${curr.symbol}`, decimals);

        if (resCard && resTitle && resDiffLabel && resDiffVal) {
            if (res.isProfitable) {
                resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-emerald-600 shadow-lg relative';
                resTitle.innerText = t('titleProfitable') || '¡Renta comprarla!';
                resDiffLabel.innerText = t('resDiffSave') || 'Ahorras:';
                animateValue(resDiffVal, 0, Math.abs(res.diff), 900, `+`, ` ${curr.symbol}`, decimals);

                if (res.savingsPercent >= 30) {
                    setTimeout(() => triggerConfetti(), 250);
                }
            } else {
                resCard.className = 'p-6 rounded-xl text-center space-y-4 text-white bg-rose-600 shadow-lg relative';
                resTitle.innerText = t('titleNotProfitable') || 'No renta comprarla';
                resDiffLabel.innerText = t('resDiffLose') || 'Pierdes:';
                animateValue(resDiffVal, 0, Math.abs(res.diff), 900, `-`, ` ${curr.symbol}`, decimals);
            }
        }

        renderGradeBadge(res.grade);
        renderKeyMetrics(res.keyMetrics);
        renderBreakdown(res.categoryTotals, res.totalValue);

        const customBoxNameInput = getElement('custom-box-name-input');
        const initialBoxName = (customBoxNameInput ? customBoxNameInput.value : '').trim();
        const feedbackEl = getElement('save-box-feedback');
        if (feedbackEl) feedbackEl.classList.add('hidden');

        CalculatorController._historyRepository.saveCalculation({
            boxPrice,
            boxName: initialBoxName || undefined,
            totalValue: res.totalValue,
            diff: res.diff,
            isProfitable: res.isProfitable,
            currencySymbol: curr.symbol,
            items: res.itemSummary,
            quantities: quantities
        });

        renderHistory(CalculatorController.restoreFromHistory);
    }

    static reRenderResults(res) {
        if (!state.lastBoxPrice) return;
        renderGradeBadge(res.grade);
        renderKeyMetrics(res.keyMetrics);
    }

    static restoreFromHistory(item) {
        if (!item) return;

        CalculatorController.switchView('form');

        const priceInput = getElement('box-price');
        if (priceInput) {
            priceInput.value = item.boxPrice;
            priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
            const priceError = getElement('box-price-error');
            if (priceError) priceError.classList.add('hidden');
        }

        function triggerInputEvent(input) {
            try {
                const EventClass = (typeof window !== 'undefined' && window.Event) || Event;
                input.dispatchEvent(new EventClass('input', { bubbles: true }));
            } catch (_) {
                try {
                    const evt = (typeof CustomEvent === 'function') ? new CustomEvent('input', { bubbles: true }) : { type: 'input' };
                    input.dispatchEvent(evt);
                } catch (_) {}
            }
        }

        const allInputs = document.querySelectorAll('.item-qty');
        allInputs.forEach(input => {
            input.value = 0;
            triggerInputEvent(input);
        });

        if (item.quantities && Object.keys(item.quantities).length > 0) {
            Object.entries(item.quantities).forEach(([id, qty]) => {
                allInputs.forEach(input => {
                    if (String(input.getAttribute('data-id')) === String(id)) {
                        input.value = qty;
                        triggerInputEvent(input);
                    }
                });
            });
        } else if (Array.isArray(item.items)) {
            item.items.forEach(summaryStr => {
                const match = String(summaryStr).match(/^(\d+)x\s+(.+)$/);
                if (match) {
                    const qty = parseInt(match[1]) || 0;
                    const itemName = match[2].trim().toLowerCase();

                    state.storeData.forEach(storeItem => {
                        const esName = (storeItem.name_es || storeItem.name || '').toLowerCase();
                        const enName = (storeItem.name_en || '').toLowerCase();
                        if (esName === itemName || enName === itemName) {
                            allInputs.forEach(input => {
                                if (String(input.getAttribute('data-id')) === String(storeItem.id)) {
                                    input.value = qty;
                                    triggerInputEvent(input);
                                }
                            });
                        }
                    });
                }
            });
        }

        const customBoxNameInput = getElement('custom-box-name-input');
        if (customBoxNameInput) {
            customBoxNameInput.value = item.boxName || '';
        }

        CalculatorController.updateLiveSummary();
    }
}
