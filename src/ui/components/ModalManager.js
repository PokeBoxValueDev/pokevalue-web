import { RouterController } from '../controllers/RouterController.js';

/**
 * Configuración de modales de la interfaz con soporte para delegación de eventos y touch.
 */
export function setupModals() {
    // Delegación de eventos en document para asegurar la apertura en cualquier dispositivo
    document.addEventListener('click', (e) => {
        const targetBtn = e.target && e.target.closest ? e.target.closest('#btn-legal, #btn-privacy, #btn-cookies, [data-i18n="btnLegal"], [data-i18n="btnPrivacy"], [data-cc="show-preferencesModal"]') : null;
        if (targetBtn) {
            e.preventDefault();
            const id = targetBtn.id || targetBtn.getAttribute('data-i18n') || targetBtn.getAttribute('data-cc');

            if (id === 'btn-legal' || id === 'btnLegal') {
                RouterController.openModalRoute('legal');
            } else if (id === 'btn-privacy' || id === 'btnPrivacy') {
                RouterController.openModalRoute('privacy');
            } else if (id === 'btn-cookies' || id === 'show-preferencesModal') {
                if (typeof window !== 'undefined' && typeof window.CookieConsent !== 'undefined' && typeof window.CookieConsent.showPreferences === 'function') {
                    window.CookieConsent.showPreferences();
                }
            }
        }
    });

    // Cerrar vistas / volver a inicio al pulsar cualquier botón de cierre o volver
    document.addEventListener('click', (e) => {
        const closeBtn = e.target && e.target.closest ? e.target.closest('#legal-modal button, #privacy-modal button, #view-legal button, #view-privacy button, .btn-close-modal, .btn-back-home') : null;
        if (closeBtn) {
            e.preventDefault();
            RouterController.closeModalRoute();
        }
    });

    // Cerrar modales al hacer clic en el fondo oscuro u overlay
    window.addEventListener('click', (e) => {
        const legalModal = document.getElementById('legal-modal');
        const privacyModal = document.getElementById('privacy-modal');
        if ((e.target === legalModal && legalModal && !legalModal.classList.contains('hidden')) ||
            (e.target === privacyModal && privacyModal && !privacyModal.classList.contains('hidden'))) {
            RouterController.closeModalRoute();
        }
    });

    // Cerrar modales al pulsar la tecla Escape (Accesibilidad por teclado)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const legalModal = document.getElementById('legal-modal');
            const privacyModal = document.getElementById('privacy-modal');
            if ((legalModal && !legalModal.classList.contains('hidden')) ||
                (privacyModal && !privacyModal.classList.contains('hidden'))) {
                RouterController.closeModalRoute();
            }
        }
    });
}
