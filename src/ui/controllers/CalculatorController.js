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

export class CalculatorController {
    static _valuationService = ValuationService;
    static _historyRepository = HistoryRepository;
    static _deferredPrompt = null;

    /**
     * Inicializa el controlador permitiendo inyectar servicios y repositorios (Inyección de Dependencias)
     * @param {{ valuationService?: typeof ValuationService, historyRepository?: typeof HistoryRepository }} [dependencies]
     */
    static init({ valuationService = ValuationService, historyRepository = HistoryRepository } = {}) {
        CalculatorController._valuationService = valuationService;
        CalculatorController._historyRepository = historyRepository;

        if (typeof document === 'undefined') return;

        const btnCalculate = document.getElementById('btn-calculate');
        const priceInput = document.getElementById('box-price');
        const priceError = document.getElementById('price-error');
        const btnClearHistory = document.getElementById('btn-clear-history');
        const btnResetQty = document.getElementById('btn-reset-qty');
        const siteLogo = document.getElementById('site-logo');
        const btnShare = document.getElementById('btn-share');
        const btnShareStory = document.getElementById('btn-share-story');
        const btnShareCard = document.getElementById('btn-share-card');
        const btnReset = document.getElementById('btn-reset');
        const btnLiveViewResult = document.getElementById('btn-live-view-result');
        const btnInstallPwa = document.getElementById('btn-install-pwa');

        if (priceInput) {
            priceInput.addEventListener('input', () => {
                const boxPrice = parseFloat(priceInput.value);
                if (!isNaN(boxPrice) && boxPrice > 0) {
                    priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
                    if (priceError) priceError.classList.add('hidden');
                }
                CalculatorController.updateLiveSummary();
            });
        }

        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('pokevalue:itemsChanged', () => {
                CalculatorController.updateLiveSummary();
            });
        }

        if (btnLiveViewResult) {
            btnLiveViewResult.addEventListener('click', () => {
                CalculatorController.handleCalculate(priceInput, priceError);
            });
        }

        if (btnCalculate) {
            btnCalculate.addEventListener('click', () => {
                CalculatorController.handleCalculate(priceInput, priceError);
            });
        }

        if (btnResetQty) {
            btnResetQty.addEventListener('click', () => {
                const allInputs = document.querySelectorAll('.item-qty');
                allInputs.forEach(input => {
                    input.value = 0;
                    input.dispatchEvent(new Event('input'));
                });
                const searchInput = document.getElementById('search-input');
                if (searchInput) searchInput.value = '';
                setCategoryFilter('all');
                CalculatorController.updateLiveSummary();
            });
        }

        if (btnClearHistory) {
            btnClearHistory.addEventListener('click', () => {
                CalculatorController._historyRepository.clearHistory();
                renderHistory(CalculatorController.restoreFromHistory);
            });
        }

        if (siteLogo) {
            siteLogo.addEventListener('click', (e) => {
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
                CalculatorController.switchView(false);
                CalculatorController.resetForm();
                if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') {
                    const currentLang = state.currentLang || 'es';
                    window.history.pushState(null, '', `/${currentLang}`);
                }
            });
        }

        let isSharing = false;

        if (btnShare) {
            btnShare.addEventListener('click', async () => {
                if (isSharing) return;
                isSharing = true;
                try {
                    await CalculatorController.handleTextShare();
                } finally {
                    isSharing = false;
                }
            });
        }

        if (btnShareStory) {
            btnShareStory.addEventListener('click', async () => {
                if (isSharing) return;
                isSharing = true;
                try {
                    await CalculatorController.handleCardShare('story');
                } finally {
                    isSharing = false;
                }
            });
        }

        if (btnShareCard) {
            btnShareCard.addEventListener('click', async () => {
                if (isSharing) return;
                isSharing = true;
                try {
                    await CalculatorController.handleCardShare('post');
                } finally {
                    isSharing = false;
                }
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                CalculatorController.resetForm();
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
        const stickyBar = document.getElementById('live-sticky-bar');
        const liveTotalVal = document.getElementById('live-total-val');
        const liveDiffTag = document.getElementById('live-diff-tag');
        const liveGradeBadge = document.getElementById('live-grade-badge');
        const priceInput = document.getElementById('box-price');

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
        const viewForm = document.getElementById('view-form');
        const viewResult = document.getElementById('view-result');
        const stickyBar = document.getElementById('live-sticky-bar');

        if (viewName === 'form') {
            if (viewResult) viewResult.classList.add('hidden');
            if (viewForm) viewForm.classList.remove('hidden');
            const btnCalculate = document.getElementById('btn-calculate');
            if (btnCalculate) btnCalculate.focus();
            CalculatorController.updateLiveSummary();
        } else if (viewName === 'result') {
            if (viewForm) viewForm.classList.add('hidden');
            if (viewResult) viewResult.classList.remove('hidden');
            if (stickyBar) stickyBar.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
            const resTitle = document.getElementById('result-title');
            if (resTitle) resTitle.focus();
        }

        if (typeof window !== 'undefined' && window.scrollTo) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    static resetForm() {
        const priceInput = document.getElementById('box-price');
        const priceError = document.getElementById('price-error');
        if (priceInput) {
            priceInput.value = '';
            priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
        }
        if (priceError) priceError.classList.add('hidden');

        const allInputs = document.querySelectorAll('.item-qty');
        allInputs.forEach(input => {
            input.value = 0;
            if (typeof input.dispatchEvent === 'function') {
                input.dispatchEvent(new Event('input'));
            }
        });

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';
        setCategoryFilter('all');

        CalculatorController.updateLiveSummary();
        CalculatorController.switchView('form');
        if (priceInput) priceInput.focus();
    }

    static async handleTextShare() {
        if (!state.lastResult || !state.lastBoxPrice) return;

        const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
        const isProfitable = state.lastResult.isProfitable;
        const statusTitle = isProfitable
            ? (t('titleProfitable') || '¡Renta comprarla!')
            : (t('titleNotProfitable') || 'No renta comprarla');

        const isCoins = state.currentCurrency === 'POKECOINS';
        const formattedPrice = isCoins ? `${Math.round(state.lastBoxPrice)} ${curr.symbol}` : `${state.lastBoxPrice.toFixed(2)} ${curr.symbol}`;
        const formattedValue = isCoins ? `${Math.round(state.lastResult.totalValue)} ${curr.symbol}` : `${state.lastResult.totalValue.toFixed(2)} ${curr.symbol}`;
        const diffSign = state.lastResult.diff >= 0 ? '+' : '-';
        const formattedDiff = isCoins ? `${diffSign}${Math.round(Math.abs(state.lastResult.diff))} ${curr.symbol}` : `${diffSign}${Math.abs(state.lastResult.diff).toFixed(2)} ${curr.symbol}`;

        let itemsSummaryText = '';
        if (state.lastResult.itemSummary && state.lastResult.itemSummary.length > 0) {
            itemsSummaryText = '\n' + state.lastResult.itemSummary.map(item => `  • ${item}`).join('\n');
        }

        const shareText = `📦 PokeBoxValue - Resultado de la Caja:
━━━━━━━━━━━━━━━━━━━━
Status: ${statusTitle} (${state.lastResult.grade})
• Precio Caja: ${formattedPrice}
• Valor Real:  ${formattedValue} (${formattedDiff})
━━━━━━━━━━━━━━━━━━━━
Objetos incluidos:${itemsSummaryText || ' No especificados'}`;

        const pageUrl = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : 'https://pokeboxvalue.com';

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'PokeBoxValue - Calculadora de Cajas',
                    text: shareText,
                    url: pageUrl
                });
            } else if (navigator.clipboard) {
                const copyContent = pageUrl ? `${shareText}\n${pageUrl}` : shareText;
                await navigator.clipboard.writeText(copyContent);
                alert(t('linkCopied') || '¡Resultado copiado al portapapeles!');
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'InvalidStateError') {
                console.error("Error compartiendo resultado:", err);
            }
        }
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
        const downloadBlob = (cardBlob) => {
            const url = URL.createObjectURL(cardBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 1000);
        };

        try {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'PokeBoxValue - Resultado',
                    text: t('shareNativeCardText') || 'He calculado la rentabilidad de esta caja en PokeBoxValue:',
                    files: [file]
                });
            } else {
                downloadBlob(blob);
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'InvalidStateError') {
                console.error("Error compartiendo tarjeta:", err);
                downloadBlob(blob);
            }
        }
    }

    static handleCalculate(priceInput, priceError) {
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

        const res = CalculatorController._valuationService.calculate(boxPrice, quantities, state.storeData, state.currentCurrency, state.currentLang);
        state.setCalculationResult(res, boxPrice);
        
        CalculatorController.renderResults(boxPrice, res, quantities);
    }

    static renderResults(boxPrice, res, quantities) {
        const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
        const isCoins = state.currentCurrency === 'POKECOINS';
        const decimals = isCoins ? 0 : 2;

        CalculatorController.switchView('result');

        const resCard = document.getElementById('result-card');
        const resTitle = document.getElementById('result-title');
        const resDiffLabel = document.getElementById('res-diff-label');
        const resDiffVal = document.getElementById('res-diff-val');
        const resBoxPriceEl = document.getElementById('res-box-price');
        const resRealValueEl = document.getElementById('res-real-value');

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

        CalculatorController._historyRepository.saveCalculation({
            boxPrice,
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

        // 1. Mostrar vista de formulario si estábamos en la vista de resultados
        CalculatorController.switchView('form');

        // 2. Restaurar precio de la caja
        const priceInput = document.getElementById('box-price');
        if (priceInput) {
            priceInput.value = item.boxPrice;
            priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
            const priceError = document.getElementById('box-price-error');
            if (priceError) priceError.classList.add('hidden');
        }

        // 3. Resetear todas las cantidades en el formulario
        const allInputs = document.querySelectorAll('.item-qty');
        allInputs.forEach(input => {
            input.value = 0;
            input.dispatchEvent(new Event('input'));
        });

        // 4. Restaurar cantidades de los objetos desde item.quantities o fallback por nombres
        if (item.quantities && Object.keys(item.quantities).length > 0) {
            Object.entries(item.quantities).forEach(([id, qty]) => {
                allInputs.forEach(input => {
                    if (String(input.getAttribute('data-id')) === String(id)) {
                        input.value = qty;
                        input.dispatchEvent(new Event('input'));
                    }
                });
            });
        } else if (Array.isArray(item.items)) {
            // Fallback para registros antiguos del historial sin objeto `quantities`
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
                                    input.dispatchEvent(new Event('input'));
                                }
                            });
                        }
                    });
                }
            });
        }

        CalculatorController.updateLiveSummary();
    }
}
