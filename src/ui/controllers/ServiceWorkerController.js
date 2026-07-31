export class ServiceWorkerController {
    static init() {
        if ('serviceWorker' in navigator) {
            const hasExistingController = Boolean(navigator.serviceWorker.controller);
            let refreshing = false;

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (hasExistingController && !refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });

            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .catch(err => console.error('Error al registrar Service Worker:', err));
            });
        }
    }
}
