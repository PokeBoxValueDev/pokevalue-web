import { state, CURRENCY_CONFIG } from '../../config/config.js';
import { ValuationService } from '../../domain/services/ValuationService.js';
import { t } from '../../i18n/i18n.js';
import { animateValue, triggerConfetti } from '../utils/AnimationUtils.js';
import { renderGradeBadge, renderKeyMetrics } from '../components/ValuationBadgesRenderer.js';
import { renderBreakdown } from '../components/BreakdownRenderer.js';
import { renderHistory } from '../components/HistoryRenderer.js';
import { HistoryRepository } from '../../infrastructure/repositories/HistoryRepository.js';
import { generateSocialCardCanvas } from '../components/SocialCardGenerator.js';

export class CalculatorController {
    static init() {
        const btnCalculate = document.getElementById('btn-calculate');
        const priceInput = document.getElementById('box-price');
        const priceError = document.getElementById('price-error');
        const btnClearHistory = document.getElementById('btn-clear-history');
        const btnResetQty = document.getElementById('btn-reset-qty');
        const siteLogo = document.getElementById('site-logo');
        const btnShare = document.getElementById('btn-share');
        const btnShareCard = document.getElementById('btn-share-card');
        const btnReset = document.getElementById('btn-reset');

        if (priceInput) {
            priceInput.addEventListener('input', () => {
                const boxPrice = parseFloat(priceInput.value);
                if (!isNaN(boxPrice) && boxPrice > 0) {
                    priceInput.classList.remove('border-rose-500', 'focus:ring-rose-500');
                    if (priceError) priceError.classList.add('hidden');
                }
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
            });
        }

        if (btnClearHistory) {
            btnClearHistory.addEventListener('click', () => {
                HistoryRepository.clearHistory();
                renderHistory(CalculatorController.restoreFromHistory);
            });
        }

        if (siteLogo) {
            siteLogo.addEventListener('click', () => {
                CalculatorController.switchView('form');
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

        if (btnShareCard) {
            btnShareCard.addEventListener('click', async () => {
                if (isSharing) return;
                isSharing = true;
                try {
                    await CalculatorController.handleCardShare();
                } finally {
                    isSharing = false;
                }
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                CalculatorController.switchView('form');
            });
        }

        renderHistory(CalculatorController.restoreFromHistory);
    }

    static switchView(viewName) {
        const viewForm = document.getElementById('view-form');
        const viewResult = document.getElementById('view-result');

        if (viewName === 'form') {
            if (viewResult) viewResult.classList.add('hidden');
            if (viewForm) viewForm.classList.remove('hidden');
            const btnCalculate = document.getElementById('btn-calculate');
            if (btnCalculate) btnCalculate.focus();
        } else if (viewName === 'result') {
            if (viewForm) viewForm.classList.add('hidden');
            if (viewResult) viewResult.classList.remove('hidden');
            const resTitle = document.getElementById('result-title');
            if (resTitle) resTitle.focus();
        }

        if (typeof window !== 'undefined' && window.scrollTo) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    static async handleTextShare() {
        if (!state.lastResult || !state.lastBoxPrice) return;

        const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
        const isProfitable = state.lastResult.isProfitable;
        const statusTitle = isProfitable
            ? (t('titleProfitable') || '¡Renta comprarla!')
            : (t('titleNotProfitable') || 'No renta comprarla');

        const decimals = state.currentCurrency === 'POKECOINS' ? 0 : 2;
        const shareText = `📦 PokeBoxValue: ${statusTitle}\n` +
            `${t('resBoxPrice') || 'Precio:'} ${state.lastBoxPrice} ${curr.symbol} | ` +
            `${t('resRealValue') || 'Valor real:'} ${state.lastResult.totalValue.toFixed(decimals)} ${curr.symbol}`;

        const pageUrl = (typeof window !== 'undefined' && window.location) ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'PokeBoxValue - Resultado',
                    text: shareText,
                    ...(pageUrl ? { url: pageUrl } : {})
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

    static async handleCardShare() {
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
                currencySymbol: curr.symbol
            });
        } catch (canvasErr) {
            console.error("Error al generar canvas de la tarjeta:", canvasErr);
            return;
        }

        if (!blob) return;

        try {
            const file = new File([blob], 'pokeboxvalue-result.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'PokeBoxValue - Resultado',
                    text: '¡He calculated la rentabilidad de esta caja en PokeBoxValue! 📦✨',
                    files: [file]
                });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'pokeboxvalue-result.png';
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'InvalidStateError') {
                console.error("Error compartiendo tarjeta:", err);
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

        const res = ValuationService.calculate(boxPrice, quantities, state.storeData, state.currentCurrency, state.currentLang);
        state.lastResult = res;
        state.lastBoxPrice = boxPrice;
        
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
                resTitle.innerText = `🎉 ${t('titleProfitable') || '¡Renta comprarla!'}`;
                resDiffLabel.innerText = t('resDiffSave') || 'Ahorras:';
                animateValue(resDiffVal, 0, Math.abs(res.diff), 900, `+`, ` ${curr.symbol}`, decimals);

                if (res.savingsPercent >= 30) {
                    setTimeout(() => triggerConfetti(), 250);
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

        HistoryRepository.saveCalculation({
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
    }
}
