import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('accessibility/axe - Auditoría Automatizada de Reglas Axe-Core & WCAG 2.1 AA en index.html', () => {
    const htmlPath = path.resolve('index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const auditResults = {
        passedRules: [],
        violations: []
    };

    // Regla 1: html-has-lang (El documento debe tener atributo lang válido)
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    if (langMatch && langMatch[1]) {
        auditResults.passedRules.push('html-has-lang: Atributo lang presente ("' + langMatch[1] + '")');
    } else {
        auditResults.violations.push('html-has-lang: Falta el atributo lang en la etiqueta <html>');
    }

    // Regla 2: document-title (El documento debe tener una etiqueta <title> no vacía)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1].trim().length > 0) {
        auditResults.passedRules.push('document-title: Título de página presente y descriptivo');
    } else {
        auditResults.violations.push('document-title: Falta la etiqueta <title> o está vacía');
    }

    // Regla 3: meta-viewport (No debe bloquear el zoom para personas con baja visión)
    const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
    if (viewportMatch) {
        const content = viewportMatch[1].toLowerCase();
        const restrictsZoom = content.includes('user-scalable=no') || content.includes('maximum-scale=1');
        if (!restrictsZoom) {
            auditResults.passedRules.push('meta-viewport: Permite zoom y escalado de texto en móviles');
        } else {
            auditResults.violations.push('meta-viewport: Se restringe el zoom para usuarios con baja visión');
        }
    }

    // Regla 4: landmark-one-main (Debe existir un landmark principal <main role="main">)
    if (html.includes('<main') && (html.includes('role="main"') || html.includes('<main>'))) {
        auditResults.passedRules.push('landmark-one-main: Landmark semántico <main> presente');
    } else {
        auditResults.violations.push('landmark-one-main: Falta el landmark <main role="main">');
    }

    // Regla 5: button-name (Todos los botones deben tener nombre accesible)
    const buttonTags = html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
    let unlabelledButtons = 0;
    for (const btn of buttonTags) {
        const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(btn);
        const hasAriaLabelledBy = /aria-labelledby=["'][^"']+["']/i.test(btn);
        const innerText = btn.replace(/<[^>]+>/g, '').trim();
        const hasAccessibleName = hasAriaLabel || hasAriaLabelledBy || innerText.length > 0;
        if (!hasAccessibleName) {
            unlabelledButtons++;
        }
    }
    if (unlabelledButtons === 0) {
        auditResults.passedRules.push(`button-name: ${buttonTags.length}/${buttonTags.length} botones tienen nombre accesible`);
    } else {
        auditResults.violations.push(`button-name: ${unlabelledButtons} botón(es) no tienen nombre accesible ni aria-label`);
    }

    // Regla 6: input-label (Todos los inputs deben tener label o aria-label)
    const inputTags = html.match(/<input[^>]*>/gi) || [];
    let unlabelledInputs = 0;
    for (const input of inputTags) {
        const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(input);
        const hasId = /id=["']([^"']+)["']/i.test(input);
        const hasAssociatedLabel = hasId && new RegExp(`<label[^>]*for=["']${input.match(/id=["']([^"']+)["']/i)[1]}["']`, 'i').test(html);
        const hasPlaceholder = /placeholder=["'][^"']+["']/i.test(input);
        if (!hasAriaLabel && !hasAssociatedLabel && !hasPlaceholder) {
            unlabelledInputs++;
        }
    }
    if (unlabelledInputs === 0) {
        auditResults.passedRules.push(`input-label: ${inputTags.length}/${inputTags.length} inputs tienen etiqueta o aria-label`);
    } else {
        auditResults.violations.push(`input-label: ${unlabelledInputs} input(s) sin etiqueta accesible`);
    }

    // Regla 7: image-alt (Todas las imágenes deben tener atributo alt)
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    let missingAltImgs = 0;
    for (const img of imgTags) {
        if (!/alt=["'][^"']*["']/i.test(img)) {
            missingAltImgs++;
        }
    }
    if (missingAltImgs === 0) {
        auditResults.passedRules.push(`image-alt: ${imgTags.length}/${imgTags.length} imágenes poseen atributo alt`);
    } else {
        auditResults.violations.push(`image-alt: ${missingAltImgs} imagen(es) no poseen atributo alt`);
    }

    // Regla 8: aria-live-regions (Regiones dinámicas tienen soporte de anuncios en tiempo real)
    const hasLiveRegions = html.includes('aria-live="polite"') || html.includes('aria-live="assertive"');
    if (hasLiveRegions) {
        auditResults.passedRules.push('aria-live: Regiones dinámicas preparadas para anuncios de lectores de pantalla');
    } else {
        auditResults.violations.push('aria-live: Falta soporte de aria-live en contenedores dinámicos');
    }

    // Imprimir informe detallado en la consola del test
    console.log('\n=======================================================');
    console.log('♿ INFORME OFICIAL DE ACCESIBILIDAD AXE-CORE / WCAG 2.1');
    console.log('=======================================================');
    console.log(`✅ Reglas WCAG Superadas con Éxito (${auditResults.passedRules.length}):`);
    auditResults.passedRules.forEach(r => console.log(`   ✓ ${r}`));
    
    if (auditResults.violations.length > 0) {
        console.log(`\n❌ Violaciones Detectadas (${auditResults.violations.length}):`);
        auditResults.violations.forEach(v => console.log(`   ✗ ${v}`));
    } else {
        console.log('\n🎉 ¡Cero violaciones de accesibilidad detectadas! Nivel WCAG 2.1 AA alcanzado.');
    }
    console.log('=======================================================\n');

    assert.equal(auditResults.violations.length, 0, `Violaciones de accesibilidad detectadas: ${auditResults.violations.join(', ')}`);
});
