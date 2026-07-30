const CACHE_NAME = 'pokeboxvalue-v1.10.2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './favicon.svg',
    './manifest.json',
    './js/config.js',
    './js/app.js',
    './js/calculator.js',
    './js/storage.js',
    './js/ui.js',
    './js/i18n.js',
    './js/locales/es.js',
    './js/locales/en.js',
    './js/items-fallback.json',
    './src/config/config.js',
    './src/domain/models/Item.js',
    './src/domain/models/CalculationResult.js',
    './src/domain/valueObjects/Category.js',
    './src/domain/services/ValuationService.js',
    './src/infrastructure/mappers/ItemMapper.js',
    './src/infrastructure/repositories/ItemsRepository.js',
    './src/infrastructure/repositories/HistoryRepository.js'
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

    // 1. Network-First para datos dinámicos (items.json)
    // Garantiza que el usuario reciba siempre los datos nuevos de GitHub si está online
    if (url.href.includes('items.json')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Si falla la red, intentar devolver items.json de la caché
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        // Si tampoco hay en caché, devolver el fallback local
                        return caches.match('./js/items-fallback.json');
                    });
                })
        );
        return;
    }

    // 2. Cache-First con Stale-While-Revalidate para App Shell y recursos estáticos
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Actualizar caché en segundo plano si hay red
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                    }
                }).catch(() => { });
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            });
        })
    );
});
