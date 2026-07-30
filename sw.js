const CACHE_NAME = 'pokeboxvalue-v1.14.10';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './ads.txt',
    './favicon.svg',
    './manifest.json',
    './js/config.js',
    './js/app.js',
    './js/calculator.js',
    './js/storage.js',
    './js/ui.js',
    './js/i18n.js',
    './src/i18n/i18n.js',
    './src/i18n/locales/es.js',
    './src/i18n/locales/en.js',
    './js/items-fallback.json',
    './src/config/config.js',
    './src/domain/models/Item.js',
    './src/domain/models/CalculationResult.js',
    './src/domain/valueObjects/Category.js',
    './src/domain/services/ValuationService.js',
    './src/infrastructure/mappers/ItemMapper.js',
    './src/infrastructure/repositories/ItemsRepository.js',
    './src/infrastructure/repositories/HistoryRepository.js',
    './src/ui/components/ItemCardRenderer.js',
    './src/ui/components/BreakdownRenderer.js',
    './src/ui/components/HistoryRenderer.js',
    './src/ui/components/ValuationBadgesRenderer.js',
    './src/ui/components/SocialCardGenerator.js',
    './src/ui/components/ModalManager.js',
    './src/ui/ios/IOSDeviceDetector.js'
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

// Estrategia de Peticiones Fetch
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignorar esquemas no soportados por Cache API (chrome-extension://, moz-extension://, file://, etc.)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    // 1. Network-First para navegación (HTML index) y datos dinámicos (items.json)
    // Garantiza que en iPhone/Móvil se cargue siempre la última versión desplegada si hay red
    const isNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');
    const isItemsJson = url.href.includes('items.json');

    if (isNavigation || isItemsJson) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        if (isItemsJson) return caches.match('./js/items-fallback.json');
                        return caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // 2. Stale-While-Revalidate para assets estáticos (CSS, JS, imágenes)
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
