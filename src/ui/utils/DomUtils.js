import { IOSDeviceDetector } from '../ios/IOSDeviceDetector.js';

/**
 * Obtiene un elemento del DOM a partir de un elemento o su ID.
 * @param {HTMLElement|string} elementOrId
 * @returns {HTMLElement|null}
 */
export function getElement(elementOrId) {
    if (typeof document === 'undefined' || !elementOrId) return null;
    return typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
}

/**
 * Vincula una acción asíncrona a un botón protegiendo contra llamadas concurrentes (Guard state).
 * @param {HTMLElement|string} elementOrId
 * @param {(event: Event, element: HTMLElement) => Promise<void>} asyncFn
 * @param {{ onStart?: (el: HTMLElement) => void, onEnd?: (el: HTMLElement) => void, haptic?: number }} [options]
 */
export function bindAsyncButton(elementOrId, asyncFn, { onStart, onEnd, haptic = 0 } = {}) {
    const el = getElement(elementOrId);
    if (!el || typeof el.addEventListener !== 'function') return;

    let isBusy = false;

    el.addEventListener('click', async (event) => {
        if (isBusy) return;
        isBusy = true;

        if (haptic > 0) {
            IOSDeviceDetector.triggerHapticFeedback(haptic);
        }

        if (typeof onStart === 'function') {
            onStart(el);
        }

        try {
            await asyncFn(event, el);
        } finally {
            isBusy = false;
            if (typeof onEnd === 'function') {
                onEnd(el);
            }
        }
    });
}

/**
 * Vincula un evento 'click' con soporte para preventDefault y feedback háptico.
 * @param {HTMLElement|string} elementOrId
 * @param {(event: Event, element: HTMLElement) => void} handler
 * @param {{ haptic?: number, preventDefault?: boolean }} [options]
 */
export function bindClick(elementOrId, handler, { haptic = 0, preventDefault = false } = {}) {
    const el = getElement(elementOrId);
    if (!el || typeof el.addEventListener !== 'function') return;

    el.addEventListener('click', (event) => {
        if (event && preventDefault && typeof event.preventDefault === 'function') {
            event.preventDefault();
        }
        if (haptic > 0) {
            IOSDeviceDetector.triggerHapticFeedback(haptic);
        }
        handler(event, el);
    });
}

/**
 * Dispara de forma segura un evento personalizado en document.
 * @param {string} eventName
 * @param {any} [detail]
 */
export function dispatchCustomEvent(eventName, detail = null) {
    if (typeof document === 'undefined' || typeof document.dispatchEvent !== 'function') return;
    try {
        const event = (typeof CustomEvent === 'function')
            ? new CustomEvent(eventName, { bubbles: true, detail })
            : { type: eventName, detail };
        document.dispatchEvent(event);
    } catch (_) {}
}
