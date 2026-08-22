import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { ItemMapper } from '../../src/infrastructure/mappers/ItemMapper.js';
import { renderItems } from '../../src/ui/components/ItemCardRenderer.js';
import { state } from '../../src/config/config.js';

describe('visual/layout-integrity - Layout Collision & CSS Overflow Integrity', () => {
    it('css/styles.css does NOT restrict items-container with rigid max-height clamp', () => {
        const cssContent = fs.readFileSync(path.resolve('css/styles.css'), 'utf8');
        // Asegurar que #items-container no tenga max-height con clamp que rompa el flujo vertical
        const match = cssContent.match(/#items-container\s*\{[^}]*max-height:\s*clamp\([^}]*\}/i);
        assert.equal(match, null, 'items-container must NOT have rigid max-height clamp which causes overlapping');
    });

    it('index.html structure preserves natural document flow without overlapping footer', () => {
        const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
        const dom = new JSDOM(html, { runScripts: 'outside-only' });
        const doc = dom.window.document;

        const main = doc.querySelector('main');
        const viewForm = doc.querySelector('#view-form');
        const itemsContainer = doc.querySelector('#items-container');
        const aboutSeo = doc.querySelector('#about-seo-section');
        const footer = doc.querySelector('footer');

        assert.ok(main, 'Main tag must exist');
        assert.ok(viewForm, 'view-form must exist');
        assert.ok(itemsContainer, 'items-container must exist');
        assert.ok(aboutSeo, 'about-seo-section must exist');
        assert.ok(footer, 'Footer must exist');

        // Verificar que items-container sea descendiente de view-form
        assert.ok(viewForm.contains(itemsContainer), 'items-container must be inside view-form');

        // Verificar que about-seo-section y footer estén DESPUÉS de view-form en el orden del DOM
        const isAboutAfterForm = viewForm.compareDocumentPosition(aboutSeo) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING;
        assert.ok(isAboutAfterForm, 'about-seo-section must follow view-form in DOM order');

        const isFooterAfterForm = viewForm.compareDocumentPosition(footer) & dom.window.Node.DOCUMENT_POSITION_FOLLOWING;
        assert.ok(isFooterAfterForm, 'footer must follow view-form in DOM order');
    });

    it('dark mode classes in components do not use non-standard Tailwind values (gray-850/gray-750)', () => {
        const componentFiles = [
            'src/components/form.html',
            'src/components/result.html',
            'src/ui/components/CategoryFilterManager.js',
            'src/ui/components/ItemCardRenderer.js',
            'src/ui/components/SelectedTrayRenderer.js'
        ];

        componentFiles.forEach(file => {
            const content = fs.readFileSync(path.resolve(file), 'utf8');
            assert.ok(!content.includes('gray-850'), `${file} should not contain invalid class gray-850`);
            assert.ok(!content.includes('gray-750'), `${file} should not contain invalid class gray-750`);
        });
    });
});
