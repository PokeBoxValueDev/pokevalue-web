import { CURRENCY_CONFIG, CATEGORY_CONFIG, state } from './config.js';
import { getHistory } from './storage.js';
import { t } from './i18n.js';
import { Category } from '../src/domain/valueObjects/Category.js';

/**
 * Obtiene la traducción formateada de la categoría usando el diccionario actual.
 */
function getCategoryTranslation(catKey) {
    if (!catKey) return '';
    const i18nKey = Category.getI18nKey(catKey);
    const translated = t(i18nKey);

    if (translated && translated !== i18nKey) {
        return translated;
    }

    const normKey = Category.normalizeKey(catKey);
    return CATEGORY_CONFIG[normKey]?.label || catKey.toUpperCase();
}

/**
 * Renderiza la lista de objetos agrupados por categoría.
 */
export function renderItems(items) {
    const container = document.getElementById('items-container');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 py-2 text-center" data-i18n="noItemsFound">${t('noItemsFound')}</p>`;
        return;
    }

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { rate: 1, symbol: '€' };
    const isCoins = state.currentCurrency === 'POKECOINS';

    // 1. Agrupar items por categoría
    const grouped = items.reduce((acc, item) => {
        const catKey = Category.normalizeKey(item.category || item.categoria || 'otros');
        if (!acc[catKey]) acc[catKey] = [];
        acc[catKey].push(item);
        return acc;
    }, {});

    // 2. Generar el HTML agrupado por categorías
    container.innerHTML = Object.entries(grouped).map(([catKey, categoryItems]) => {
        const config = CATEGORY_CONFIG[catKey] || { color: 'bg-gray-500', label: catKey };
        const categoryLabel = getCategoryTranslation(catKey);
        const i18nKey = Category.getI18nKey(catKey);

        return `
            <div class="space-y-2">
                <!-- Cabecera / Badge de la Categoría -->
                <div class="flex items-center gap-2 pt-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                    <span class="w-2.5 h-2.5 rounded-full ${config.color}"></span>
                    <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" data-i18n="${i18nKey}">
                        ${categoryLabel}
                    </span>
                </div>

                <!-- Lista de Objetos -->
                <div class="space-y-2">
                    ${categoryItems.map(item => {
            let unitPriceStr = '';

            if (typeof item.calculateUnitPrice === 'function') {
                const unitPrice = item.calculateUnitPrice(state.currentCurrency, CURRENCY_CONFIG);
                const priceFormatted = isCoins ? Math.round(unitPrice) : unitPrice.toFixed(2);
                unitPriceStr = `${priceFormatted} <span class="currency-symbol">${curr.symbol}</span> / u.`;
            } else {
                if (isCoins) {
                    const coins = item.unit_price_coins ?? Math.round((item.unit_price_eur || 0) * curr.rate);
                    unitPriceStr = `${coins} <span class="currency-symbol">${curr.symbol}</span> / u.`;
                } else if (state.currentCurrency === 'USD' && item.unit_price_usd) {
                    unitPriceStr = `${item.unit_price_usd.toFixed(2)} <span class="currency-symbol">${curr.symbol}</span> / u.`;
                } else {
                    const price = (item.unit_price_eur || item.price_eur || 0) * curr.rate;
                    unitPriceStr = `${price.toFixed(2)} <span class="currency-symbol">${curr.symbol}</span> / u.`;
                }
            }

            const name = typeof item.getLocalizedName === 'function'
                ? item.getLocalizedName(state.currentLang)
                : ((state.currentLang === 'en' && item.name_en) ? item.name_en : (item.name_es || item.name || 'Objeto'));

            return `
    <div class="item-card flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200" data-card-id="${item.id}">
        
        <!-- Icono SVG / Imagen del Item + Información -->
        <div class="flex items-center gap-3 flex-1 pr-2">
            <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm">
                ${item.svg ? item.svg : (item.image ? `<img src="${item.image}" alt="${name}" class="w-full h-full object-contain">` : '')}
            </div>
            <div>
                <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${name}</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">
                    ${unitPriceStr}
                </p>
            </div>
        </div>

        <!-- Controles de Cantidad (+ / -) con Touch Targets Accesibles (>= 40px) -->
        <div class="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-1 shadow-sm">
            <button type="button" 
                class="btn-decrement w-10 h-10 flex items-center justify-center text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95" 
                data-id="${item.id}"
                aria-label="Disminuir cantidad de ${name}">-</button>
            
            <input type="number" 
                min="0" 
                value="0" 
                data-id="${item.id}"
                aria-label="Cantidad de ${name}"
                class="item-qty w-10 text-center text-sm font-extrabold bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
            
            <button type="button" 
                class="btn-increment w-10 h-10 flex items-center justify-center text-base font-extrabold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-95" 
                data-id="${item.id}"
                aria-label="Aumentar cantidad de ${name}">+</button>
        </div>
    </div>
`;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');

    function updateCardHighlight(input) {
        if (!input) return;
        const id = input.getAttribute('data-id');
        const card = container.querySelector(`.item-card[data-card-id="${id}"]`);
        const val = parseInt(input.value) || 0;
        if (card) {
            if (val > 0) {
                card.className = 'item-card flex items-center justify-between p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-400 dark:border-indigo-600 shadow-sm transition-all duration-200';
            } else {
                card.className = 'item-card flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200';
            }
        }
    }

    // Escuchadores de botones + / - e inputs
    container.querySelectorAll('.item-qty').forEach(input => {
        input.addEventListener('input', () => updateCardHighlight(input));
    });

    container.querySelectorAll('.btn-decrement').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                if (currentVal > 0) input.value = currentVal - 1;
                updateCardHighlight(input);
            }
        });
    });

    container.querySelectorAll('.btn-increment').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = container.querySelector(`input[data-id="${id}"]`);
            if (input) {
                const currentVal = parseInt(input.value) || 0;
                input.value = currentVal + 1;
                updateCardHighlight(input);
            }
        });
    });
}

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
 * Muestra el desglose por categorías en la tarjeta de resultados.
 */
export function renderBreakdown(categoryTotals, totalValue) {
    const breakdownContainer = document.getElementById('breakdown-legend');
    if (!breakdownContainer) return;

    const curr = CURRENCY_CONFIG[state.currentCurrency] || { symbol: '€' };
    const isCoins = state.currentCurrency === 'POKECOINS';

    let html = '';

    Object.entries(categoryTotals).forEach(([catKey, total]) => {
        if (total > 0) {
            const percentage = totalValue > 0 ? ((total / totalValue) * 100).toFixed(0) : 0;
            const config = CATEGORY_CONFIG[catKey] || { color: 'bg-gray-500', label: catKey };
            const label = getCategoryTranslation(catKey);
            const i18nKey = Category.getI18nKey(catKey);
            const formattedVal = isCoins ? Math.round(total) : total.toFixed(2);

            html += `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-semibold">
                        <span class="text-gray-700 dark:text-gray-300 flex items-center gap-1.5" data-i18n="${i18nKey}">
                            <span class="w-2 h-2 rounded-full ${config.color}"></span>
                            ${label}
                        </span>
                        <span class="text-gray-900 dark:text-white font-bold">${formattedVal} ${curr.symbol} (${percentage}%)</span>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div class="${config.color} h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
    });

    breakdownContainer.innerHTML = html || `<p class="text-xs text-gray-400 text-center" data-i18n="noItemsSelected">${t('noItemsSelected') || 'Sin desglose disponible'}</p>`;
}

/**
 * Historial de cálculos previos.
 */
export function renderHistory(onRestore) {
    const historySection = document.getElementById('history-section');
    const container = document.getElementById('history-container');
    const history = getHistory();

    if (!container) return;

    if (history.length === 0) {
        if (historySection) historySection.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    if (historySection) historySection.classList.remove('hidden');

    container.innerHTML = history.map((item) => {
        const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Formatear decimales según la divisa del registro
        const isCoins = item.currencySymbol === '🟡' || item.currencySymbol === 'coins';
        const formattedBoxPrice = isCoins ? Math.round(item.boxPrice) : Number(item.boxPrice).toFixed(2);
        const formattedTotalValue = isCoins ? Math.round(item.totalValue) : Number(item.totalValue).toFixed(2);

        const statusColor = item.isProfitable
            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            : 'text-rose-500 bg-rose-50 dark:bg-rose-950/30';

        const badgeKey = item.isProfitable ? 'badgeProfitable' : 'badgeNotProfitable';
        const badgeText = t(badgeKey) || (item.isProfitable ? 'Rentable' : 'No rentable');

        return `
            <div class="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                <div class="space-y-0.5">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold ${statusColor} px-2 py-0.5 rounded-full" data-i18n="${badgeKey}">
                            ${badgeText}
                        </span>
                        <span class="text-[10px] text-gray-400">${dateStr}</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300">
                        <span data-i18n="resBoxPrice">${t('resBoxPrice')}</span> <b>${formattedBoxPrice}${item.currencySymbol}</b> | 
                        <span data-i18n="resRealValue">${t('resRealValue')}</span> <b>${formattedTotalValue}${item.currencySymbol}</b>
                    </p>
                </div>
                <button 
                    type="button" 
                    class="btn-restore text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    data-price="${item.boxPrice}"
                    data-i18n="btnRestore">
                    ${t('btnRestore')}
                </button>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.btn-restore').forEach(btn => {
        btn.addEventListener('click', () => {
            const price = btn.getAttribute('data-price');
            if (onRestore) onRestore({ boxPrice: price });
        });
    });
}

/**
 * Configuración de modales de la interfaz.
 */
export function setupModals() {
    const btnLegal = document.getElementById('btn-legal');
    const btnPrivacy = document.getElementById('btn-privacy');
    const legalModal = document.getElementById('legal-modal');
    const privacyModal = document.getElementById('privacy-modal');

    // 1. Abrir Modal Legal
    if (btnLegal && legalModal) {
        btnLegal.addEventListener('click', (e) => {
            e.preventDefault();
            legalModal.classList.remove('hidden');
        });
    }

    // 2. Abrir Modal Privacidad
    if (btnPrivacy && privacyModal) {
        btnPrivacy.addEventListener('click', (e) => {
            e.preventDefault();
            privacyModal.classList.remove('hidden');
        });
    }

    // 3. Cerrar modales al pulsar cualquier botón que esté dentro de la modal
    const closeButtons = document.querySelectorAll('#legal-modal button, #privacy-modal button, .btn-close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (legalModal) legalModal.classList.add('hidden');
            if (privacyModal) privacyModal.classList.add('hidden');
        });
    });

    // 4. Cerrar modales al hacer clic en el fondo oscuro
    window.addEventListener('click', (e) => {
        if (e.target === legalModal) legalModal.classList.add('hidden');
        if (e.target === privacyModal) privacyModal.classList.add('hidden');
    });

    // 5. Cerrar modales al pulsar la tecla Escape (Accesibilidad por teclado)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (legalModal && !legalModal.classList.contains('hidden')) legalModal.classList.add('hidden');
            if (privacyModal && !privacyModal.classList.contains('hidden')) privacyModal.classList.add('hidden');
        }
    });
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

/**
 * Muestra la insignia del Rango de Oferta (Grade Badge S/A/B/F).
 */
export function renderGradeBadge(grade) {
    const badgeEl = document.getElementById('res-grade-badge');
    if (!badgeEl) return;

    let key = 'gradeF';
    if (grade === 'S') key = 'gradeS';
    else if (grade === 'A') key = 'gradeA';
    else if (grade === 'B') key = 'gradeB';

    badgeEl.setAttribute('data-i18n', key);
    badgeEl.innerText = t(key);
}

/**
 * Renderiza la sección de Métricas Clave (KVI) de coste efectivo.
 */
export function renderKeyMetrics(keyMetrics) {
    const sectionEl = document.getElementById('key-metrics-section');
    const containerEl = document.getElementById('key-metrics-container');
    if (!sectionEl || !containerEl) return;

    if (!keyMetrics || keyMetrics.length === 0) {
        sectionEl.classList.add('hidden');
        containerEl.innerHTML = '';
        return;
    }

    sectionEl.classList.remove('hidden');
    containerEl.innerHTML = keyMetrics.map(metric => `
        <div class="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0 text-xs">
            <span class="font-medium text-gray-800 dark:text-gray-200">
                ${metric.count}x ${metric.name}
            </span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400">
                ${metric.formattedText}
            </span>
        </div>
    `).join('');
}

/**
 * Genera una tarjeta visual PNG mediante HTML5 Canvas para compartir en redes sociales.
 */
export async function generateSocialCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol }) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    if (isProfitable) {
        grad.addColorStop(0, '#059669');
        grad.addColorStop(1, '#047857');
    } else {
        grad.addColorStop(0, '#e11d48');
        grad.addColorStop(1, '#be123c');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Borde decorativo interior
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 568, 368);

    // Título principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PokeBoxValue', 300, 65);

    // Insignia Rango
    let gradeLabel = '🔴 Grado F (Pésima Compra)';
    if (grade === 'S') gradeLabel = '🌟 Grado S (Chollo Total)';
    else if (grade === 'A') gradeLabel = '🟢 Grado A (Muy Buena)';
    else if (grade === 'B') gradeLabel = '🟡 Grado B (Aceptable)';

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(gradeLabel, 300, 100);

    // Panel de Valores
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(50, 130, 500, 150, 16);
    } else {
        ctx.rect(50, 130, 500, 150);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Precio Caja: ${boxPrice} ${currencySymbol}`, 80, 175);
    ctx.fillText(`Valor Real: ${totalValue} ${currencySymbol}`, 80, 215);

    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    const diffText = isProfitable ? `+${Math.abs(diff)} ${currencySymbol}` : `-${Math.abs(diff)} ${currencySymbol}`;
    ctx.fillText(diffText, 520, 195);

    // Marca de agua footer
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('pokeboxvalue.com | Calculadora de Cajas de Pokémon GO', 300, 345);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}