/**
 * Genera una tarjeta visual PNG mediante HTML5 Canvas para compartir en redes sociales.
 */
import { t } from '../../../js/i18n.js';

export async function generateSocialCardCanvas({ boxPrice, totalValue, diff, isProfitable, grade, currencySymbol }) {
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, 600, 400);
    if (isProfitable) {
        grad.addColorStop(0, '#059669');
        grad.addColorStop(1, '#047857');
    } else {
        grad.addColorStop(0, '#e11d48');
        grad.addColorStop(1, '#be123c');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 400);

    // Borde decorativo interior
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.strokeRect(16, 16, 568, 368);

    // Título principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PokeBoxValue', 300, 65);

    // Insignia Rango
    let gradeLabel = t('grade' + grade) || '🔴 Grado F (Pésima Compra)';

    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(gradeLabel, 300, 100);

    // Panel de Valores
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(50, 130, 500, 150, 16);
    } else {
        ctx.rect(50, 130, 500, 150);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${t('resBoxPrice')} ${boxPrice} ${currencySymbol}`, 80, 175);
    ctx.fillText(`${t('resRealValue')} ${totalValue} ${currencySymbol}`, 80, 215);

    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'right';
    const diffText = isProfitable ? `+${Math.abs(diff)} ${currencySymbol}` : `-${Math.abs(diff)} ${currencySymbol}`;
    ctx.fillText(diffText, 520, 195);

    // Marca de agua footer
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(t('shareCanvasWatermark'), 300, 345);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
}
