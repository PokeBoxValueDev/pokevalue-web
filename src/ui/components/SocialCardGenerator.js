/**
 * Genera una tarjeta visual PNG mediante HTML5 Canvas para compartir en redes sociales.
 */
import { t } from '../../i18n/i18n.js';

export async function generateSocialCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol }) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Fondo degradado más premium
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    if (isProfitable) {
        grad.addColorStop(0, '#059669'); // Emerald 600
        grad.addColorStop(1, '#064e3b'); // Emerald 900
    } else {
        grad.addColorStop(0, '#e11d48'); // Rose 600
        grad.addColorStop(1, '#881337'); // Rose 900
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // 2. Borde decorativo interior suave
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(20, 20, 560, 360, 24);
        ctx.stroke();
    } else {
        ctx.strokeRect(20, 20, 560, 360);
    }

    // 3. Cargar el icono de la web (favicon)
    const logoImg = new Image();
    // Prevenir el taint del canvas (aunque sea del mismo dominio por seguridad)
    logoImg.crossOrigin = "Anonymous";
    logoImg.src = 'favicon.svg'; 

    await new Promise(resolve => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
    });

    // 4. Dibujar Logo y Título perfectamente centrados sin superposición
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    
    const titleText = 'PokeBoxValue';
    const textMetrics = ctx.measureText(titleText);
    const textWidth = textMetrics.width;
    const hasLogo = logoImg.complete && logoImg.naturalHeight !== 0;
    const logoWidth = hasLogo ? 40 : 0;
    const gap = hasLogo ? 12 : 0;
    const totalWidth = logoWidth + gap + textWidth;
    const startX = (600 - totalWidth) / 2;

    if (hasLogo) {
        ctx.drawImage(logoImg, startX, 42, 40, 40);
    }

    ctx.textAlign = 'left';
    ctx.fillText(titleText, startX + logoWidth + gap, 73);

    // 5. Insignia Rango
    let gradeLabel = t('grade' + grade) || '🔴 Grado F (Pésima Compra)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = isProfitable ? '#34d399' : '#fb7185'; // Verde esmeralda o Rosa salmón pastel
    ctx.fillText(gradeLabel, 300, 115);

    // 6. Panel de Valores (Efecto Glassmorphism)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(50, 145, 500, 160, 20);
    } else {
        ctx.rect(50, 145, 500, 160);
    }
    ctx.fill();

    // 7. Textos y Valores
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(t('resBoxPrice') || 'Precio Caja:', 80, 190);
    ctx.fillText(t('resRealValue') || 'Valor Real:', 80, 230);
    ctx.fillText(t(isProfitable ? 'resDiffSave' : 'resDiffLose') || (isProfitable ? 'Ahorras:' : 'Pierdes:'), 80, 270);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'right';
    // Formatear sin decimales si son monedas
    const isCoins = currencySymbol === '🟡' || currencySymbol === 'coins';
    const fmtBox = isCoins ? Math.round(boxPrice) : Number(boxPrice).toFixed(2);
    const fmtTot = isCoins ? Math.round(totalValue) : Number(totalValue).toFixed(2);
    const fmtDif = isCoins ? Math.round(diff) : Number(diff).toFixed(2);

    ctx.fillText(`${fmtBox} ${currencySymbol}`, 520, 190);
    ctx.fillText(`${fmtTot} ${currencySymbol}`, 520, 230);

    ctx.font = '900 28px sans-serif';
    ctx.fillStyle = isProfitable ? '#10b981' : '#f43f5e'; // Verde vibrante o rojo brillante
    const diffText = isProfitable ? `+${Math.abs(fmtDif)} ${currencySymbol}` : `-${Math.abs(fmtDif)} ${currencySymbol}`;
    ctx.fillText(diffText, 520, 270);

    // Separadores sutiles dentro del panel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(80, 205);
    ctx.lineTo(520, 205);
    ctx.moveTo(80, 245);
    ctx.lineTo(520, 245);
    ctx.stroke();

    // 8. Marca de agua footer
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(t('shareCanvasWatermark') || 'Calculado en pokeboxvalue.com', 300, 350);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}
