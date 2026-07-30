import { CalculationResult } from '../models/CalculationResult.js';
import { Category } from '../valueObjects/Category.js';
import { CURRENCY_CONFIG } from '../../config/config.js';
import { ItemMapper } from '../../infrastructure/mappers/ItemMapper.js';

/**
 * Servicio de Dominio encargado de la valoración de rentabilidad de cajas.
 */
export class ValuationService {
    /**
     * Evalúa el contenido de una caja frente al precio introducido.
     * @param {number} boxPrice - Precio de la caja introducido por el usuario.
     * @param {Object} quantities - Mapa de ID de objeto a cantidad seleccionada { [id]: qty }.
     * @param {Array} items - Lista de entidades Item o DTOs.
     * @param {string} currentCurrency - Divisa seleccionada (EUR, USD, POKECOINS).
     * @param {string} currentLang - Idioma para la síntesis de nombres ('es' / 'en').
     * @returns {CalculationResult}
     */
    static calculate(boxPrice, quantities, items = [], currentCurrency = 'EUR', currentLang = 'es') {
        const parsedPrice = Number(boxPrice) || 0;
        let totalValue = 0;
        const itemSummary = [];
        const categoryTotals = {
            pases: 0,
            incubadoras: 0,
            potenciadores: 0,
            mejoras: 0,
            combates: 0,
            consumibles: 0,
            otros: 0
        };

        const domainItems = (items && items.length > 0 && typeof items[0].calculateUnitPrice === 'function')
            ? items
            : ItemMapper.toDomainList(items);

        const itemMap = new Map(domainItems.map(item => [String(item.id), item]));

        Object.entries(quantities).forEach(([itemId, qty]) => {
            const count = Number(qty) || 0;
            const item = itemMap.get(String(itemId));

            if (item && count > 0) {
                const unitPrice = item.calculateUnitPrice(currentCurrency, CURRENCY_CONFIG);
                const itemVal = unitPrice * count;
                totalValue += itemVal;

                const catKey = Category.normalizeKey(item.category || item.nameEs);
                if (categoryTotals[catKey] !== undefined) {
                    categoryTotals[catKey] += itemVal;
                } else {
                    categoryTotals.otros += itemVal;
                }

                const localizedName = item.getLocalizedName(currentLang);
                itemSummary.push(`${count}x ${localizedName}`);
            }
        });

        const diff = totalValue - parsedPrice;
        const isProfitable = diff > 0;
        const savingsPercent = parsedPrice > 0 ? (diff / parsedPrice) * 100 : 0;

        return new CalculationResult({
            boxPrice: parsedPrice,
            totalValue,
            diff,
            savingsPercent,
            isProfitable,
            categoryTotals,
            itemSummary
        });
    }
}
