import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('contract/architecture - Regla 5: index.html debe ser ligero y no contener vistas secundarias inyectadas', () => {
    const rootDir = process.cwd();
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Comprobar que index.html NO contiene las secciones completas de las vistas secundarias
    assert.ok(!indexHtml.includes('id="view-legal"'), 'index.html no debe contener <section id="view-legal"> embebido');
    assert.ok(!indexHtml.includes('id="view-privacy"'), 'index.html no debe contener <section id="view-privacy"> embebido');
    assert.ok(!indexHtml.includes('id="view-faq"'), 'index.html no debe contener <section id="view-faq"> embebido');

    // Comprobar que existe el contenedor dinámico para renderizado bajo demanda
    assert.ok(indexHtml.includes('id="view-container"'), 'index.html debe contener <div id="view-container"></div>');
});

test('contract/architecture - Componentes modulares existen en src/components/', () => {
    const rootDir = process.cwd();
    const componentsDir = path.join(rootDir, 'src', 'components');

    const expectedComponents = [
        'header.html',
        'form.html',
        'result.html',
        'history.html',
        'kofi.html',
        'about-seo.html',
        'footer.html',
        'head/seo-schema.html',
        'head/theme-init.html',
        'head/cookie-consent.html',
        'head/analytics.html',
        'views/legal.html',
        'views/privacy.html',
        'views/faq.html'
    ];

    expectedComponents.forEach(comp => {
        const fullPath = path.join(componentsDir, comp);
        assert.ok(fs.existsSync(fullPath), `Componente modular requerido no existe: "${comp}"`);
    });
});

test('contract/architecture - #view-container debe ser hijo directo de <main> y no estar anidado en secciones ocultas', () => {
    const rootDir = process.cwd();
    const indexPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Verificar que result.html no tenga etiquetas sin cerrar que traguen a view-container
    const resultHtml = fs.readFileSync(path.join(rootDir, 'src', 'components', 'result.html'), 'utf8');
    assert.ok(resultHtml.trim().endsWith('</section>'), 'result.html debe cerrarse correctamente con </section>');

    // Comprobar orden y jerarquía en index.html
    const viewResultIdx = indexHtml.indexOf('id="view-result"');
    const viewContainerIdx = indexHtml.indexOf('id="view-container"');
    assert.ok(viewResultIdx !== -1 && viewContainerIdx !== -1, 'Tanto view-result como view-container deben existir');
    assert.ok(viewContainerIdx > viewResultIdx, 'view-container debe estar después de view-result');
});
test('contract/architecture - Todos los archivos HTML y plantillas modulares tienen balance de etiquetas perfecto', () => {
    const rootDir = process.cwd();
    function findHtmlFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                findHtmlFiles(fullPath, fileList);
            } else if (file.endsWith('.html')) {
                fileList.push(fullPath);
            }
        });
        return fileList;
    }

    const htmlFiles = findHtmlFiles(path.join(rootDir, 'src', 'components'))
        .concat([path.join(rootDir, 'index.html'), path.join(rootDir, '404.html'), path.join(rootDir, 'src', 'templates', 'index.template.html')]);

    const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

    htmlFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*)?\/?>/g;
        let match;
        const stack = [];
        const errors = [];
        let line = 1;
        let lastIdx = 0;

        while ((match = tagRegex.exec(content)) !== null) {
            const tagText = match[0];
            const tagName = match[1].toLowerCase();

            const textBefore = content.substring(lastIdx, match.index);
            line += (textBefore.match(/\n/g) || []).length;
            lastIdx = match.index;

            const isClosing = tagText.startsWith('</');
            const isSelfClosing = tagText.endsWith('/>') || voidElements.has(tagName) || tagText.startsWith('<!--');

            if (tagText.startsWith('<!--') || tagText.startsWith('<!doctype')) continue;

            if (isClosing) {
                if (stack.length === 0) {
                    errors.push(`Línea ${line}: Cierre inesperado </${tagName}>`);
                } else {
                    const last = stack.pop();
                    if (last.tagName !== tagName) {
                        errors.push(`Línea ${line}: Mismatch </${tagName}> vs <${last.tagName}> (abierta en línea ${last.line})`);
                    }
                }
            } else if (!isSelfClosing) {
                stack.push({ tagName, line });
            }
        }

        if (stack.length > 0) {
            stack.forEach(s => {
                errors.push(`Etiqueta <${s.tagName}> abierta en línea ${s.line} sin cerrar`);
            });
        }

        assert.equal(errors.length, 0, `Errores de sintaxis HTML en ${path.relative(rootDir, file)}:\n` + errors.join('\n'));
    });
});

test('contract/architecture - Cero dependencias circulares en los módulos de src/', () => {
    const rootDir = process.cwd();
    function findJsFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                findJsFiles(fullPath, fileList);
            } else if (file.endsWith('.js')) {
                fileList.push(fullPath);
            }
        });
        return fileList;
    }

    const jsFiles = findJsFiles(path.join(rootDir, 'src'));
    const graph = new Map();

    jsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const importRegex = /(?:import|export)\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['\"]([^'\"]+)['\"]/g;
        const imports = [];
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath.startsWith('.')) {
                const resolved = path.normalize(path.join(path.dirname(filePath), importPath));
                imports.push(resolved);
            }
        }
        graph.set(filePath, imports);
    });

    const cycles = [];
    function checkCycle(node, visited = new Set(), pathStack = []) {
        visited.add(node);
        pathStack.push(node);

        const neighbors = graph.get(node) || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                checkCycle(neighbor, new Set(visited), [...pathStack]);
            } else if (pathStack.includes(neighbor)) {
                const cyclePath = [...pathStack.slice(pathStack.indexOf(neighbor)), neighbor];
                cycles.push(cyclePath);
            }
        }
    }

    for (const file of jsFiles) {
        checkCycle(file);
    }

    assert.equal(cycles.length, 0, `Se detectaron ciclos de importación:\n` + cycles.map(c => c.map(f => path.relative(rootDir, f)).join(' -> ')).join('\n'));
});
