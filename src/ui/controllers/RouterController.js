import { state } from '../../config/config.js';
import { I18nController } from './I18nController.js';
import { renderView } from '../components/ViewManager.js';

export class RouterController {
    /**
     * Parsea un pathname dado (ej. "/es", "/en/privacy", "/privacy", "/terms")
     * @param {string} pathname
     * @returns {{ lang: 'es'|'en'|null, view: string, isRecognized: boolean }}
     */
    static parseUrl(pathname = '') {
        if (!pathname || pathname === '/' || pathname === '/index.html') {
            return { lang: null, view: '', isRecognized: true };
        }

        // Limpiar slashes iniciales, finales, /index y .html si existiera
        const clean = pathname
            .replace(/^\/+|\/+$/g, '')
            .replace(/(\/index)?\.html$/i, '')
            .replace(/\/index$/i, '');
        const parts = clean.split('/').filter(Boolean);

        let lang = null;
        let view = '';

        if (parts[0] === 'es' || parts[0] === 'en') {
            lang = parts[0];
            view = parts.slice(1).join('/');
        } else {
            view = parts.join('/');
        }

        view = (view || '').toLowerCase().trim();

        // Normalizar alias de vistas
        if (view === 'terms') view = 'legal';
        if (view === 'faqs') view = 'faq';
        if (view === 'guia') view = 'guide';

        const validViews = ['', 'privacy', 'legal', 'terms', 'faq', 'faqs', 'guide', 'guia'];
        const isRecognized = validViews.includes(view);

        return { lang, view, isRecognized };
    }

    /**
     * Construye una ruta canónica a partir del idioma y la vista
     * @param {string} [lang]
     * @param {string} [view]
     * @returns {string}
     */
    static buildPath(lang, view = '') {
        const targetLang = (lang === 'es' || lang === 'en') ? lang : (state.currentLang || 'es');
        if (!view) {
            return `/${targetLang}`;
        }
        return `/${targetLang}/${view}`;
    }

    /**
     * Inicializa el enrutador
     */
    static init() {
        if (typeof window === 'undefined') return;

        // Comprobar si hubo redirección SPA desde 404.html (vía query param ?p= o sessionStorage)
        const urlParams = new URLSearchParams(window.location.search);
        const spaRedirectPath = urlParams.get('p') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('spa_redirect') : null);
        if (spaRedirectPath) {
            if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('spa_redirect');
            const cleanRedirect = spaRedirectPath.startsWith('/') ? spaRedirectPath : `/${spaRedirectPath}`;
            window.history.replaceState(null, '', cleanRedirect);
        }

        // Delegación de eventos para navegación de vistas / enlaces de pie de página
        if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
            document.addEventListener('click', (e) => {
                const targetBtn = e.target && e.target.closest ? e.target.closest('#btn-guide, #btn-legal, #btn-privacy, #btn-faq, #btn-cookies, [data-i18n="btnGuide"], [data-i18n="btnLegal"], [data-i18n="btnPrivacy"], [data-i18n="btnFaq"], [data-cc="show-preferencesModal"]') : null;
                if (targetBtn) {
                    e.preventDefault();
                    const id = targetBtn.id || targetBtn.getAttribute('data-i18n') || targetBtn.getAttribute('data-cc');

                    if (id === 'btn-guide' || id === 'btnGuide') {
                        RouterController.openModalRoute('guide');
                    } else if (id === 'btn-legal' || id === 'btnLegal') {
                        RouterController.openModalRoute('legal');
                    } else if (id === 'btn-privacy' || id === 'btnPrivacy') {
                        RouterController.openModalRoute('privacy');
                    } else if (id === 'btn-faq' || id === 'btnFaq') {
                        RouterController.openModalRoute('faq');
                    } else if (id === 'btn-cookies' || id === 'btn-reopen-cookies' || id === 'show-preferencesModal') {
                        if (typeof window !== 'undefined' && typeof window.CookieConsent !== 'undefined' && typeof window.CookieConsent.showPreferences === 'function') {
                            window.CookieConsent.showPreferences();
                        }
                    }
                }
            });

            // Cerrar vistas / volver a inicio al pulsar cualquier botón de volver o el logo de cabecera
            document.addEventListener('click', (e) => {
                const closeBtn = e.target && e.target.closest ? e.target.closest('#legal-modal button, #privacy-modal button:not(#btn-reopen-cookies), #view-legal button, #view-privacy button:not(#btn-reopen-cookies), #view-faq button, #view-guide button, .btn-close-modal, .btn-back-home, #site-logo') : null;
                if (closeBtn) {
                    if (e && typeof e.preventDefault === 'function') e.preventDefault();
                    RouterController.closeModalRoute();
                }
            });

            // Accesibilidad por teclado: tecla Escape para volver
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const viewContainer = document.getElementById('view-container');
                    if (viewContainer && !viewContainer.classList.contains('hidden') && viewContainer.innerHTML.trim() !== '') {
                        RouterController.closeModalRoute();
                    }
                }
            });

            // Sincronización de cambio de idioma desde el selector UI
            const langSelect = document.getElementById('lang-select');
            if (langSelect) {
                langSelect.addEventListener('change', () => {
                    RouterController.navigateToLang(langSelect.value);
                });
            }
        }

        // Procesar la ruta actual inicial
        RouterController.handleCurrentRoute({ isInitial: true });

        // Escuchar eventos de navegación del historial (Atrás / Adelante)
        window.addEventListener('popstate', () => {
            RouterController.handleCurrentRoute({ isInitial: false });
        });
    }

    /**
     * Procesa la ruta actual de window.location.pathname o targetPath especificado
     */
    static handleCurrentRoute({ targetPath = null, isInitial = false } = {}) {
        const currentPath = targetPath || ((typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '/');
        const { lang, view, isRecognized } = RouterController.parseUrl(currentPath);

        // Si la ruta no es reconocida y no es raíz ni /index.html, no interferir
        if (!isRecognized && currentPath !== '/' && currentPath !== '/index.html') {
            return;
        }

        // Determinar el idioma correspondiente
        let targetLang = lang;
        if (!targetLang) {
            targetLang = I18nController.detectLanguage();
        }

        // Sincronizar idioma en el controlador si difiere
        if (state.currentLang !== targetLang || isInitial) {
            I18nController.applyLanguage(targetLang);
        }

        // Si estamos en la raíz o falta el prefijo de idioma, actualizar la barra de direcciones sin recargar
        const canonicalPath = RouterController.buildPath(targetLang, view);
        if (typeof window !== 'undefined' && window.history && typeof window.history.replaceState === 'function') {
            if (currentPath !== canonicalPath) {
                window.history.replaceState(null, '', canonicalPath);
            }
        }

        // Actualizar SEO (hreflang y canonical)
        RouterController.updateSeoLinks(targetLang, view);

        // Sincronizar visualización de modales
        RouterController.syncModalsWithView(view);
    }

    /**
     * Navega programáticamente a una ruta
     * @param {string} path
     * @param {{ replace?: boolean }} [options]
     */
    static navigate(path, { replace = false } = {}) {
        const currentPath = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';

        if (typeof window !== 'undefined' && window.history && currentPath !== path) {
            if (replace && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, '', path);
            } else if (!replace && typeof window.history.pushState === 'function') {
                window.history.pushState(null, '', path);
            }
        }

        RouterController.handleCurrentRoute({ targetPath: path, isInitial: false });
    }

    /**
     * Cambia de idioma preservando la vista o modal activo
     * @param {string} newLang
     */
    static navigateToLang(newLang) {
        const { view } = RouterController.parseUrl(typeof window !== 'undefined' ? window.location.pathname : '');
        const newPath = RouterController.buildPath(newLang, view);
        RouterController.navigate(newPath);
    }

    /**
     * Abre una ruta de modal y actualiza la URL
     * @param {'privacy'|'terms'} view
     */
    static openModalRoute(view) {
        const currentLang = state.currentLang || 'es';
        const newPath = RouterController.buildPath(currentLang, view);
        RouterController.navigate(newPath);
    }

    /**
     * Cierra el modal y restablece la URL base del idioma
     */
    static closeModalRoute() {
        const currentLang = state.currentLang || 'es';
        const newPath = RouterController.buildPath(currentLang, '');
        RouterController.navigate(newPath);
    }

    /**
     * Sincroniza la visibilidad de las vistas / modales en el DOM según la vista actual
     * @param {string} view
     */
    static syncModalsWithView(view) {
        if (typeof document === 'undefined') return;
        renderView(view);
    }

    /**
     * Actualiza las etiquetas canonical y hreflang dinámicamente
     * @param {string} lang
     * @param {string} [view]
     */
    static updateSeoLinks(lang, view = '') {
        if (typeof document === 'undefined') return;

        const baseUrl = 'https://pokeboxvalue.com';
        const subpath = view ? `/${view}` : '';

        // Canonical
        let canonicalEl = typeof document.querySelector === 'function' ? document.querySelector('link[rel="canonical"]') : null;
        if (!canonicalEl && document.head && typeof document.createElement === 'function') {
            canonicalEl = document.createElement('link');
            canonicalEl.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalEl);
        }
        if (canonicalEl && typeof canonicalEl.setAttribute === 'function') {
            canonicalEl.setAttribute('href', `${baseUrl}/${lang}${subpath}`);
        }

        // OpenGraph URL
        const ogUrl = typeof document.querySelector === 'function' ? document.querySelector('meta[property="og:url"]') : null;
        if (ogUrl && typeof ogUrl.setAttribute === 'function') {
            ogUrl.setAttribute('content', `${baseUrl}/${lang}${subpath}`);
        }

        // Atributo lang en <html>
        if (document.documentElement && typeof document.documentElement.setAttribute === 'function') {
            document.documentElement.setAttribute('lang', lang);
        }
    }
}
