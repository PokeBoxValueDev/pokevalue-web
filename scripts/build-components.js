import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, 'src', 'components');
const indexHtmlPath = path.join(rootDir, 'index.html');

console.log('🔨 Ensamblando index.html desde componentes...');

const headerHtml = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8');
let formHtml = fs.readFileSync(path.join(componentsDir, 'form.html'), 'utf8');
const historyHtml = fs.readFileSync(path.join(componentsDir, 'history.html'), 'utf8');
const resultHtml = fs.readFileSync(path.join(componentsDir, 'result.html'), 'utf8');
const modalsHtml = fs.readFileSync(path.join(componentsDir, 'modals.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8');

// Sustituir include de historial en form.html si existe
formHtml = formHtml.replace('<!--#include "history.html"-->', historyHtml);

const assembledIndexHtml = `<!DOCTYPE html>
<html lang="es" class="h-full">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PokeBoxValue - Calculadora de Cajas para Pokémon GO</title>

    <!-- SEO & Meta -->
    <meta name="description"
        content="Calcula si las cajas de la tienda de Pokémon GO valen la pena. Descubre el valor real de los pases, incubadoras y objetos para ahorrar dinero.">
    <meta name="keywords"
        content="Pokemon Go, Calculadora Cajas, Rentabilidad Cajas, Tienda Pokemon, Pases de Incursión, Incubadoras">
    <!-- Content Security Policy (CSP) -->
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://storage.ko-fi.com https://ko-fi.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://storage.ko-fi.com https://ko-fi.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://raw.githubusercontent.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://cdn.jsdelivr.net https://*.googlesyndication.com https://storage.ko-fi.com https://ko-fi.com; frame-src 'self' https://ko-fi.com https://storage.ko-fi.com; worker-src 'self' blob:; child-src 'self' blob:;">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4f46e5">

    <!-- CSS & Styles -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@v3.0.0/dist/cookieconsent.css">
    <link rel="stylesheet" href="css/styles.css">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="apple-touch-icon" href="favicon.svg">

    <!-- Open Graph / Social Media -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="PokeBoxValue - Calculadora de Cajas para Pokémon GO">
    <meta property="og:description"
        content="Calcula si las cajas de la tienda de Pokémon GO valen la pena y descubre cuánto ahorras.">
    <meta property="og:image" content="https://pokeboxvalue.com/favicon.svg">
    <meta property="og:url" content="https://pokeboxvalue.com/">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="PokeBoxValue - Calculadora de Cajas para Pokémon GO">
    <meta name="twitter:description" content="Calcula si las cajas de la tienda de Pokémon GO valen la pena y descubre cuánto ahorras.">
    <meta name="twitter:image" content="https://pokeboxvalue.com/favicon.svg">

    <!-- Silenciar aviso CDN de Tailwind -->
    <script>
        const origWarn = console.warn;
        console.warn = function (...args) {
            if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com')) return;
            origWarn.apply(console, args);
        };
    </script>

    <!-- Tailwind CDN + Configuración -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        indigo: {
                            50: '#eef2ff',
                            100: '#e0e7ff',
                            500: '#6366f1',
                            600: '#4f46e5',
                            700: '#4338ca',
                        }
                    }
                }
            }
        }
    </script>

    <!-- CookieConsent v3 -->
    <script src="https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@v3.0.0/dist/cookieconsent.umd.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            if (typeof CookieConsent !== 'undefined' && typeof CookieConsent.run === 'function') {
                CookieConsent.run({
                    guiOptions: {
                        consentModal: { layout: 'box', position: 'bottom right' },
                        preferencesModal: { layout: 'box' }
                    },
                    categories: {
                        necessary: { readOnly: true, enabled: true },
                        analytics: { enabled: false }
                    },
                    language: {
                        default: 'es',
                        translations: {
                            es: {
                                consentModal: {
                                    title: 'Privacidad y Cookies',
                                    description: 'Utilizamos cookies mínimas para analítica y medición con Google Analytics. Puedes aceptar o configurar tus preferencias.',
                                    acceptAllBtn: 'Aceptar',
                                    acceptNecessaryBtn: 'Solo necesarias',
                                    showPreferencesBtn: 'Configurar'
                                },
                                preferencesModal: {
                                    title: 'Preferencias de Cookies',
                                    acceptAllBtn: 'Aceptar todas',
                                    acceptNecessaryBtn: 'Rechazar analítica',
                                    savePreferencesBtn: 'Guardar selección',
                                    sections: [
                                        { title: 'Preferencias de almacenamiento', description: 'Personaliza los permisos de cookies.' },
                                        { title: 'Necesarias', description: 'Guarda tus preferencias de idioma, tema e historial en tu navegador.', linkedCategory: 'necessary' },
                                        { title: 'Analítica (Google Analytics)', description: 'Permite medir tráfico anónimo para mejorar la aplicación.', linkedCategory: 'analytics' }
                                    ]
                                }
                            }
                        }
                    },
                    onConsent: ({ cookie }) => {
                        if (cookie.categories.includes('analytics')) {
                            if (typeof gtag === 'function') gtag('consent', 'update', { 'analytics_storage': 'granted' });
                        }
                    },
                    onChange: ({ cookie }) => {
                        if (typeof gtag === 'function') {
                            gtag('consent', 'update', {
                                'analytics_storage': cookie.categories.includes('analytics') ? 'granted' : 'denied'
                            });
                        }
                    }
                });
            }
        });
    </script>

    <!-- Google Consent Mode v2 Default Settings -->
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }

        gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'analytics_storage': 'denied',
            'wait_for_update': 500
        });
    </script>

    <!-- Google Tag Manager / GA4 -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-ES8GHFDWRP"></script>
    <script>
        gtag('js', new Date());
        gtag('config', 'G-ES8GHFDWRP');
    </script>
</head>

<body
    class="bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-full font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">

    <div class="max-w-xl mx-auto px-4 py-6">
${headerHtml}
${formHtml}
${resultHtml}
    </div>

    <!-- Sección de Donaciones (Ko-fi) -->
    <div id="kofi-widget-container" class="text-center my-6 max-w-xl mx-auto px-4 flex justify-center min-h-[42px]">
        <script type='text/javascript' src='https://storage.ko-fi.com/cdn/widget/Widget_2.js' onload="if(typeof kofiwidget2 !== 'undefined'){ const lang = localStorage.getItem('lang') || (navigator.language.startsWith('es') ? 'es' : 'en'); const text = lang === 'es' ? 'Apoyar proyecto' : 'Support Project'; kofiwidget2.init(text, '#72a4f2', 'E1U623YPMD'); kofiwidget2.draw(); }"></script>
        <script type='text/javascript'>
            window.addEventListener('DOMContentLoaded', () => {
                if (typeof kofiwidget2 !== 'undefined' && !document.querySelector('.kofi-button')) {
                    const lang = localStorage.getItem('lang') || (navigator.language.startsWith('es') ? 'es' : 'en');
                    const text = lang === 'es' ? 'Apoyar proyecto' : 'Support Project';
                    kofiwidget2.init(text, '#72a4f2', 'E1U623YPMD');
                    kofiwidget2.draw();
                }
            });
        </script>
    </div>

${footerHtml}
${modalsHtml}

    <!-- Canvas Confetti Library -->
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.min.js"></script>

    <!-- JS Principal -->
    <script type="module" src="js/app.js"></script>
</body>

</html>
`;

fs.writeFileSync(indexHtmlPath, assembledIndexHtml, 'utf8');
console.log('✅ index.html ensamblado con éxito a partir de los componentes.');
