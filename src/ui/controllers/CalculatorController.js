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

        if (btnClearHistory) {
            btnClearHistory.addEventListener('click', () => {
                HistoryRepository.clearHistory();
                renderHistory(CalculatorController.restoreFromHistory);
            });
        }

        const btnShare = document.getElementById('btn-share-result');
        if (btnShare) {
            btnShare.addEventListener('click', async () => {
                if (!state.lastResult || !state.lastBoxPrice) return;

                const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
                const blob = await generateSocialCardCanvas({
                    boxPrice: state.lastBoxPrice,
                    totalValue: state.lastResult.totalValue,
                    diff: state.lastResult.diff,
                    isProfitable: state.lastResult.isProfitable,
                    grade: state.lastResult.grade,
                    currencySymbol: curr.symbol
                });

                if (!blob) return;

                try {
                    const file = new File([blob], 'pokeboxvalue-result.png', { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'PokeBoxValue - Resultado',
                            text: '¡He calculado la rentabilidad de esta caja en PokeBoxValue! 📦✨',
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
                    console.error("Error compartiendo:", err);
                }
            });
        }

        renderHistory(CalculatorController.restoreFromHistory);
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

        const viewForm = document.getElementById('view-form');
        const viewResult = document.getElementById('view-result');
        const resCard = document.getElementById('result-card');
        const resTitle = document.getElementById('result-title');
        const resDiffLabel = document.getElementById('res-diff-label');
        const resDiffVal = document.getElementById('res-diff-val');
        const resBoxPriceEl = document.getElementById('res-box-price');
        const resRealValueEl = document.getElementById('res-real-value');

        if (viewForm) viewForm.classList.add('hidden');
        if (viewResult) viewResult.classList.remove('hidden');

        if (resTitle) resTitle.focus();

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
        const priceInput = document.getElementById('box-price');
        if (priceInput) priceInput.value = item.boxPrice;

        document.querySelectorAll('.item-qty').forEach(input => {
            input.value = 0;
            input.dispatchEvent(new Event('input'));
        });

        if (item.quantities) {
            Object.entries(item.quantities).forEach(([id, qty]) => {
                const input = document.querySelector(`.item-qty[data-id="${id}"]`);
                if (input) {
                    input.value = qty;
                    input.dispatchEvent(new Event('input'));
                }
            });
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
