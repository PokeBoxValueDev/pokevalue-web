import { t } from '../../../js/i18n.js';
import { state, CURRENCY_CONFIG } from '../../../js/config.js';

/**
 * Muestra la insignia del Rango de Oferta (Grade Badge S/A/B/F).
 */
export function renderGradeBadge(grade) {
    const badgeEl = document.getElementById('res-grade-badge');
    if (!badgeEl) return;

    let key = 'gradeF';
    if (grade === 'S') key = 'gradeS';
    else if (grade === 'A') key = 'gradeA';
    else if (grade === 'B') key = 'gradeB';

    badgeEl.setAttribute('data-i18n', key);
    badgeEl.innerText = t(key);
}

/**
 * Renderiza la sección de Métricas Clave (KVI) de coste efectivo.
 */
export function renderKeyMetrics(keyMetrics) {
    const sectionEl = document.getElementById('key-metrics-section');
    const containerEl = document.getElementById('key-metrics-container');
    if (!sectionEl || !containerEl) return;

    if (!keyMetrics || keyMetrics.length === 0) {
        sectionEl.classList.add('hidden');
        containerEl.innerHTML = '';
        return;
    }

    const curr = CURRENCY_CONFIG[state.currentCurrency] || CURRENCY_CONFIG.EUR;

    sectionEl.classList.remove('hidden');
    containerEl.innerHTML = keyMetrics.map(metric => `
        <div class="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0 text-xs">
            <span class="font-medium text-gray-800 dark:text-gray-200">
                ${metric.count}x ${metric.name}
            </span>
            <span class="font-bold text-indigo-600 dark:text-indigo-400 text-right">
                ${metric.fmtEffective} ${curr.symbol}
                <span class="font-normal text-[10px] text-gray-500 block">
                    (${t('habitualLabel')}: ${metric.fmtStandard} ${curr.symbol})
                </span>
            </span>
        </div>
    `).join('');
}
