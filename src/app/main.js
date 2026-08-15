import { APP_VERSION, state } from '../config/config.js';
import { ItemsRepository } from '../infrastructure/repositories/ItemsRepository.js';
import { HistoryRepository } from '../infrastructure/repositories/HistoryRepository.js';
import { IOSDeviceDetector } from '../ui/ios/IOSDeviceDetector.js';
import { setupModals } from '../ui/components/ModalManager.js';
import { renderItems } from '../ui/components/ItemCardRenderer.js';

import { ThemeController } from '../ui/controllers/ThemeController.js';
import { I18nController } from '../ui/controllers/I18nController.js';
import { CurrencyController } from '../ui/controllers/CurrencyController.js';
import { CalculatorController } from '../ui/controllers/CalculatorController.js';
import { ServiceWorkerController } from '../ui/controllers/ServiceWorkerController.js';
import { RouterController } from '../ui/controllers/RouterController.js';
import { t } from '../i18n/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Detección automática de iOS (Aplica clase .is-ios si es iPhone, iPad o iPod)
    const isIOSDevice = IOSDeviceDetector.applyIOSClassIfNeeded();
    const iosBadge = document.getElementById('ios-badge');
    if (iosBadge && isIOSDevice) {
        iosBadge.classList.remove('hidden');
    }

    // 2. Versión de la App en Footer
    const verEl = document.getElementById('app-version');
    if (verEl) verEl.innerText = `v${APP_VERSION}`;

    // 3. Inicializar Controladores de UI Independientes
    ThemeController.init();
    I18nController.init();
    RouterController.init();
    CurrencyController.init();
    CalculatorController.init();
    ServiceWorkerController.init();
    setupModals();

    // 4. Mostrar sección de historial si hay elementos
    if (HistoryRepository.getHistory().length > 0) {
        const historySection = document.getElementById('history-section');
        if (historySection) historySection.classList.remove('hidden');
    }

    // 5. Cargar datos con Repositorio (Red -> Cache -> Fallback)
    const searchInput = document.getElementById('search-input');
    
    try {
        const repo = new ItemsRepository();
        const { items, lastUpdated } = await repo.getItems();

        if (items && items.length > 0) {
            state.storeData = items;

            const lastUpdatedEl = document.getElementById('last-updated');
            if (lastUpdatedEl) {
                lastUpdatedEl.innerHTML = `<span data-i18n="lastUpdated">${t('lastUpdated')}</span>: ${lastUpdated || '--/--/----'}`;
            }

            // Configurar buscador
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    I18nController.reRenderItems();
                });
            }

            I18nController.reRenderItems();
        } else {
            throw new Error("No items returned from repository.");
        }
    } catch (error) {
        console.error("Error al cargar los objetos:", error);
        const container = document.getElementById('items-container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm text-center border border-rose-200 dark:border-rose-800">
                    <p data-i18n="errorLoadingItems">${t('errorLoadingItems') || 'Error al cargar los objetos de la tienda.'}</p>
                    <button onclick="window.location.reload()" class="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Reintentar</button>
                </div>
            `;
        }
    }

    // 6. Configurar vista de resultados y botón "Volver"
    const viewForm = document.getElementById('view-form');
    const viewResult = document.getElementById('view-result');
    const btnBack = document.getElementById('btn-reset') || document.getElementById('btn-back');
    const resultTitle = document.getElementById('result-title');

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            if (viewResult) viewResult.classList.add('hidden');
            if (viewForm) viewForm.classList.remove('hidden');
            
            // Mover el foco accesible de vuelta al contenedor de objetos o botón calcular
            const btnCalculate = document.getElementById('btn-calculate');
            if (btnCalculate) btnCalculate.focus();
        });
    }

    // Soporte accesible: tecla Escape vuelve al formulario
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && viewResult && !viewResult.classList.contains('hidden')) {
            if (btnBack) btnBack.click();
        }
    });

    // Mantener foco atrapado dentro de la vista de resultados por accesibilidad
    if (viewResult) {
        viewResult.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                const focusable = viewResult.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        });
    }
});
