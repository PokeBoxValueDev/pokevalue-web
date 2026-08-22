/**
 * Genera una tarjeta visual PNG mediante HTML5 Canvas para compartir en redes sociales.
 * Soporta formato 'post' (horizontal 16:9), 'story' (vertical 9:16) y 'sticker' (cuadrado 1:1).
 */
import { t } from '../../i18n/i18n.js';
import { loadCanvasImage, truncateText, canvasToBlob, drawRoundedRect, formatCanvasCurrency } from '../utils/CanvasHelper.js';

export async function generateSocialCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [], format = 'post' }) {
    if (typeof document === 'undefined') return null;

    if (format === 'story') {
        return generateStoryCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items });
    }
    if (format === 'sticker') {
        return generateStickerCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items });
    }
    return generatePostCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items });
}

/**
 * Tarjeta Horizontal 16:9 (600x440) para Post / Twitter / Telegram
 */
async function generatePostCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [] }) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, 600, 440);
    grad.addColorStop(0, isProfitable ? '#059669' : '#e11d48');
    grad.addColorStop(1, isProfitable ? '#064e3b' : '#881337');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 440);

    // 2. Borde decorativo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 20, 20, 560, 400, 24);
    ctx.stroke();

    // 3. Logo y Título
    const logoImg = await loadCanvasImage('/favicon.svg', 250);
    const hasLogo = logoImg.complete && logoImg.naturalHeight !== 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px sans-serif';
    const titleText = 'PokeBoxValue';
    const textWidth = ctx.measureText(titleText).width;
    const logoWidth = hasLogo ? 36 : 0;
    const gap = hasLogo ? 10 : 0;
    const startX = (600 - (logoWidth + gap + textWidth)) / 2;

    if (hasLogo) {
        ctx.drawImage(logoImg, startX, 36, 36, 36);
    }
    ctx.textAlign = 'left';
    ctx.fillText(titleText, startX + logoWidth + gap, 64);

    // 4. Insignia Rango
    const gradeLabel = t('grade' + grade) || (isProfitable ? t('titleProfitable') : t('titleNotProfitable'));
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 300, 96);

    // 5. Lista de Objetos
    const itemsListStr = Array.isArray(items) && items.length > 0 ? items.join(', ') : '';
    if (itemsListStr) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        drawRoundedRect(ctx, 50, 110, 500, 40, 12);
        ctx.fill();

        ctx.font = '500 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(truncateText(ctx, itemsListStr, 470), 300, 135);
    }

    // 6. Panel de Valores
    const panelY = itemsListStr ? 162 : 120;
    const panelHeight = 165;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    drawRoundedRect(ctx, 50, panelY, 500, panelHeight, 20);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('resBoxPrice') || 'Precio Caja:', 80, panelY + 44);
    ctx.fillText(t('resRealValue') || 'Valor Real:', 80, panelY + 92);
    ctx.fillText(t(isProfitable ? 'resDiffSave' : 'resDiffLose') || (isProfitable ? 'Ahorras:' : 'Pierdes:'), 80, panelY + 140);

    const fmtBox = formatCanvasCurrency(boxPrice, currencySymbol);
    const fmtTot = formatCanvasCurrency(totalValue, currencySymbol);
    const fmtDif = formatCanvasCurrency(diff, currencySymbol);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${fmtBox} ${currencySymbol}`, 520, panelY + 44);
    ctx.fillText(`${fmtTot} ${currencySymbol}`, 520, panelY + 92);

    ctx.font = '900 26px sans-serif';
    ctx.fillStyle = isProfitable ? '#10b981' : '#f43f5e';
    const diffSign = isProfitable ? '+' : '-';
    ctx.fillText(`${diffSign}${Math.abs(fmtDif)} ${currencySymbol}`, 520, panelY + 140);

    // Separadores
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, panelY + 60);
    ctx.lineTo(520, panelY + 60);
    ctx.moveTo(80, panelY + 108);
    ctx.lineTo(520, panelY + 108);
    ctx.stroke();

    // 7. Marca de agua
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(t('shareCanvasWatermark') || 'pokeboxvalue.com | Calculadora de Cajas de Pokémon GO', 300, 395);

    return canvasToBlob(canvas);
}

/**
 * Tarjeta Vertical 9:16 (720x1280) para Instagram Stories, TikTok y Estados
 */
async function generateStoryCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [] }) {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fondo Vertical
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    if (isProfitable) {
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.35, '#047857');
        grad.addColorStop(1, '#022c22');
    } else {
        grad.addColorStop(0, '#881337');
        grad.addColorStop(0.35, '#be123c');
        grad.addColorStop(1, '#4c0519');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);

    // 2. Borde exterior
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 32, 32, 656, 1216, 36);
    ctx.stroke();

    // 3. Logo y Cabecera
    const logoImg = await loadCanvasImage('/favicon.svg', 250);
    const hasLogo = logoImg.complete && logoImg.naturalHeight !== 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px sans-serif';
    if (hasLogo) {
        ctx.drawImage(logoImg, 180, 80, 52, 52);
        ctx.textAlign = 'left';
        ctx.fillText('PokeBoxValue', 245, 120);
    } else {
        ctx.textAlign = 'center';
        ctx.fillText('PokeBoxValue', 360, 120);
    }

    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(t('storySubtitle') || 'CALCULADORA DE CAJAS POKÉMON GO', 360, 155);

    // 4. Hero Card
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    drawRoundedRect(ctx, 64, 200, 592, 280, 28);
    ctx.fill();

    const gradeLabel = t('grade' + grade) || (isProfitable ? t('titleProfitable') : t('titleNotProfitable'));
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 360, 250);

    ctx.font = '900 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    const mainTitle = isProfitable ? (t('titleProfitable') || '¡OFERTA RENTABLE!') : (t('titleNotProfitable') || 'NO VALE LA PENA');
    ctx.fillText(mainTitle, 360, 310);

    const fmtBox = formatCanvasCurrency(boxPrice, currencySymbol);
    const fmtTot = formatCanvasCurrency(totalValue, currencySymbol);
    const fmtDif = formatCanvasCurrency(diff, currencySymbol);
    const diffSign = isProfitable ? '+' : '-';

    ctx.font = '900 56px sans-serif';
    ctx.fillStyle = isProfitable ? '#34d399' : '#fb7185';
    ctx.fillText(`${diffSign}${Math.abs(fmtDif)} ${currencySymbol}`, 360, 395);

    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(isProfitable ? (t('resDiffSave') || 'Ahorras:') : (t('resDiffLose') || 'Pierdes:'), 360, 435);

    // 5. Comparativa Panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    drawRoundedRect(ctx, 64, 510, 592, 170, 24);
    ctx.fill();

    ctx.font = '600 20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(t('resBoxPrice') || 'Precio en Tienda:', 100, 570);
    ctx.fillText(t('resRealValue') || 'Valor por Separado:', 100, 640);

    ctx.font = '900 26px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${fmtBox} ${currencySymbol}`, 620, 570);
    ctx.fillText(`${fmtTot} ${currencySymbol}`, 620, 640);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 595);
    ctx.lineTo(620, 595);
    ctx.stroke();

    // 6. Lista de Objetos
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(t('storyItemsTitle') || 'OBJETOS DE LA CAJA', 360, 725);

    const validItems = Array.isArray(items) ? items : [];
    const maxItemsToShow = 6;
    let itemY = 765;

    validItems.slice(0, maxItemsToShow).forEach((itemText) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        drawRoundedRect(ctx, 64, itemY, 592, 54, 16);
        ctx.fill();

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`• ${truncateText(ctx, itemText, 530)}`, 96, itemY + 34);
        itemY += 66;
    });

    if (validItems.length > maxItemsToShow) {
        ctx.font = 'italic 16px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        const moreItemsText = (t('moreItemsCount') || '+ {count} objetos más...').replace('{count}', validItems.length - maxItemsToShow);
        ctx.fillText(moreItemsText, 360, itemY + 20);
    }

    // 7. Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    drawRoundedRect(ctx, 160, 1160, 400, 52, 26);
    ctx.fill();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('pokeboxvalue.com', 360, 1192);

    return canvasToBlob(canvas);
}

/**
 * Sticker Cuadrado (512x512) para Discord / WhatsApp
 */
async function generateStickerCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [] }) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, 512, 512);
    }

    const cardX = 16, cardY = 16, cardW = 480, cardH = 480, radius = 32;
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    grad.addColorStop(0, isProfitable ? '#064e3b' : '#881337');
    grad.addColorStop(0.5, isProfitable ? '#022c22' : '#4c0519');
    grad.addColorStop(1, isProfitable ? '#064e3b' : '#881337');
    ctx.fillStyle = grad;
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    ctx.strokeStyle = isProfitable ? '#34d399' : '#fb7185';
    ctx.lineWidth = 3;
    ctx.stroke();

    const logoImg = await loadCanvasImage('/favicon.svg', 250);
    const hasLogo = logoImg.complete && logoImg.naturalHeight !== 0;

    if (hasLogo) {
        ctx.drawImage(logoImg, 44, 38, 40, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('PokeBoxValue', 94, 66);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PokeBoxValue', 256, 66);
    }

    const gradeLabel = t('grade' + grade) || (isProfitable ? t('titleProfitable') : t('titleNotProfitable'));
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 256, 115);

    const mainTitle = isProfitable ? (t('titleProfitable') || '¡OFERTA RENTABLE!') : (t('titleNotProfitable') || 'NO VALE LA PENA');
    ctx.font = '900 30px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(mainTitle, 256, 155);

    const fmtBox = formatCanvasCurrency(boxPrice, currencySymbol);
    const fmtTot = formatCanvasCurrency(totalValue, currencySymbol);
    const fmtDif = formatCanvasCurrency(diff, currencySymbol);
    const diffSign = isProfitable ? '+' : '-';

    ctx.font = '900 44px sans-serif';
    ctx.fillStyle = isProfitable ? '#34d399' : '#fb7185';
    ctx.fillText(`${diffSign}${Math.abs(fmtDif)} ${currencySymbol}`, 256, 215);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawRoundedRect(ctx, 44, 245, 424, 80, 16);
    ctx.fill();

    ctx.font = '600 14px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(t('resBoxPrice') || 'Precio Caja:', 64, 280);
    ctx.fillText(t('resRealValue') || 'Valor Real:', 64, 310);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`${fmtBox} ${currencySymbol}`, 448, 280);
    ctx.fillText(`${fmtTot} ${currencySymbol}`, 448, 310);

    const validItems = Array.isArray(items) ? items : [];
    if (validItems.length > 0) {
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(truncateText(ctx, validItems.slice(0, 4).join(' • '), 400), 256, 365);
    }

    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('pokeboxvalue.com', 256, 455);

    return canvasToBlob(canvas);
}
