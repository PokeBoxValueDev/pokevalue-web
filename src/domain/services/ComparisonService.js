import { ValuationService } from './ValuationService.js';

/**
 * Servicio de Dominio para comparar la rentabilidad relativa y valor de dos cajas de la tienda.
 */
export class ComparisonService {
    /**
     * Compara dos ofertas y determina la ganadora junto con métricas diferenciales.
     * @param {Object} boxA - { price: number, quantities: Object, name?: string }
     * @param {Object} boxB - { price: number, quantities: Object, name?: string }
     * @param {Array} items - Lista de items de la tienda.
     * @param {string} currency - EUR, USD, POKECOINS.
     * @param {string} lang - es / en.
     * @returns {Object} Resultado comparativo { resultA, resultB, winner: 'A'|'B'|'EQUAL', diffPercent: number, summary: string }
     */
    static compare(boxA, boxB, items = [], currency = 'EUR', lang = 'es') {
        const resultA = ValuationService.calculate(boxA.price, boxA.quantities, items, currency, lang);
        const resultB = ValuationService.calculate(boxB.price, boxB.quantities, items, currency, lang);

        let winner = 'EQUAL';
        let diffPercent = 0;

        if (resultA.savingsPercent > resultB.savingsPercent) {
            winner = 'A';
            diffPercent = Number((resultA.savingsPercent - resultB.savingsPercent).toFixed(1));
        } else if (resultB.savingsPercent > resultA.savingsPercent) {
            winner = 'B';
            diffPercent = Number((resultB.savingsPercent - resultA.savingsPercent).toFixed(1));
        }

        return {
            resultA,
            resultB,
            winner,
            diffPercent
        };
    }
}
