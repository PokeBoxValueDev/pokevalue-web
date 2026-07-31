export class ServiceWorkerController {
    static init() {
        if ('serviceWorker' in navigator) {
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            window.addEventListener('load', () => {
                // Relativo al index.html
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => reg.update())
                    .catch(err => console.error('Error al registrar Service Worker:', err));
            });
        }
    }
}
