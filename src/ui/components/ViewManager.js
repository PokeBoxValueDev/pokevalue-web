import { RouterController } from '../controllers/RouterController.js';
import { updateDOMTranslations } from '../../i18n/i18n.js';
import { VIEW_TEMPLATES } from './views-data.js';

/**
 * Renderiza dinámicamente la vista solicitada en el contenedor desacoplado #view-container
 * @param {string} viewName
 */
export function renderView(viewName) {
    if (typeof document === 'undefined') return;
    const viewContainer = document.getElementById('view-container');
    const viewForm = document.getElementById('view-form');
    const viewResult = document.getElementById('view-result');
    const kofiContainer = document.getElementById('kofi-widget-container');

    if (!viewContainer) return;

    if (viewName && VIEW_TEMPLATES[viewName]) {
        if (viewForm) viewForm.classList.add('hidden');
        if (viewResult) viewResult.classList.add('hidden');
        if (kofiContainer) kofiContainer.classList.add('hidden');

        viewContainer.innerHTML = VIEW_TEMPLATES[viewName];
        viewContainer.classList.remove('hidden');

        // Traducir los elementos inyectados en la vista dinámicamente
        updateDOMTranslations();

        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else {
        viewContainer.innerHTML = '';
        viewContainer.classList.add('hidden');
        if (kofiContainer) kofiContainer.classList.remove('hidden');

        if (viewForm) {
            if (viewResult && !viewResult.classList.contains('hidden')) {
                viewForm.classList.add('hidden');
            } else {
                viewForm.classList.remove('hidden');
            }
        }
    }
}

/**
 * Gestor de Vistas y Páginas Secundarias (/faq, /legal, /privacy)
 * Maneja la navegación, delegación de eventos y accesibilidad por teclado.
 */
export function setupViews() {
    if (typeof document === 'undefined') return;

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
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const viewContainer = document.getElementById('view-container');
                if (viewContainer && !viewContainer.classList.contains('hidden') && viewContainer.innerHTML.trim() !== '') {
                    RouterController.closeModalRoute();
                }
            }
        });
    }
}

// Alias de retrocompatibilidad
export const setupModals = setupViews;
