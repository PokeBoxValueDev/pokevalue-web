const CACHE_NAME = 'pokeboxvalue-v1.23.0';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './ads.txt',
    './robots.txt',
    './sitemap.xml',
    './favicon.svg',
    './og-image.svg',
    './manifest.json',
    './src/app/main.js',
    './src/assets/items-fallback.json',
    './src/config/config.js',
    './src/domain/models/CalculationResult.js',
    './src/domain/models/Item.js',
    './src/domain/services/ValuationService.js',
    './src/domain/valueObjects/Category.js',
    './src/i18n/i18n.js',
    './src/i18n/locales/en.js',
    './src/i18n/locales/es.js',
    './src/infrastructure/mappers/ItemMapper.js',
    './src/infrastructure/repositories/HistoryRepository.js',
    './src/infrastructure/repositories/ItemsRepository.js',
    './src/ui/components/BreakdownRenderer.js',
    './src/ui/components/HistoryRenderer.js',
    './src/ui/components/ItemCardRenderer.js',
    './src/ui/components/ModalManager.js',
    './src/ui/components/ViewManager.js',
    './src/ui/components/SocialCardGenerator.js',
    './src/ui/components/ValuationBadgesRenderer.js',
    './src/ui/controllers/CalculatorController.js',
    './src/ui/controllers/CurrencyController.js',
    './src/ui/controllers/I18nController.js',
    './src/ui/controllers/RouterController.js',
    './src/ui/controllers/ServiceWorkerController.js',
    './src/ui/controllers/ThemeController.js',
    './src/ui/ios/IOSDeviceDetector.js',
    './src/ui/utils/AnimationUtils.js'
];

// Instalación: Cachear App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activación: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Estrategia de Peticiones Fetch ultrarrápida y resiliente
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorar esquemas no soportados por Cache API (chrome-extension://, moz-extension://, file://, etc.)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    const isNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');
    const isItemsJson = url.href.includes('items.json');

    // 1. Navegación (HTML): Cache-First con actualización en segundo plano para carga en 0ms
    if (isNavigation) {
        event.respondWith(
            caches.match('./index.html').then((cachedHtml) => {
                const networkFetch = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedHtml);

                return cachedHtml || networkFetch;
            })
        );
        return;
    }

    // 2. Datos de items.json: Stale-While-Revalidate con fallback local inmediato
    if (isItemsJson) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                        }
                        return networkResponse;
                    })
                    .catch(() => caches.match('./src/assets/items-fallback.json'));

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 3. Stale-While-Revalidate para todos los assets estáticos (CSS, JS, imágenes, iconos)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => { });

            return cachedResponse || fetchPromise;
        })
    );
});
