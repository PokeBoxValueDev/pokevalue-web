import { RouterController } from '../controllers/RouterController.js';

/**
 * Gestor de Vistas y Páginas Secundarias (/faq, /legal, /privacy)
 * Maneja la navegación, delegación de eventos y accesibilidad por teclado.
 */
export function setupViews() {
    // Delegación de eventos en document para asegurar la navegación en cualquier dispositivo
    document.addEventListener('click', (e) => {
        const targetBtn = e.target && e.target.closest ? e.target.closest('#btn-legal, #btn-privacy, #btn-faq, #btn-cookies, [data-i18n="btnLegal"], [data-i18n="btnPrivacy"], [data-i18n="btnFaq"], [data-cc="show-preferencesModal"]') : null;
        if (targetBtn) {
            e.preventDefault();
            const id = targetBtn.id || targetBtn.getAttribute('data-i18n') || targetBtn.getAttribute('data-cc');

            if (id === 'btn-legal' || id === 'btnLegal') {
                RouterController.openModalRoute('legal');
            } else if (id === 'btn-privacy' || id === 'btnPrivacy') {
                RouterController.openModalRoute('privacy');
            } else if (id === 'btn-faq' || id === 'btnFaq') {
                RouterController.openModalRoute('faq');
            } else if (id === 'btn-cookies' || id === 'show-preferencesModal') {
                if (typeof window !== 'undefined' && typeof window.CookieConsent !== 'undefined' && typeof window.CookieConsent.showPreferences === 'function') {
                    window.CookieConsent.showPreferences();
                }
            }
        }
    });

    // Cerrar vistas / volver a inicio al pulsar cualquier botón de volver
    document.addEventListener('click', (e) => {
        const closeBtn = e.target && e.target.closest ? e.target.closest('#legal-modal button, #privacy-modal button, #view-legal button, #view-privacy button, #view-faq button, .btn-close-modal, .btn-back-home') : null;
        if (closeBtn) {
            e.preventDefault();
            RouterController.closeModalRoute();
        }
    });

    // Volver a la calculadora al pulsar la tecla Escape (Accesibilidad por teclado)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const legalView = document.getElementById('view-legal');
            const privacyView = document.getElementById('view-privacy');
            const faqView = document.getElementById('view-faq');
            if ((legalView && !legalView.classList.contains('hidden')) ||
                (privacyView && !privacyView.classList.contains('hidden')) ||
                (faqView && !faqView.classList.contains('hidden'))) {
                RouterController.closeModalRoute();
            }
        }
    });
}

// Alias de retrocompatibilidad
export const setupModals = setupViews;
