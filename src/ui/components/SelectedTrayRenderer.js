import { CATEGORY_CONFIG } from '../../config/config.js';
import { t } from '../../i18n/i18n.js';
import { IOSDeviceDetector } from '../ios/IOSDeviceDetector.js';

function triggerInputEvent(input) {
    if (!input || typeof input.dispatchEvent !== 'function') return;
    try {
        const win = (input.ownerDocument && input.ownerDocument.defaultView) || (typeof window !== 'undefined' ? window : globalThis);
        const EvtClass = (win && win.Event) || Event;
        input.dispatchEvent(new EvtClass('input', { bubbles: true }));
    } catch (_) {
        try {
            const evt = (typeof CustomEvent === 'function') ? new CustomEvent('input', { bubbles: true }) : { type: 'input' };
            input.dispatchEvent(evt);
        } catch (_) {}
    }
}

/**
 * Muestra una animación flotante de feedback al interactuar (+5, +10, +1, -1)
 * @param {HTMLElement} targetElement
 * @param {string} text
 * @param {boolean} [isPositive=true]
 */
export function showFloatingFeedback(targetElement, text, isPositive = true) {
    if (!targetElement || typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    try {
        const rect = targetElement.getBoundingClientRect();
        const badge = document.createElement('span');
        badge.className = `fixed pointer-events-none z-50 text-xs font-black px-1.5 py-0.5 rounded-full shadow-md transition-all duration-500 ease-out transform -translate-x-1/2 -translate-y-full ${
            isPositive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`;
        badge.style.left = `${rect.left + rect.width / 2}px`;
        badge.style.top = `${rect.top - 4}px`;
        badge.style.opacity = '1';
        badge.textContent = text;
        document.body.appendChild(badge);

        requestAnimationFrame(() => {
            badge.style.top = `${rect.top - 24}px`;
            badge.style.opacity = '0';
        });

        setTimeout(() => {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        }, 520);
    } catch (_) {}
}

/**
 * Actualiza la bandeja de chips de objetos seleccionados (1C).
 */
export function updateSelectedTray() {
    if (typeof document === 'undefined') return;
    const tray = document.getElementById('selected-items-tray');
    const chipsList = document.getElementById('selected-chips-list');
    const container = document.getElementById('items-container');
    if (!tray || !chipsList || !container) return;

    const selectedCards = [];
    container.querySelectorAll('.item-card').forEach(card => {
        const input = card.querySelector('.item-qty');
        const qty = input ? (parseInt(input.value) || 0) : 0;
        if (qty > 0) {
            const id = card.getAttribute('data-card-id');
            const name = card.getAttribute('data-item-name') || t('defaultItem') || 'Objeto';
            const category = card.getAttribute('data-category') || 'pases';
            selectedCards.push({ id, name, qty, category, card, input });
        }
    });

    if (selectedCards.length === 0) {
        tray.classList.add('hidden');
        chipsList.innerHTML = '';
        return;
    }

    tray.classList.remove('hidden');
    chipsList.innerHTML = selectedCards.map(item => {
        const catConfig = CATEGORY_CONFIG[item.category] || { color: 'bg-indigo-500', border: 'border-indigo-200/80 dark:border-indigo-800/60' };
        const badgeColor = catConfig.color || 'bg-indigo-500';
        const borderClass = catConfig.border || 'border-indigo-200/80 dark:border-indigo-800/60';
        const removeLabel = `${t('removeItem') || 'Eliminar'} ${item.name}`;
        return `
        <div class="selected-chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 border ${borderClass} shadow-2xs text-[11px] font-semibold text-gray-900 dark:text-white hover:opacity-90 transition cursor-pointer" data-id="${item.id}">
            <span class="px-1 py-0.2 rounded ${badgeColor} text-white text-[9px] font-extrabold">${item.qty}x</span>
            <span class="truncate max-w-[100px] sm:max-w-[150px]">${item.name}</span>
            <button type="button" class="btn-remove-chip p-0.5 text-gray-400 hover:text-rose-500 rounded transition cursor-pointer touch-manipulation" data-id="${item.id}" aria-label="${removeLabel}">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
    `;
    }).join('');

    chipsList.querySelectorAll('.btn-remove-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            IOSDeviceDetector.triggerHapticFeedback(10);
            const id = btn.getAttribute('data-id');
            const card = container.querySelector(`.item-card[data-card-id="${id}"]`);
            const input = card ? card.querySelector('.item-qty') : null;
            if (input) {
                input.value = 0;
                triggerInputEvent(input);
            }
        });
    });

    chipsList.querySelectorAll('.selected-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            IOSDeviceDetector.triggerHapticFeedback(10);
            const id = chip.getAttribute('data-id');
            const card = container.querySelector(`.item-card[data-card-id="${id}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.classList.add('ring-2', 'ring-indigo-500');
                setTimeout(() => card.classList.remove('ring-2', 'ring-indigo-500'), 1200);
            }
        });
    });
}
