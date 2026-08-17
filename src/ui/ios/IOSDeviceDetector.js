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
        const vendor = nav.vendor || '';

        const isIOSUA = /iPhone|iPad|iPod/i.test(ua);
        const isAppleVendor = /Apple/i.test(vendor);
        const isTouchMac = (/Mac/i.test(platform) || /Macintosh/i.test(ua)) && (nav.maxTouchPoints && nav.maxTouchPoints > 0);
        const isStandaloneIOS = (customWindow.matchMedia && customWindow.matchMedia('(display-mode: standalone)').matches && isAppleVendor);

        // Permitir forzar/probar el modo iOS si el usuario guarda la preferencia
        try {
            if (typeof localStorage !== 'undefined') {
                const manualIOS = localStorage.getItem('force-ios-mode');
                if (manualIOS === 'true') return true;
                if (manualIOS === 'false') return false;
            }
        } catch (e) { }

        return Boolean(isIOSUA || isTouchMac || isStandaloneIOS);
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
     * Comprueba si la aplicación está ejecutándose como PWA instalada desde la pantalla de inicio.
     * @param {Object} [customWindow]
     * @returns {boolean}
     */
    static isStandalone(customWindow = (typeof window !== 'undefined' ? window : null)) {
        if (!customWindow) return false;
        const isIOSStandalone = Boolean(customWindow.navigator && customWindow.navigator.standalone === true);
        const isDisplayStandalone = Boolean(customWindow.matchMedia && (
            customWindow.matchMedia('(display-mode: standalone)').matches ||
            customWindow.matchMedia('(display-mode: fullscreen)').matches ||
            customWindow.matchMedia('(display-mode: minimal-ui)').matches
        ));
        return isIOSStandalone || isDisplayStandalone;
    }

    /**
     * Comprueba si se debe mostrar la sugerencia de instalación (siempre que se acceda desde el navegador y no desde el icono de inicio).
     * @param {Object} [customWindow]
     * @returns {boolean}
     */
    static shouldShowIOSInstallPrompt(customWindow = (typeof window !== 'undefined' ? window : null)) {
        if (!this.isIOS(customWindow)) return false;

        // Si ya se accede desde el acceso de la pantalla de inicio (Standalone), NO mostrar nunca
        if (this.isStandalone(customWindow)) return false;

        // Si el usuario lo cerró en la pestaña/sesión actual, ocultarlo hasta la siguiente visita
        try {
            if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ios-install-dismissed') === 'true') {
                return false;
            }
        } catch (_) { }

        return true;
    }

    /**
     * Inicializa los eventos y visibilidad del banner de instalación inteligente de iOS.
     * @param {Object} [customDocument]
     * @param {Object} [customWindow]
     */
    static setupIOSInstallBanner(customDocument = (typeof document !== 'undefined' ? document : null), customWindow = (typeof window !== 'undefined' ? window : null)) {
        if (!customDocument) return;
        const banner = customDocument.getElementById('ios-install-banner');
        if (!banner) return;

        if (this.shouldShowIOSInstallPrompt(customWindow)) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }

        const closeBtn = customDocument.getElementById('btn-close-ios-banner');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                banner.classList.add('hidden');
                try {
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.setItem('ios-install-dismissed', 'true');
                    }
                } catch (_) { }
            });
        }
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
