import { HistoryRepository } from '../../infrastructure/repositories/HistoryRepository.js';
import { t } from '../../i18n/i18n.js';
import { IOSDeviceDetector } from '../ios/IOSDeviceDetector.js';

let currentlySwipedCard = null;

/**
 * Historial de cálculos previos con soporte para gestos táctiles de deslizamiento (Swipe to Delete).
 */
export function renderHistory(onRestore) {
    const historySection = document.getElementById('history-section');
    const container = document.getElementById('history-container');
    const history = HistoryRepository.getHistory();

    if (!container) return;

    if (history.length === 0) {
        if (historySection) historySection.classList.add('hidden');
        container.innerHTML = '';
        currentlySwipedCard = null;
        return;
    }

    if (historySection) historySection.classList.remove('hidden');

    container.innerHTML = history.map((item, index) => {
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

        const customNameHtml = item.boxName ? `
            <div class="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white mb-1">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                    <svg class="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M17.707 9.293l-5-5A.997.997 0 0012 4H4a1 1 0 00-1 1v8c0 .266.105.52.293.707l5 5a1 1 0 001.414 0l8-8a1 1 0 000-1.414zM6 8a2 2 0 110-4 2 2 0 010 4z"/></svg>
                    <span>${item.boxName}</span>
                </span>
            </div>
        ` : '';

        return `
            <div class="history-item-wrapper relative overflow-hidden rounded-2xl mb-2 transition-all duration-300 max-h-48" data-index="${index}">
                <!-- Capa Trasera: Acción Deslizable Eliminar estilo Apple iOS -->
                <div class="swipe-delete-background absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-rose-600 to-rose-500 rounded-r-2xl flex items-center justify-center text-white z-0 select-none">
                    <button type="button" class="btn-delete-row w-full h-full flex flex-col items-center justify-center gap-1 text-white font-bold text-xs cursor-pointer active:scale-95 touch-manipulation" data-index="${index}" aria-label="${t('btnDelete') || 'Eliminar'}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        <span>${t('btnDelete') || 'Eliminar'}</span>
                    </button>
                </div>

                <!-- Capa Frontal: Contenido Principal de la Tarjeta -->
                <div class="history-card-content relative z-10 p-3 sm:p-3.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-gray-700/80 flex items-center justify-between shadow-2xs transition-transform duration-200 ease-out will-change-transform touch-pan-y select-none">
                    <div class="space-y-1 min-w-0 flex-1 pr-2">
                        ${customNameHtml}
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold ${statusColor} px-2.5 py-0.5 rounded-full" data-i18n="${badgeKey}">
                                ${badgeText}
                            </span>
                            <span class="text-[10px] text-gray-400 font-medium">${dateStr}</span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            <span data-i18n="resBoxPrice">${t('resBoxPrice')}</span> <b>${formattedBoxPrice}${item.currencySymbol}</b> | 
                            <span data-i18n="resRealValue">${t('resRealValue')}</span> <b>${formattedTotalValue}${item.currencySymbol}</b>
                        </p>
                    </div>
                    <button 
                        type="button" 
                        class="btn-restore text-xs text-indigo-600 dark:text-indigo-400 font-bold px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl shadow-2xs transition active:scale-95 cursor-pointer touch-manipulation flex-shrink-0"
                        data-index="${index}"
                        data-i18n="btnRestore">
                        ${t('btnRestore')}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Función para animar y eliminar una fila del historial
    const deleteRowWithAnimation = (index, wrapperEl) => {
        if (!wrapperEl) return;
        IOSDeviceDetector.triggerHapticFeedback(15);
        wrapperEl.style.transition = 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)';
        wrapperEl.style.transform = 'translateX(-100%)';
        wrapperEl.style.opacity = '0';
        wrapperEl.style.maxHeight = '0px';
        wrapperEl.style.paddingTop = '0px';
        wrapperEl.style.paddingBottom = '0px';
        wrapperEl.style.marginBottom = '0px';
        wrapperEl.style.marginTop = '0px';

        setTimeout(() => {
            HistoryRepository.deleteCalculation(index);
            renderHistory(onRestore);
        }, 250);
    };

    // Botones de restaurar
    container.querySelectorAll('.btn-restore').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = btn.getAttribute('data-index');
            if (onRestore) onRestore(history[index]);
        });
    });

    // Botones de eliminar revelados tras deslizar
    container.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = btn.getAttribute('data-index');
            const wrapper = btn.closest('.history-item-wrapper');
            deleteRowWithAnimation(index, wrapper);
        });
    });

    // Soporte de Gestos Táctiles Apple Swipe to Delete (touchstart / touchmove / touchend)
    container.querySelectorAll('.history-item-wrapper').forEach(wrapper => {
        const card = wrapper.querySelector('.history-card-content');
        const index = wrapper.getAttribute('data-index');
        if (!card) return;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isSwiping = false;
        let isOpen = false;

        const resetCard = () => {
            card.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)';
            card.style.transform = 'translateX(0px)';
            isOpen = false;
            if (currentlySwipedCard === card) currentlySwipedCard = null;
        };

        const openCard = () => {
            if (currentlySwipedCard && currentlySwipedCard !== card) {
                currentlySwipedCard.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)';
                currentlySwipedCard.style.transform = 'translateX(0px)';
            }
            card.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)';
            card.style.transform = 'translateX(-80px)';
            isOpen = true;
            currentlySwipedCard = card;
            IOSDeviceDetector.triggerHapticFeedback(10);
        };

        card.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentX = startX;
            isSwiping = false;
            card.style.transition = 'none';
        }, { passive: true });

        card.addEventListener('touchmove', (e) => {
            if (e.touches.length !== 1) return;
            currentX = e.touches[0].clientX;
            const deltaX = currentX - startX;
            const deltaY = e.touches[0].clientY - startY;

            // Si el movimiento es predominantemente horizontal
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
                isSwiping = true;
                if (isOpen) {
                    // Si ya estaba abierto, permitir mover hacia la derecha para cerrar o más a la izquierda
                    const offset = -80 + deltaX;
                    card.style.transform = `translateX(${Math.min(0, Math.max(offset, -160))}px)`;
                } else if (deltaX < 0) {
                    // Deslizar hacia la izquierda
                    const damping = deltaX < -80 ? -80 + (deltaX + 80) * 0.35 : deltaX;
                    card.style.transform = `translateX(${damping}px)`;
                }
            }
        }, { passive: true });

        card.addEventListener('touchend', () => {
            if (!isSwiping) return;
            const deltaX = currentX - startX;

            if (isOpen) {
                if (deltaX > 30) {
                    resetCard();
                } else if (deltaX < -80) {
                    // Deslizamiento completo rápido -> Eliminar directamente
                    deleteRowWithAnimation(index, wrapper);
                } else {
                    openCard();
                }
            } else {
                if (deltaX < -140) {
                    // Deslizamiento largo completo -> Borrar directamente
                    deleteRowWithAnimation(index, wrapper);
                } else if (deltaX < -45) {
                    openCard();
                } else {
                    resetCard();
                }
            }
        }, { passive: true });
    });
}

