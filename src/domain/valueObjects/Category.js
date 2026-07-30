/**
 * Value Object para la gestión y normalización de categorías de objetos.
 */
export class Category {
    static get CATEGORY_MAP() {
        return {
            'pases': 'catPases',
            'incubadoras': 'catIncubadoras',
            'potenciadores': 'catPotenciadores',
            'mejoras': 'catMejoras',
            'combates': 'catCombates',
            'consumibles': 'catConsumibles',
            'otros': 'catOtros'
        };
    }

    /**
     * Normaliza cualquier nombre de categoría a la clave estándar.
     */
    static normalizeKey(catKey) {
        if (!catKey) return 'otros';

        const clean = String(catKey)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        if (clean.includes('pase') || clean.includes('raid') || clean.includes('pass')) return 'pases';
        if (clean.includes('incubadora') || clean.includes('incubator')) return 'incubadoras';
        if (clean.includes('potenciador') || clean.includes('booster')) return 'potenciadores';
        if (clean.includes('mejora') || clean.includes('upgrade')) return 'mejoras';
        if (clean.includes('combate') || clean.includes('battle') || clean.includes('particle')) return 'combates';
        if (clean.includes('pocion') || clean.includes('reviv') || clean.includes('potion')) return 'consumibles';

        return this.CATEGORY_MAP[clean] ? clean : 'otros';
    }

    /**
     * Devuelve la clave i18n asociada a la categoría.
     */
    static getI18nKey(catKey) {
        const normalized = this.normalizeKey(catKey);
        return this.CATEGORY_MAP[normalized] || `cat${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
    }
}
