/**
 * Entidad de Dominio que representa un objeto de la tienda.
 * Desacopla la lógica interna del formato DTO recibido externamente.
 */
export class Item {
    constructor({
        id,
        nameEs,
        nameEn,
        category,
        unitPriceEur = 0,
        unitPriceUsd = null,
        unitPriceCoins = null,
        svg = ''
    }) {
        this.id = id;
        this.nameEs = nameEs || 'Objeto';
        this.nameEn = nameEn || nameEs || 'Item';
        this.category = category || 'otros';
        this.unitPriceEur = Number(unitPriceEur) || 0;
        this.unitPriceUsd = unitPriceUsd !== null && unitPriceUsd !== undefined ? Number(unitPriceUsd) : null;
        this.unitPriceCoins = unitPriceCoins !== null && unitPriceCoins !== undefined ? Number(unitPriceCoins) : null;
        this.svg = svg;
    }

    /**
     * Obtiene el nombre del objeto según el idioma solicitado.
     */
    getLocalizedName(lang = 'es') {
        return (lang === 'en' && this.nameEn) ? this.nameEn : this.nameEs;
    }

    /**
     * Calcula el precio unitario según la divisa activa y las tasas configuradas.
     */
    calculateUnitPrice(currentCurrency, currencyConfig) {
        const curr = currencyConfig[currentCurrency] || { rate: 1, symbol: '€' };

        if (currentCurrency === 'POKECOINS') {
            if (this.unitPriceCoins !== null) {
                return this.unitPriceCoins;
            }
            return Math.round(this.unitPriceEur * curr.rate);
        }

        if (currentCurrency === 'USD' && this.unitPriceUsd !== null) {
            return this.unitPriceUsd;
        }

        return this.unitPriceEur * curr.rate;
    }
}
