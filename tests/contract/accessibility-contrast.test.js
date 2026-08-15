import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_CONFIG } from '../../src/config/config.js';

// Paleta oficial de colores Tailwind CSS v3/v4 para cálculo determinista de luminancia
const TAILWIND_COLORS = {
    'white': '#ffffff',
    'black': '#000000',
    'gray-50': '#f9fafb',
    'gray-100': '#f3f4f6',
    'gray-200': '#e5e7eb',
    'gray-300': '#d1d5db',
    'gray-400': '#9ca3af',
    'gray-500': '#6b7280',
    'gray-600': '#4b5563',
    'gray-700': '#374151',
    'gray-800': '#1f2937',
    'gray-900': '#111827',
    
    // Indigo (Pases)
    'indigo-50': '#eef2ff',
    'indigo-100': '#e0e7ff',
    'indigo-300': '#a5b4fc',
    'indigo-500': '#6366f1',
    'indigo-600': '#4f46e5',
    'indigo-700': '#4338ca',
    'indigo-900': '#312e81',
    'indigo-950': '#1e1b4b',

    // Amber (Incubadoras)
    'amber-50': '#fffbeb',
    'amber-100': '#fef3c7',
    'amber-300': '#fcd34d',
    'amber-500': '#f59e0b',
    'amber-600': '#d97706',
    'amber-700': '#b45309',
    'amber-900': '#78350f',
    'amber-950': '#451a03',

    // Purple (Potenciadores)
    'purple-50': '#faf5ff',
    'purple-100': '#f3e8ff',
    'purple-300': '#d8b4fe',
    'purple-500': '#a855f7',
    'purple-600': '#9333ea',
    'purple-700': '#7e22ce',
    'purple-900': '#581c87',
    'purple-950': '#3b0764',

    // Emerald (Mejoras)
    'emerald-50': '#ecfdf5',
    'emerald-100': '#d1fae5',
    'emerald-300': '#6ee7b7',
    'emerald-500': '#10b981',
    'emerald-600': '#059669',
    'emerald-700': '#047857',
    'emerald-900': '#064e3b',
    'emerald-950': '#022c22',

    // Rose (Combates)
    'rose-50': '#fff1f2',
    'rose-100': '#ffe4e6',
    'rose-300': '#fda4af',
    'rose-500': '#f43f5e',
    'rose-600': '#e11d48',
    'rose-700': '#be123c',
    'rose-900': '#881337',
    'rose-950': '#4c0519',

    // Cyan (Consumibles)
    'cyan-50': '#ecfeff',
    'cyan-100': '#cffafe',
    'cyan-300': '#67e8f9',
    'cyan-500': '#06b6d4',
    'cyan-600': '#0891b2',
    'cyan-700': '#0e7490',
    'cyan-900': '#164e63',
    'cyan-950': '#083344',

    // Sky (Otros)
    'sky-50': '#f0f9ff',
    'sky-100': '#e0f2fe',
    'sky-300': '#7dd3fc',
    'sky-500': '#0ea5e9',
    'sky-600': '#0284c7',
    'sky-700': '#0369a1',
    'sky-900': '#0c4a6e',
    'sky-950': '#082f49'
};

function hexToRgb(hex) {
    const cleanHex = hex.replace('#', '');
    const num = parseInt(cleanHex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

/**
 * Fórmula oficial W3C para Luminancia Relativa (WCAG 2.1 / 2.2)
 */
function calculateLuminance(rgb) {
    const a = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Calcula el ratio de contraste exacto entre dos colores RGB (1:1 a 21:1)
 */
function getContrastRatio(hex1, hex2) {
    const lum1 = calculateLuminance(hexToRgb(hex1));
    const lum2 = calculateLuminance(hexToRgb(hex2));
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function parseTailwindColor(colorClass) {
    if (!colorClass) return null;
    const clean = colorClass.replace(/^(text-|bg-|border-)/, '').split('/')[0];
    return TAILWIND_COLORS[clean] || null;
}

test('accessibility/contrast - Todas las cabeceras de categoría cumplen WCAG 2.1 Nivel AA (≥ 4.5:1) en Modo Claro', () => {
    for (const [key, cfg] of Object.entries(CATEGORY_CONFIG)) {
        // Extraer color de fondo en modo claro (ej: bg-indigo-50)
        const lightBgClass = cfg.bg.split(' ')[0];
        const lightTextClass = cfg.text.split(' ')[0];

        const bgHex = parseTailwindColor(lightBgClass) || TAILWIND_COLORS['white'];
        const textHex = parseTailwindColor(lightTextClass) || TAILWIND_COLORS['gray-900'];

        const ratio = getContrastRatio(bgHex, textHex);
        assert.ok(
            ratio >= 4.5,
            `Categoría "${key}" en Modo Claro no cumple WCAG AA: Ratio = ${ratio.toFixed(2)}:1 (Mínimo requerido: 4.5:1). Fondo: ${bgHex}, Texto: ${textHex}`
        );
    }
});

test('accessibility/contrast - Todas las cabeceras de categoría cumplen WCAG 2.1 Nivel AA (≥ 4.5:1) en Modo Oscuro', () => {
    for (const [key, cfg] of Object.entries(CATEGORY_CONFIG)) {
        // Extraer color de fondo en modo oscuro (ej: dark:bg-indigo-950/60)
        const darkBgClass = cfg.bg.split(' ').find(c => c.startsWith('dark:bg-'))?.replace('dark:', '') || 'gray-900';
        const darkTextClass = cfg.text.split(' ').find(c => c.startsWith('dark:text-'))?.replace('dark:', '') || 'white';

        const bgHex = parseTailwindColor(darkBgClass) || TAILWIND_COLORS['gray-900'];
        const textHex = parseTailwindColor(darkTextClass) || TAILWIND_COLORS['white'];

        const ratio = getContrastRatio(bgHex, textHex);
        assert.ok(
            ratio >= 4.5,
            `Categoría "${key}" en Modo Oscuro no cumple WCAG AA: Ratio = ${ratio.toFixed(2)}:1 (Mínimo requerido: 4.5:1). Fondo: ${bgHex}, Texto: ${textHex}`
        );
    }
});

test('accessibility/contrast - Píldoras de filtro activas cumplen ratio de contraste con texto blanco (≥ 3.0:1 / UI Component)', () => {
    const activePillColors = [
        TAILWIND_COLORS['indigo-600'],
        TAILWIND_COLORS['amber-600'],
        TAILWIND_COLORS['purple-600'],
        TAILWIND_COLORS['emerald-600'],
        TAILWIND_COLORS['rose-600'],
        TAILWIND_COLORS['cyan-600'],
        TAILWIND_COLORS['sky-600']
    ];

    for (const bgHex of activePillColors) {
        const ratio = getContrastRatio(bgHex, TAILWIND_COLORS['white']);
        assert.ok(
            ratio >= 3.0,
            `Píldora con fondo ${bgHex} no alcanza el contraste mínimo de 3.0:1 para elementos de control activo. Ratio = ${ratio.toFixed(2)}:1`
        );
    }
});
