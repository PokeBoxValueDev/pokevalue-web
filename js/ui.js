import { CURRENCY_CONFIG, state } from './config.js';
import { t } from './i18n.js';

// Re-exportar todos los componentes de UI desestructurados desde src/ui/components/
export { renderItems, getCategoryTranslation } from '../src/ui/components/ItemCardRenderer.js';
export { renderBreakdown } from '../src/ui/components/BreakdownRenderer.js';
export { renderHistory } from '../src/ui/components/HistoryRenderer.js';
export { renderGradeBadge, renderKeyMetrics } from '../src/ui/components/ValuationBadgesRenderer.js';
export { generateSocialCardCanvas } from '../src/ui/components/SocialCardGenerator.js';
export { setupModals } from '../src/ui/components/ModalManager.js';

/**
 * Actualiza etiquetas globales de divisa, placeholders y steps en el DOM.
 */
export function updateCurrencyUI() {
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

/**
 * Anima un valor numérico desde un valor inicial hasta el valor final (count-up effect).
 */
export function animateValue(element, start, end, duration = 800, prefix = '', suffix = '', decimals = 2) {
    if (!element) return;

    if (element._animFrameId) {
        cancelAnimationFrame(element._animFrameId);
    }

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Curva de desaceleración suave (easeOutCubic)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeProgress;

        const formattedNumber = decimals === 0 ? Math.round(current) : current.toFixed(decimals);
        element.innerText = `${prefix}${formattedNumber}${suffix}`;

        if (progress < 1) {
            element._animFrameId = requestAnimationFrame(update);
        } else {
            element._animFrameId = null;
        }
    }

    element._animFrameId = requestAnimationFrame(update);
}

/**
 * Lanza un efecto visual de confeti de celebración.
 */
export function triggerConfetti() {
    if (typeof window.confetti !== 'function') return;

    const count = 200;
    const defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        window.confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}