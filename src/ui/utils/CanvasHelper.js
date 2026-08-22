/**
 * Utilidades compartidas para la generación de imágenes y tarjetas en HTML5 Canvas.
 */

/**
 * Carga una imagen para Canvas con control de tiempo de espera y crossOrigin.
 * @param {string} src
 * @param {number} [timeoutMs=300]
 * @returns {Promise<HTMLImageElement>}
 */
export async function loadCanvasImage(src, timeoutMs = 300) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, timeoutMs);
    });

    return img;
}

/**
 * Trunca un texto en canvas añadiendo puntos suspensivos si excede maxWidth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} maxWidth
 * @returns {string}
 */
export function truncateText(ctx, text, maxWidth) {
    if (!text || !ctx || typeof ctx.measureText !== 'function') return text || '';
    if (ctx.measureText(text).width <= maxWidth) return text;

    let displayStr = text;
    while (displayStr.length > 3 && ctx.measureText(displayStr + '...').width > maxWidth) {
        displayStr = displayStr.slice(0, -1);
    }
    return displayStr + '...';
}

/**
 * Convierte un elemento Canvas a un Blob PNG mediante Promise.
 * @param {HTMLCanvasElement} canvas
 * @param {string} [mimeType='image/png']
 * @returns {Promise<Blob|null>}
 */
export function canvasToBlob(canvas, mimeType = 'image/png') {
    if (!canvas || typeof canvas.toBlob !== 'function') return Promise.resolve(null);
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), mimeType);
    });
}

/**
 * Dibuja un rectángulo redondeado con fallback para navegadores antiguos.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} radius
 */
export function drawRoundedRect(ctx, x, y, w, h, radius) {
    if (!ctx) return;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, radius);
    } else {
        ctx.rect(x, y, w, h);
    }
}

/**
 * Formatea un importe numérico para su representación en canvas según la divisa.
 * @param {number} value
 * @param {string} currencySymbol
 * @returns {string}
 */
export function formatCanvasCurrency(value, currencySymbol) {
    const isCoins = currencySymbol === '🟡' || currencySymbol === 'coins';
    return isCoins ? String(Math.round(value)) : Number(value).toFixed(2);
}
