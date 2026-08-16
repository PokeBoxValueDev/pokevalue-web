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

            const registerWorker = async () => {
                try {
                    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                    if (reg && typeof reg.update === 'function') {
                        reg.update();
                    }
                } catch (err) {
                    console.error('Error al registrar Service Worker:', err);
                }
            };

            if (document.readyState === 'complete') {
                registerWorker();
            } else {
                window.addEventListener('load', registerWorker);
            }
        }
    }
}
