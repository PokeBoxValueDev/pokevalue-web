const CACHE_NAME = 'pokeboxvalue-v1.31.5';
const STATIC_ASSETS = [
    './',
    './index.html',
    './404.html',
    './ads.txt',
    './robots.txt',
    './sitemap.xml',
    './favicon.svg',
    './favicon-light.svg',
    './favicon.png',
    './logo.png',
    './og-image.svg',
    './manifest.json',
    './src/assets/items-fallback.json'
];

// Instalación: Cachear App Shell de forma resiliente
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await Promise.allSettled(
                STATIC_ASSETS.map(url => cache.add(url).catch(err => {
                    console.warn(`[ServiceWorker] Fallo al precachear ${url}:`, err);
                }))
            );
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

    // 1. Ignorar esquemas no soportados por Cache API (chrome-extension://, moz-extension://, etc.)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    const isNavigation = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');
    const isItemsJson = url.href.includes('items.json');

    // 2. Ignorar peticiones externas de analítica, anuncios o widgets de terceros (GA4, GTM, AdSense, Ko-fi)
    // El navegador las gestiona de forma nativa sin interceptarlas ni fallar si hay bloqueadores
    if (url.origin !== self.location.origin && !isItemsJson) {
        return;
    }

    // 3. Navegación (HTML): Network-First con fallback a caché (resiliente para todas las rutas y vistas)
    if (isNavigation) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    return (await caches.match(event.request)) || (await caches.match('./index.html')) || (await caches.match('./404.html'));
                })
        );
        return;
    }

    // 4. Datos de items.json: Stale-While-Revalidate con fallback local inmediato
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

    // 5. Cache-First para assets estáticos propios (CSS, JS, imágenes, SVG):
    // Si está en la caché del Service Worker, responder de inmediato en 0ms sin saturar la red.
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
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
