/**
 * Genera una tarjeta visual PNG mediante HTML5 Canvas para compartir en redes sociales.
 */
import { t } from '../../i18n/i18n.js';

export async function generateSocialCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol, items = [] }) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 440;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fondo degradado más premium
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

    // 2. Borde decorativo interior suave
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(20, 20, 560, 400, 24);
        ctx.stroke();
    } else {
        ctx.strokeRect(20, 20, 560, 400);
    }

    // 3. Cargar el icono de la web (favicon)
    const logoImg = new Image();
    logoImg.crossOrigin = "Anonymous";
    logoImg.src = 'favicon.svg';

    await new Promise(resolve => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
    });

    // 4. Dibujar Logo y Título perfectamente centrados sin superposición
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
    let gradeLabel = t('grade' + grade) || '🔴 Grado F (Pésima Compra)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isProfitable ? '#a7f3d0' : '#fecdd3';
    ctx.fillText(gradeLabel, 300, 96);

    // 6. Contenedor de Lista de Objetos comparados
    const itemsListStr = Array.isArray(items) && items.length > 0
        ? items.join(', ')
        : '';

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

        let displayItems = `📦 ${itemsListStr}`;
        if (ctx.measureText(displayItems).width > 470) {
            while (displayItems.length > 5 && ctx.measureText(displayItems + '...').width > 470) {
                displayItems = displayItems.slice(0, -1);
            }
            displayItems += '...';
        }
        ctx.fillText(displayItems, 300, 135);
    }

    // 7. Panel de Valores (Efecto Glassmorphism)
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

    // Separadores sutiles dentro del panel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, panelY + 60);
    ctx.lineTo(520, panelY + 60);
    ctx.moveTo(80, panelY + 108);
    ctx.lineTo(520, panelY + 108);
    ctx.stroke();

    // 9. Marca de agua footer
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(t('shareCanvasWatermark') || 'Calculado en pokeboxvalue.com', 300, 395);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}
