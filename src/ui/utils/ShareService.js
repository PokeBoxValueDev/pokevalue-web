import { t } from '../../i18n/i18n.js';
import { state, CURRENCY_CONFIG } from '../../config/config.js';

/**
 * Servicio encargado de la composición y envío de contenido para compartir (Texto e Imágenes).
 */
export class ShareService {
    /**
     * Construye el texto formateado de resumen del cálculo.
     * @param {Object} lastResult
     * @param {number} lastBoxPrice
     * @param {string} currentCurrency
     * @returns {string}
     */
    static buildShareSummaryText(lastResult, lastBoxPrice, currentCurrency) {
        if (!lastResult || !lastBoxPrice) return '';

        const curr = CURRENCY_CONFIG[currentCurrency] || { symbol: '€' };
        const isProfitable = lastResult.isProfitable;
        const statusTitle = isProfitable
            ? (t('titleProfitable') || '¡Renta comprarla!')
            : (t('titleNotProfitable') || 'No renta comprarla');

        const isCoins = currentCurrency === 'POKECOINS';
        const formattedPrice = isCoins ? `${Math.round(lastBoxPrice)} ${curr.symbol}` : `${lastBoxPrice.toFixed(2)} ${curr.symbol}`;
        const formattedValue = isCoins ? `${Math.round(lastResult.totalValue)} ${curr.symbol}` : `${lastResult.totalValue.toFixed(2)} ${curr.symbol}`;
        const diffSign = lastResult.diff >= 0 ? '+' : '-';
        const formattedDiff = isCoins ? `${diffSign}${Math.round(Math.abs(lastResult.diff))} ${curr.symbol}` : `${diffSign}${Math.abs(lastResult.diff).toFixed(2)} ${curr.symbol}`;

        let itemsSummaryText = '';
        if (lastResult.itemSummary && lastResult.itemSummary.length > 0) {
            itemsSummaryText = '\n' + lastResult.itemSummary.map(item => `  • ${item}`).join('\n');
        }

        const shareHeader = t('shareBoxSummaryTitle') || 'PokeBoxValue - Resultado de la Caja:';
        const statusLabel = t('shareStatusLabel') || 'Status:';
        const priceLabel = t('resBoxPrice') || 'Precio Caja:';
        const valLabel = t('resRealValue') || 'Valor Real:';
        const itemsLabel = t('itemsIncluded') || 'Objetos incluidos:';
        const notSpecified = t('shareNotSpecified') || 'No especificados';

        return `${shareHeader}
━━━━━━━━━━━━━━━━━━━━
${statusLabel} ${statusTitle} (${lastResult.grade})
• ${priceLabel} ${formattedPrice}
• ${valLabel}  ${formattedValue} (${formattedDiff})
━━━━━━━━━━━━━━━━━━━━
${itemsLabel}${itemsSummaryText || ` ${notSpecified}`}`;
    }

    /**
     * Comparte el resumen textual o lo copia al portapapeles.
     */
    static async shareTextSummary() {
        if (!state.lastResult || !state.lastBoxPrice) return;

        const shareText = ShareService.buildShareSummaryText(state.lastResult, state.lastBoxPrice, state.currentCurrency);
        const pageUrl = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : 'https://pokeboxvalue.com';

        try {
            if (navigator.share) {
                await navigator.share({
                    title: t('shareTitlePost') || 'PokeBoxValue - Calculadora de Cajas',
                    text: shareText,
                    url: pageUrl
                });
            } else if (navigator.clipboard) {
                const copyContent = pageUrl ? `${shareText}\n${pageUrl}` : shareText;
                await navigator.clipboard.writeText(copyContent);
                alert(t('copiedToClipboard') || '¡Resultado copiado al portapapeles!');
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'InvalidStateError') {
                console.error("Error compartiendo resultado:", err);
            }
        }
    }

    /**
     * Descarga un blob de imagen generado localmente en el navegador.
     * @param {Blob} blob
     * @param {string} filename
     */
    static downloadBlob(blob, filename) {
        if (typeof document === 'undefined') return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    }

    /**
     * Comparte un archivo blob de imagen mediante Web Share API o descarga como fallback.
     * @param {Blob} blob
     * @param {string} filename
     */
    static async shareImageBlob(blob, filename) {
        if (!blob) return;

        try {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `${t('appName') || 'PokeBoxValue'} - ${t('resultVerdictTitle') || 'Resultado'}`,
                    text: t('shareNativeCardText') || 'He calculado la rentabilidad de esta caja en PokeBoxValue!',
                    files: [file]
                });
            } else {
                ShareService.downloadBlob(blob, filename);
            }
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'InvalidStateError') {
                console.error("Error compartiendo tarjeta:", err);
                ShareService.downloadBlob(blob, filename);
            }
        }
    }
}
