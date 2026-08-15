import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const componentsDir = path.join(rootDir, 'src', 'components');
const templatesDir = path.join(rootDir, 'src', 'templates');
const templateHtmlPath = path.join(templatesDir, 'index.template.html');
const indexHtmlPath = path.join(rootDir, 'index.html');

console.log('🔨 Ensamblando index.html desde componentes y plantilla base...');

const templateHtml = fs.readFileSync(templateHtmlPath, 'utf8');
const headerHtml = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8');
let formHtml = fs.readFileSync(path.join(componentsDir, 'form.html'), 'utf8');
const historyHtml = fs.readFileSync(path.join(componentsDir, 'history.html'), 'utf8');
const resultHtml = fs.readFileSync(path.join(componentsDir, 'result.html'), 'utf8');
const modalsHtml = fs.readFileSync(path.join(componentsDir, 'modals.html'), 'utf8');
const footerHtml = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8');

// Sustituir include de historial en form.html si existe
formHtml = formHtml.replace('<!--#include "history.html"-->', historyHtml);

// Sustituir componentes modulares en la plantilla
const assembledIndexHtml = templateHtml
    .replace('<!-- @include header -->', headerHtml)
    .replace('<!-- @include form -->', formHtml)
    .replace('<!-- @include result -->', resultHtml)
    .replace('<!-- @include modals -->', modalsHtml)
    .replace('<!-- @include footer -->', footerHtml);

fs.writeFileSync(indexHtmlPath, assembledIndexHtml, 'utf8');
console.log('✅ index.html ensamblado con éxito a partir de src/templates/index.template.html.');
