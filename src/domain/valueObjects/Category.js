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
    static normalizeKey(catKey, itemName = '') {
        const cleanCat = String(catKey || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        const cleanName = String(itemName || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

        const combined = `${cleanCat} ${cleanName}`;

        if (combined.includes('pase') || combined.includes('raid') || combined.includes('pass')) return 'pases';
        if (combined.includes('incubadora') || combined.includes('incubator')) return 'incubadoras';
        if (combined.includes('potenciador') || combined.includes('booster') || combined.includes('huevo suerte') || combined.includes('lucky egg') || combined.includes('trozo estrella') || combined.includes('star piece') || combined.includes('incienso') || combined.includes('incense') || combined.includes('modulo cebo') || combined.includes('lure')) return 'potenciadores';
        if (combined.includes('mejora') || combined.includes('upgrade') || combined.includes('almacenamiento') || combined.includes('storage') || combined.includes('aumento de espacio') || combined.includes('bag upgrade') || combined.includes('medallon') || combined.includes('medallion')) return 'mejoras';
        if (combined.includes('combate') || combined.includes('battle') || combined.includes('particula') || combined.includes('particle') || combined.includes('carga union') || combined.includes('fusion energy') || combined.includes('maxiseta') || combined.includes('max mushroom') || combined.includes('radar')) return 'combates';
        if (combined.includes('consumible') || combined.includes('consumable') || combined.includes('pocion') || combined.includes('potion') || combined.includes('reviv') || combined.includes('baya') || combined.includes('berry') || combined.includes('pokocho') || combined.includes('poffin')) return 'consumibles';

        if (this.CATEGORY_MAP[cleanCat] && cleanCat !== 'otros') return cleanCat;

        return 'otros';
    }

    /**
     * Devuelve la clave i18n asociada a la categoría.
     */
    static getI18nKey(catKey) {
        const normalized = this.normalizeKey(catKey);
        return this.CATEGORY_MAP[normalized] || `cat${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
    }
}
