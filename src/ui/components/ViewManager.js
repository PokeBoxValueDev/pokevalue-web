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

    // Normalizar viewName (quitar barras, minúsculas, mapear alias)
    const normalizedView = (viewName || '').toLowerCase().replace(/^\/+|\/+$/g, '');
    const canonicalKey = (normalizedView === 'terms' ? 'legal' : (normalizedView === 'faqs' ? 'faq' : normalizedView));

    if (canonicalKey && VIEW_TEMPLATES && VIEW_TEMPLATES[canonicalKey]) {
        if (viewForm) {
            viewForm.classList.add('hidden');
            if (viewForm.style) viewForm.style.display = 'none';
        }
        if (viewResult) {
            viewResult.classList.add('hidden');
            if (viewResult.style) viewResult.style.display = 'none';
        }
        if (kofiContainer) {
            kofiContainer.classList.add('hidden');
            if (kofiContainer.style) kofiContainer.style.display = 'none';
        }

        viewContainer.innerHTML = VIEW_TEMPLATES[canonicalKey];
        viewContainer.classList.remove('hidden');
        if (viewContainer.style) viewContainer.style.display = 'block';

        // Traducir los elementos inyectados en la vista dinámicamente
        updateDOMTranslations();

        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (!canonicalKey) {
        // Solo limpiar si explícitamente se vuelve a la raíz (sin vista)
        viewContainer.innerHTML = '';
        viewContainer.classList.add('hidden');
        if (viewContainer.style) viewContainer.style.display = 'none';

        if (kofiContainer) {
            kofiContainer.classList.remove('hidden');
            if (kofiContainer.style) kofiContainer.style.display = '';
        }

        if (viewForm) {
            if (viewResult && !viewResult.classList.contains('hidden') && (!viewResult.style || viewResult.style.display !== 'none')) {
                viewForm.classList.add('hidden');
                if (viewForm.style) viewForm.style.display = 'none';
            } else {
                viewForm.classList.remove('hidden');
                if (viewForm.style) viewForm.style.display = '';
            }
        }
    }
}

/**
 * Gestor de Vistas y Páginas Secundarias (/faq, /legal, /privacy)
 * Maneja la navegación y delegación de eventos en el DOM.
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
                renderView('legal');
            } else if (id === 'btn-privacy' || id === 'btnPrivacy') {
                renderView('privacy');
            } else if (id === 'btn-faq' || id === 'btnFaq') {
                renderView('faq');
            } else if (id === 'btn-cookies' || id === 'btn-reopen-cookies' || id === 'show-preferencesModal') {
                if (typeof window !== 'undefined' && typeof window.CookieConsent !== 'undefined' && typeof window.CookieConsent.showPreferences === 'function') {
                    window.CookieConsent.showPreferences();
                }
            }
        }
    });

    // Cerrar vistas / volver a inicio al pulsar cualquier botón de volver o el logo
    document.addEventListener('click', (e) => {
        const closeBtn = e.target && e.target.closest ? e.target.closest('#legal-modal button, #privacy-modal button:not(#btn-reopen-cookies), #view-legal button, #view-privacy button:not(#btn-reopen-cookies), #view-faq button, .btn-close-modal, .btn-back-home, #site-logo') : null;
        if (closeBtn) {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            renderView('');
        }
    });
}

// Alias de retrocompatibilidad
export const setupModals = setupViews;

