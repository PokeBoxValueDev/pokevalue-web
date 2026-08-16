import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
function runEsbuild(args) {
    const siblingEsbuild = path.join(path.dirname(process.execPath), 'esbuild');
    const candidates = [
        process.env.ESBUILD_BINARY_PATH,
        siblingEsbuild,
        'esbuild'
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            try {
                return execFileSync(candidate, args, { stdio: 'inherit' });
            } catch (e) {
                // Try next candidate
            }
        }
    }

    // En entornos de CI (GitHub Actions en Ubuntu) o sistemas estándar, usar npx --yes esbuild
    try {
        return execFileSync('npx', ['--yes', 'esbuild', ...args], { stdio: 'inherit' });
    } catch (npxErr) {
        // Fallback directo a comando esbuild en PATH
        return execFileSync('esbuild', args, { stdio: 'inherit' });
    }
}

export function runProductionBuild() {
    console.log('🚀 Iniciando compilación de producción optimizada...');

    // 1. Compilar componentes HTML
    execFileSync(process.execPath, [path.join(ROOT_DIR, 'scripts', 'build-components.js')], { stdio: 'inherit' });

    // 2. Limpiar y recrear dist/
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(path.join(DIST_DIR, 'assets'), { recursive: true });

    // 3. Empaquetar y Minificar JS con Esbuild
    const tempJsOut = path.join(DIST_DIR, 'assets', 'app.bundle.js');
    runEsbuild([
        path.join(ROOT_DIR, 'src', 'app', 'main.js'),
        '--bundle',
        '--minify',
        '--format=esm',
        '--target=es2020',
        '--sourcemap',
        `--outfile=${tempJsOut}`
    ]);

    const jsContent = fs.readFileSync(tempJsOut);
    const jsHash = crypto.createHash('md5').update(jsContent).digest('hex').slice(0, 8);
    const finalJsName = `app.${jsHash}.js`;
    const finalJsPath = path.join(DIST_DIR, 'assets', finalJsName);
    fs.renameSync(tempJsOut, finalJsPath);
    if (fs.existsSync(`${tempJsOut}.map`)) {
        fs.renameSync(`${tempJsOut}.map`, `${finalJsPath}.map`);
    }

    // 4. Minificar CSS
    const tempCssOut = path.join(DIST_DIR, 'assets', 'styles.bundle.css');
    runEsbuild([
        path.join(ROOT_DIR, 'css', 'styles.css'),
        '--minify',
        `--outfile=${tempCssOut}`
    ]);

    const cssContent = fs.readFileSync(tempCssOut);
    const cssHash = crypto.createHash('md5').update(cssContent).digest('hex').slice(0, 8);
    const finalCssName = `styles.${cssHash}.css`;
    const finalCssPath = path.join(DIST_DIR, 'assets', finalCssName);
    fs.renameSync(tempCssOut, finalCssPath);

    // 5. Copiar Assets Estáticos Críticos
    const staticFiles = [
        'ads.txt',
        'CNAME',
        'favicon.svg',
        'favicon-light.svg',
        'og-image.svg',
        'manifest.json',
        'robots.txt',
        'sitemap.xml',
        'sw.js'
    ];

    staticFiles.forEach(file => {
        const src = path.join(ROOT_DIR, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.join(DIST_DIR, file));
        }
    });

    // Copiar carpeta src/assets/ si existe
    const srcAssetsDir = path.join(ROOT_DIR, 'src', 'assets');
    if (fs.existsSync(srcAssetsDir)) {
        fs.cpSync(srcAssetsDir, path.join(DIST_DIR, 'src', 'assets'), { recursive: true });
    }

    // 6. Generar dist/index.html y dist/404.html con referencias a assets minificados
    ['index.html', '404.html'].forEach(htmlFile => {
        const srcHtmlPath = path.join(ROOT_DIR, htmlFile);
        if (fs.existsSync(srcHtmlPath)) {
            let html = fs.readFileSync(srcHtmlPath, 'utf8');

            // Reemplazar CSS por el bundle minificado con hash
            html = html.replace(/href="css\/styles\.css[^"]*"/g, `href="/assets/${finalCssName}"`);
            html = html.replace(/href="\/css\/styles\.css[^"]*"/g, `href="/assets/${finalCssName}"`);

            // Reemplazar JS de entrada por el bundle minificado con hash
            html = html.replace(/src="\/src\/app\/main\.js"/g, `src="/assets/${finalJsName}"`);
            html = html.replace(/src="src\/app\/main\.js"/g, `src="/assets/${finalJsName}"`);

            fs.writeFileSync(path.join(DIST_DIR, htmlFile), html, 'utf8');
        }
    });

    // 7. Generar páginas estáticas dedicadas en dist/ para todas las rutas y vistas (GitHub Pages / SEO)
    const viewTemplates = {
        faq: fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'views', 'faq.html'), 'utf8'),
        legal: fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'views', 'legal.html'), 'utf8'),
        terms: fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'views', 'legal.html'), 'utf8'),
        privacy: fs.readFileSync(path.join(ROOT_DIR, 'src', 'components', 'views', 'privacy.html'), 'utf8')
    };

    const routes = [
        { path: 'es', lang: 'es', view: null },
        { path: 'en', lang: 'en', view: null },
        { path: 'faq', lang: 'es', view: 'faq' },
        { path: 'es/faq', lang: 'es', view: 'faq' },
        { path: 'en/faq', lang: 'en', view: 'faq' },
        { path: 'faqs', lang: 'es', view: 'faq' },
        { path: 'es/faqs', lang: 'es', view: 'faq' },
        { path: 'en/faqs', lang: 'en', view: 'faq' },
        { path: 'legal', lang: 'es', view: 'legal' },
        { path: 'es/legal', lang: 'es', view: 'legal' },
        { path: 'en/legal', lang: 'en', view: 'legal' },
        { path: 'terms', lang: 'es', view: 'terms' },
        { path: 'es/terms', lang: 'es', view: 'terms' },
        { path: 'en/terms', lang: 'en', view: 'terms' },
        { path: 'privacy', lang: 'es', view: 'privacy' },
        { path: 'es/privacy', lang: 'es', view: 'privacy' },
        { path: 'en/privacy', lang: 'en', view: 'privacy' }
    ];

    const baseDistHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');

    routes.forEach(route => {
        const routeDir = path.join(DIST_DIR, ...route.path.split('/'));
        fs.mkdirSync(routeDir, { recursive: true });

        let routeHtml = baseDistHtml;
        if (route.view && viewTemplates[route.view]) {
            // Ocultar formulario de calculadora y renderizar la vista secundaria directamente en el HTML
            routeHtml = routeHtml
                .replace(/id="view-form"\s+class="/, 'id="view-form" class="hidden ')
                .replace('<div id="view-container"></div>', `<div id="view-container">${viewTemplates[route.view]}</div>`);
        }
        if (route.lang) {
            routeHtml = routeHtml.replace(/<html lang="[^"]*"/, `<html lang="${route.lang}"`);
        }

        fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf8');
    });

    console.log(`✅ [Production Build] Dist generado con éxito en dist/ con soporte estático para ${routes.length} rutas.`);
    console.log(`📦 JS Bundle: /assets/${finalJsName} (${(jsContent.length / 1024).toFixed(1)} KB)`);
    console.log(`🎨 CSS Bundle: /assets/${finalCssName} (${(cssContent.length / 1024).toFixed(1)} KB)`);
}

if (process.argv[1] && process.argv[1].endsWith('bundle.js')) {
    runProductionBuild();
}
