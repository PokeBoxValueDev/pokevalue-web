/**
 * Utilidad para detectar dispositivos iOS (iPhone, iPad, iPod, iPadOS).
 */
export class IOSDeviceDetector {
    /**
     * Comprueba si el dispositivo actual es un dispositivo con sistema operativo iOS / iPadOS.
     * @param {Object} [customWindow] - Objeto window mockeable para pruebas.
     * @returns {boolean} True si se detecta un dispositivo iOS.
     */
    static isIOS(customWindow = (typeof window !== 'undefined' ? window : null)) {
        if (!customWindow || !customWindow.navigator) return false;

        const nav = customWindow.navigator;
        const ua = nav.userAgent || '';
        const platform = nav.platform || '';

        const isIOSUA = /iPhone|iPad|iPod/i.test(ua);
        const isIPadOS = (/Mac/i.test(platform) || /Macintosh/i.test(ua)) && nav.maxTouchPoints > 1;

        return isIOSUA || isIPadOS;
    }

    /**
     * Aplica la clase `.is-ios` al elemento `<html>` si se detecta un dispositivo iOS.
     */
    static applyIOSClassIfNeeded(customDocument = (typeof document !== 'undefined' ? document : null)) {
        if (!customDocument || !customDocument.documentElement) return false;

        const isDeviceIOS = this.isIOS();
        if (isDeviceIOS) {
            customDocument.documentElement.classList.add('is-ios');
        } else {
            customDocument.documentElement.classList.remove('is-ios');
        }
        return isDeviceIOS;
    }

    /**
     * Activa una vibración háptica sutil de confirmación táctil de 10ms si el navegador lo soporta.
     */
    static triggerHapticFeedback(durationMs = 10) {
        if (typeof window !== 'undefined' && window.navigator && 'vibrate' in window.navigator) {
            try {
                window.navigator.vibrate(durationMs);
            } catch (e) {
                // Ignorar fallos de API de vibración si el usuario la tiene bloqueada
            }
        }
    }
}
