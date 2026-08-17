/**
 * Genera una tarjeta visual PNG mediante HTML5 Canvas para compartir en redes sociales.
 * Soporta formato 'post' (horizontal), 'story' (vertical 9:16) y 'sticker' (cuadrado 512x512 para Discord/WhatsApp).
 */
import { t } from '../../i18n/i18n.js';

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
    if (isProfitable) {
        grad.addColorStop(0, '#059669'); // Emerald 600
        grad.addColorStop(1, '#064e3b'); // Emerald 900
    } else {
        grad.addColorStop(0, '#e11d48'); // Rose 600
        grad.addColorStop(1, '#881337'); // Rose 900
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 440);

    // 2. Borde decorativo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(20, 20, 560, 400, 24);
        ctx.stroke();
    } else {
        ctx.strokeRect(20, 20, 560, 400);
    }

    // 3. Logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = '/favicon.png';

    await new Promise(resolve => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
        setTimeout(resolve, 250);
    });

    // 4. Logo y Título
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px sans-serif';

    const titleText = 'PokeBoxValue';
    const textMetrics = ctx.measureText(titleText);
    const textWidth = textMetrics.width;
    const hasLogo = logoImg.complete && logoImg.naturalHeight !== 0;
    const logoWidth = hasLogo ? 36 : 0;
    const gap = hasLogo ? 10 : 0;
    const totalWidth = logoWidth + gap + textWidth;
    const startX = (600 - totalWidth) / 2;

    if (hasLogo) {
        ctx.drawImage(logoImg, startX, 36, 36, 36);
    }

    ctx.textAlign = 'left';
    ctx.fillText(titleText, startX + logoWidth + gap, 64);

    // 5. Insignia Rango
    const gradeLabel = t('grade' + grade) || (isProfitable ? 'Excelente compra' : 'Mala compra');
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 300, 96);

    // 6. Contenedor de Lista de Objetos
    const itemsListStr = Array.isArray(items) && items.length > 0 ? items.join(', ') : '';

    if (itemsListStr) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(50, 110, 500, 40, 12);
        } else {
            ctx.rect(50, 110, 500, 40);
        }
        ctx.fill();

        ctx.font = '500 15px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';

        let displayItems = itemsListStr;
        if (ctx.measureText(displayItems).width > 470) {
            while (displayItems.length > 5 && ctx.measureText(displayItems + '...').width > 470) {
                displayItems = displayItems.slice(0, -1);
            }
            displayItems += '...';
        }
        ctx.fillText(displayItems, 300, 135);
    }

    // 7. Panel de Valores
    const panelY = itemsListStr ? 162 : 120;
    const panelHeight = 165;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(50, panelY, 500, panelHeight, 20);
    } else {
        ctx.rect(50, panelY, 500, panelHeight);
    }
    ctx.fill();

    // 8. Textos y Valores
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '17px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('resBoxPrice') || 'Precio Caja:', 80, panelY + 44);
    ctx.fillText(t('resRealValue') || 'Valor Real:', 80, panelY + 92);
    ctx.fillText(t(isProfitable ? 'resDiffSave' : 'resDiffLose') || (isProfitable ? 'Ahorras:' : 'Pierdes:'), 80, panelY + 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';

    const isCoins = currencySymbol === '🟡' || currencySymbol === 'coins';
    const fmtBox = isCoins ? Math.round(boxPrice) : Number(boxPrice).toFixed(2);
    const fmtTot = isCoins ? Math.round(totalValue) : Number(totalValue).toFixed(2);
    const fmtDif = isCoins ? Math.round(diff) : Number(diff).toFixed(2);

    ctx.fillText(`${fmtBox} ${currencySymbol}`, 520, panelY + 44);
    ctx.fillText(`${fmtTot} ${currencySymbol}`, 520, panelY + 92);

    ctx.font = '900 26px sans-serif';
    ctx.fillStyle = isProfitable ? '#10b981' : '#f43f5e';
    const diffText = isProfitable ? `+${Math.abs(fmtDif)} ${currencySymbol}` : `-${Math.abs(fmtDif)} ${currencySymbol}`;
    ctx.fillText(diffText, 520, panelY + 140);

    // Separadores
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, panelY + 60);
    ctx.lineTo(520, panelY + 60);
    ctx.moveTo(80, panelY + 108);
    ctx.lineTo(520, panelY + 108);
    ctx.stroke();

    // 9. Marca de agua
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(t('shareCanvasWatermark') || 'Calculado en pokeboxvalue.com', 300, 395);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}

/**
 * Tarjeta Vertical 9:16 (720x1280) para Instagram Stories, TikTok y Estados de WhatsApp
 */
async function generateStoryCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [] }) {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fondo Vertical con degradado enriquecido
    const grad = ctx.createLinearGradient(0, 0, 0, 1280);
    if (isProfitable) {
        grad.addColorStop(0, '#064e3b'); // Emerald 900
        grad.addColorStop(0.35, '#047857'); // Emerald 700
        grad.addColorStop(1, '#022c22'); // Emerald 950
    } else {
        grad.addColorStop(0, '#881337'); // Rose 900
        grad.addColorStop(0.35, '#be123c'); // Rose 700
        grad.addColorStop(1, '#4c0519'); // Rose 950
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 720, 1280);

    // 2. Borde exterior suave con esquinas redondeadas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 3;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(32, 32, 656, 1216, 36);
        ctx.stroke();
    }

    // 3. Logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = '/favicon.png';

    await new Promise(resolve => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
        setTimeout(resolve, 250);
    });

    // 4. Cabecera Top (Logo + PokeBoxValue)
    const hasLogo = logoImg.complete && logoImg.naturalHeight !== 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px sans-serif';
    ctx.textAlign = 'center';

    if (hasLogo) {
        ctx.drawImage(logoImg, 360 - 180, 80, 52, 52);
        ctx.textAlign = 'left';
        ctx.fillText('PokeBoxValue', 360 - 115, 120);
    } else {
        ctx.fillText('PokeBoxValue', 360, 120);
    }

    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('CALCULADORA DE CAJAS POKÉMON GO', 360, 155);

    // 5. Tarjeta Hero / Veredicto Principal (Glassmorphism)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(64, 200, 592, 280, 28);
    } else {
        ctx.rect(64, 200, 592, 280);
    }
    ctx.fill();

    // Insignia de Calificación
    const gradeLabel = t('grade' + grade) || (isProfitable ? 'Excelente compra' : 'Mala compra');
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 360, 250);

    // Título Principal de la Oferta
    ctx.font = '900 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    const mainTitle = isProfitable ? (t('titleProfitable') || 'RENTA COMPRARLA') : (t('titleNotProfitable') || 'NO RENTA COMPRARLA');
    ctx.fillText(mainTitle, 360, 310);

    // Diferencia y Ahorro Destacado
    const isCoins = currencySymbol === '🟡' || currencySymbol === 'coins';
    const fmtBox = isCoins ? Math.round(boxPrice) : Number(boxPrice).toFixed(2);
    const fmtTot = isCoins ? Math.round(totalValue) : Number(totalValue).toFixed(2);
    const fmtDif = isCoins ? Math.round(diff) : Number(diff).toFixed(2);
    const diffText = isProfitable ? `+${Math.abs(fmtDif)} ${currencySymbol}` : `-${Math.abs(fmtDif)} ${currencySymbol}`;

    ctx.font = '900 56px sans-serif';
    ctx.fillStyle = isProfitable ? '#34d399' : '#fb7185';
    ctx.fillText(diffText, 360, 395);

    ctx.font = '600 18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const diffSublabel = isProfitable ? (t('resDiffSave') || 'Ahorro estimado') : (t('resDiffLose') || 'Pérdida estimada');
    ctx.fillText(diffSublabel, 360, 435);

    // 6. Panel de Comparativa Detallada (Precio vs Valor Real)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(64, 510, 592, 170, 24);
    } else {
        ctx.rect(64, 510, 592, 170);
    }
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

    // 7. Lista de Objetos de la Caja
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(t('storyItemsTitle') || 'OBJETOS INCLUIDOS', 360, 725);

    const validItems = Array.isArray(items) ? items : [];
    const maxItemsToShow = 6;
    const itemsToRender = validItems.slice(0, maxItemsToShow);

    let itemY = 765;
    itemsToRender.forEach((itemText) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(64, itemY, 592, 54, 16);
        } else {
            ctx.rect(64, itemY, 592, 54);
        }
        ctx.fill();

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        
        let trimmed = itemText;
        if (ctx.measureText(trimmed).width > 530) {
            while (trimmed.length > 5 && ctx.measureText(trimmed + '...').width > 530) {
                trimmed = trimmed.slice(0, -1);
            }
            trimmed += '...';
        }
        ctx.fillText(`• ${trimmed}`, 96, itemY + 34);

        itemY += 66;
    });

    if (validItems.length > maxItemsToShow) {
        ctx.font = 'italic 16px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(`+ ${validItems.length - maxItemsToShow} objetos más...`, 360, itemY + 20);
    }

    // 8. Footer / Marca de Agua Story
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(160, 1160, 400, 52, 26);
    } else {
        ctx.rect(160, 1160, 400, 52);
    }
    ctx.fill();

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('pokeboxvalue.com', 360, 1192);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}

/**
 * Sticker Cuadrado Ultranítido (512x512) para Discord / WhatsApp Stickers
 */
async function generateStickerCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [] }) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Limpiar fondo transparente
    if (typeof ctx.clearRect === 'function') {
        ctx.clearRect(0, 0, 512, 512);
    }

    // 2. Fondo de tarjeta estilizada con sombra y esquinas redondeadas
    const cardX = 16, cardY = 16, cardW = 480, cardH = 480, radius = 32;

    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    if (isProfitable) {
        grad.addColorStop(0, '#064e3b'); // Emerald 900
        grad.addColorStop(0.5, '#022c22'); // Emerald 950
        grad.addColorStop(1, '#064e3b');
    } else {
        grad.addColorStop(0, '#881337'); // Rose 900
        grad.addColorStop(0.5, '#4c0519'); // Rose 950
        grad.addColorStop(1, '#881337');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    } else {
        ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.fill();

    // Borde de acento
    ctx.strokeStyle = isProfitable ? '#34d399' : '#fb7185';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = '/favicon.png';

    await new Promise(resolve => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
        setTimeout(resolve, 250);
    });

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

    // 4. Insignia Rango
    const gradeLabel = t('grade' + grade) || (isProfitable ? 'Excelente compra' : 'Mala compra');
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 256, 115);

    // 5. Veredicto Grande
    const mainTitle = isProfitable ? (t('titleProfitable') || '¡RENTA!') : (t('titleNotProfitable') || '¡NO RENTA!');
    ctx.font = '900 30px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(mainTitle, 256, 155);

    // 6. Diferencia de Ahorro / Pérdida
    const isCoins = currencySymbol === '🟡' || currencySymbol === 'coins';
    const fmtBox = isCoins ? Math.round(boxPrice) : Number(boxPrice).toFixed(2);
    const fmtTot = isCoins ? Math.round(totalValue) : Number(totalValue).toFixed(2);
    const fmtDif = isCoins ? Math.round(diff) : Number(diff).toFixed(2);
    const diffText = isProfitable ? `+${Math.abs(fmtDif)} ${currencySymbol}` : `-${Math.abs(fmtDif)} ${currencySymbol}`;

    ctx.font = '900 44px sans-serif';
    ctx.fillStyle = isProfitable ? '#34d399' : '#fb7185';
    ctx.fillText(diffText, 256, 215);

    // 7. Comparativa Precio vs Valor Real
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(44, 245, 424, 80, 16);
    } else {
        ctx.rect(44, 245, 424, 80);
    }
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

    // 8. Objetos incluidos (resumen compacto)
    const validItems = Array.isArray(items) ? items : [];
    if (validItems.length > 0) {
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        let itemsStr = validItems.slice(0, 4).join(' • ');
        if (ctx.measureText(itemsStr).width > 400) {
            while (itemsStr.length > 5 && ctx.measureText(itemsStr + '...').width > 400) {
                itemsStr = itemsStr.slice(0, -1);
            }
            itemsStr += '...';
        }
        ctx.fillText(itemsStr, 256, 365);
    }

    // 9. Marca de agua
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('pokeboxvalue.com', 256, 455);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}

