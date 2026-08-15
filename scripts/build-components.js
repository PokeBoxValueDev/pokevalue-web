import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, 'src', 'components');
const headDir = path.join(componentsDir, 'head');
const viewsDir = path.join(componentsDir, 'views');
const templatesDir = path.join(rootDir, 'src', 'templates');
const templateHtmlPath = path.join(templatesDir, 'index.template.html');
const indexHtmlPath = path.join(rootDir, 'index.html');

console.log('🔨 Ensamblando index.html desde componentes y vistas modulares...');

const templateHtml = fs.readFileSync(templateHtmlPath, 'utf8');

// Componentes de Cabecera (Head)
const headSeoSchemaHtml = fs.readFileSync(path.join(headDir, 'seo-schema.html'), 'utf8');
const headThemeInitHtml = fs.readFileSync(path.join(headDir, 'theme-init.html'), 'utf8');
const headCookieConsentHtml = fs.readFileSync(path.join(headDir, 'cookie-consent.html'), 'utf8');
const headAnalyticsHtml = fs.readFileSync(path.join(headDir, 'analytics.html'), 'utf8');

// Componentes Principales
const headerHtml = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8');
let formHtml = fs.readFileSync(path.join(componentsDir, 'form.html'), 'utf8');
const historyHtml = fs.readFileSync(path.join(componentsDir, 'history.html'), 'utf8');
const resultHtml = fs.readFileSync(path.join(componentsDir, 'result.html'), 'utf8');

// Vistas / Páginas secundarias
const legalViewHtml = fs.readFileSync(path.join(viewsDir, 'legal.html'), 'utf8');
const privacyViewHtml = fs.readFileSync(path.join(viewsDir, 'privacy.html'), 'utf8');
const faqViewHtml = fs.readFileSync(path.join(viewsDir, 'faq.html'), 'utf8');

// Componentes adicionales
const kofiHtml = fs.readFileSync(path.join(componentsDir, 'kofi.html'), 'utf8');
const aboutSeoHtml = fs.readFileSync(path.join(componentsDir, 'about-seo.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8');

// Sustituir include de historial en form.html si existe
formHtml = formHtml.replace('<!--#include "history.html"-->', historyHtml);

// Sustituir componentes y vistas modulares en la plantilla
const assembledIndexHtml = templateHtml
    .replace('<!-- @include head-seo-schema -->', headSeoSchemaHtml)
    .replace('<!-- @include head-theme-init -->', headThemeInitHtml)
    .replace('<!-- @include head-cookie-consent -->', headCookieConsentHtml)
    .replace('<!-- @include head-analytics -->', headAnalyticsHtml)
    .replace('<!-- @include header -->', headerHtml)
    .replace('<!-- @include form -->', formHtml)
    .replace('<!-- @include result -->', resultHtml)
    .replace('<!-- @include view-legal -->', legalViewHtml)
    .replace('<!-- @include view-privacy -->', privacyViewHtml)
    .replace('<!-- @include view-faq -->', faqViewHtml)
    .replace('<!-- @include kofi -->', kofiHtml)
    .replace('<!-- @include about-seo -->', aboutSeoHtml)
    .replace('<!-- @include footer -->', footerHtml);

fs.writeFileSync(indexHtmlPath, assembledIndexHtml, 'utf8');
console.log('✅ index.html ensamblado con éxito a partir de las vistas y componentes modulares.');
