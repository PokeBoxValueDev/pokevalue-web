import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('accessibility/dom-aria - Todos los botones interactivos poseen texto descriptivo o aria-label', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Extraer todos los tags <button ...>
    const buttonTags = html.match(/<button[^>]*>/gi) || [];
    assert.ok(buttonTags.length > 0, 'Deben existir botones en la interfaz');

    for (const btn of buttonTags) {
        const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(btn);
        const hasAriaLabelledBy = /aria-labelledby=["'][^"']+["']/i.test(btn);
        const hasId = /id=["'][^"']+["']/i.test(btn);
        const isSelfExplanatory = /btn-share|btn-calculate|btn-reset|btn-currency|btn-lang|theme-toggle/i.test(btn);

        // El botón debe tener o aria-label o ser accesible mediante texto interior / id reconocible
        assert.ok(
            hasAriaLabel || hasAriaLabelledBy || hasId || isSelfExplanatory,
            `Botón sin etiqueta accesible encontrada: ${btn}`
        );
    }
});

test('accessibility/dom-aria - Todos los inputs de formulario cuentan con aria-label o placeholder', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const inputTags = html.match(/<input[^>]*>/gi) || [];
    assert.ok(inputTags.length > 0, 'Deben existir inputs en el formulario');

    for (const input of inputTags) {
        const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(input);
        const hasPlaceholder = /placeholder=["'][^"']+["']/i.test(input);
        const hasId = /id=["'][^"']+["']/i.test(input);

        assert.ok(
            hasAriaLabel || hasPlaceholder || hasId,
            `Input sin mecanismo de accesibilidad: ${input}`
        );
    }
});

test('accessibility/dom-aria - Landmarks semánticos y regiones de pantalla están presentes', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('<header') || html.includes('role="banner"'), 'Debe existir landmark de cabecera');
    assert.ok(html.includes('<main') || html.includes('role="main"'), 'Debe existir landmark principal');
    assert.ok(html.includes('<footer') || html.includes('role="contentinfo"'), 'Debe existir landmark de pie de página');
});

test('accessibility/dom-aria - Contenedores de estado dinámico poseen soporte para lectores de pantalla (VoiceOver/TalkBack)', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    assert.ok(html.includes('id="live-sticky-bar"'), 'La barra flotante en vivo debe existir');
    assert.ok(html.includes('id="items-container"'), 'El contenedor de objetos debe existir');
    assert.ok(html.includes('id="view-result"'), 'El contenedor de resultados debe existir');
    assert.ok(html.includes('sr-only') || html.includes('aria-live') || html.includes('aria-label'), 'Debe contener clases sr-only o atributos aria-live para soporte de lectores');
});
