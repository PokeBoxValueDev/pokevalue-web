import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, 'src', 'components');
const headDir = path.join(componentsDir, 'head');
const viewsDir = path.join(componentsDir, 'views');
const templatesDir = path.join(rootDir, 'src', 'templates');
const templateHtmlPath = path.join(templatesDir, 'index.template.html');
const indexHtmlPath = path.join(rootDir, 'index.html');
const viewsDataJsPath = path.join(rootDir, 'src', 'ui', 'components', 'views-data.js');

console.log('🔨 Ensamblando componentes modulares...');

const templateHtml = fs.readFileSync(templateHtmlPath, 'utf8');

// Componentes de Cabecera (Head)
const headSeoSchemaHtml = fs.readFileSync(path.join(headDir, 'seo-schema.html'), 'utf8');
const headThemeInitHtml = fs.readFileSync(path.join(headDir, 'theme-init.html'), 'utf8');
const headCookieConsentHtml = fs.readFileSync(path.join(headDir, 'cookie-consent.html'), 'utf8');
const headAnalyticsHtml = fs.readFileSync(path.join(headDir, 'analytics.html'), 'utf8');

// Componentes Principales de la Calculadora
const headerHtml = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8');
let formHtml = fs.readFileSync(path.join(componentsDir, 'form.html'), 'utf8');
const historyHtml = fs.readFileSync(path.join(componentsDir, 'history.html'), 'utf8');
const resultHtml = fs.readFileSync(path.join(componentsDir, 'result.html'), 'utf8');

// Vistas / Páginas secundarias (Desacopladas de index.html)
const legalViewHtml = fs.readFileSync(path.join(viewsDir, 'legal.html'), 'utf8');
const privacyViewHtml = fs.readFileSync(path.join(viewsDir, 'privacy.html'), 'utf8');
const faqViewHtml = fs.readFileSync(path.join(viewsDir, 'faq.html'), 'utf8');

// Generar módulo desacoplado de plantillas de vistas para renderizado dinámico bajo demanda
const viewsDataContent = `/**
 * Vistas secundarias desacopladas generadas automáticamente desde src/components/views/
 * Evita inflar index.html y permite renderizado modular bajo demanda.
 */
export const VIEW_TEMPLATES = {
    legal: ${JSON.stringify(legalViewHtml)},
    terms: ${JSON.stringify(legalViewHtml)},
    privacy: ${JSON.stringify(privacyViewHtml)},
    faq: ${JSON.stringify(faqViewHtml)},
    faqs: ${JSON.stringify(faqViewHtml)}
};
`;
fs.writeFileSync(viewsDataJsPath, viewsDataContent, 'utf8');
console.log('✅ src/ui/components/views-data.js generado con éxito.');

// Componentes adicionales
const kofiHtml = fs.readFileSync(path.join(componentsDir, 'kofi.html'), 'utf8');
const aboutSeoHtml = fs.readFileSync(path.join(componentsDir, 'about-seo.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8');

// Sustituir include de historial en form.html si existe
formHtml = formHtml.replace('<!--#include "history.html"-->', historyHtml);

// Sustituir componentes de la calculadora en la plantilla maestra
const assembledIndexHtml = templateHtml
    .replace('<!-- @include head-seo-schema -->', headSeoSchemaHtml)
    .replace('<!-- @include head-theme-init -->', headThemeInitHtml)
    .replace('<!-- @include head-cookie-consent -->', headCookieConsentHtml)
    .replace('<!-- @include head-analytics -->', headAnalyticsHtml)
    .replace('<!-- @include header -->', headerHtml)
    .replace('<!-- @include form -->', formHtml)
    .replace('<!-- @include result -->', resultHtml)
    .replace('<!-- @include kofi -->', kofiHtml)
    .replace('<!-- @include about-seo -->', aboutSeoHtml)
    .replace('<!-- @include footer -->', footerHtml);

fs.writeFileSync(indexHtmlPath, assembledIndexHtml, 'utf8');
console.log('✅ index.html ensamblado con éxito (núcleo ligero sin vistas secundarias inyectadas).');
